#!/usr/bin/env python3
"""Integration descriptor, owned lifecycle and actual repair orchestration with isolated stand-ins."""
import json,os,pathlib,shutil,subprocess,tempfile,time,signal
ROOT=pathlib.Path(__file__).resolve().parents[1]
results=[]
with tempfile.TemporaryDirectory(prefix='halloween-engine-') as tmp:
    t=pathlib.Path(tmp);mod=t/'data/adb/modules/halloweenedition';shutil.copytree(ROOT/'module',mod)
    engine=mod/'tricky';state=t/'data/adb/halloweenedition';config=t/'data/adb/tricky_store';config.mkdir(parents=True)
    shutil.copy2(engine/'lib/arm64-v8a/libinject.so',engine/'inject');shutil.copy2(engine/'lib/arm64-v8a/libTrickyStoreOSS.so',engine/'libTrickyStoreOSS.so')
    # Stand-in daemon: no Android or native command is executed.
    (engine/'daemon').write_text('#!/bin/sh\nexec python3 -c "import time; time.sleep(600)" "$1/classes.dex"\n');(engine/'daemon').chmod(0o755)
    mockbin=t/'bin';mockbin.mkdir();(mockbin/'pidof').write_text('#!/bin/sh\n[ -f "$HE_ROOT/foreign-process" ] && { echo 999999; exit 0; }; exit 1\n');(mockbin/'pidof').chmod(0o755)
    # The execution harness uses a PID namespace with a host-mounted /proc. Map only
    # test sed stat paths into that namespace's host PID; shipped module code is untouched.
    (mockbin/'sed').write_text("""#!/usr/bin/env python3
import os,sys,pathlib,re
args=sys.argv[1:]
if args and re.fullmatch(r'/proc/[0-9]+/stat',args[-1]) and not pathlib.Path(args[-1]).exists():
    wanted=args[-1].split('/')[2]; ns=os.readlink('/proc/self/ns/pid')
    for p in pathlib.Path('/proc').iterdir():
        if not p.name.isdigit():continue
        try:
            if os.readlink(p/'ns/pid')!=ns:continue
            row=next(x for x in (p/'status').read_text().splitlines() if x.startswith('NSpid:'))
            if row.split()[-1]==wanted:args[-1]=str(p/'stat');break
        except (OSError,StopIteration):pass
os.execv('/bin/sed',['sed',*args])
""")
    (mockbin/'sed').chmod(0o755)
    env=dict(os.environ,HE_ROOT=tmp,PATH=str(mockbin)+':'+os.environ['PATH'])
    def run(*args,ok=True):
        r=subprocess.run(['sh',str(mod/'bin/control.sh'),*args],env=env,capture_output=True,text=True,timeout=35)
        assert (r.returncode==0)==ok,(args,r.returncode,r.stdout,r.stderr)
        return r.stdout.strip()
    def status():return dict(line.split('=',1) for line in run('engine-status').splitlines() if '=' in line)
    def record(label):results.append({'test':label,'result':'PASS'})
    try:
        assert not (t/'data/adb/modules/tricky_store').exists()
        s=status();assert s['owner']=='halloweenedition' and s['installed']=='1' and s['config']==str(config)
        record('Bundled engine detected with no standalone Tricky Store module directory')
        stale=t/'data/adb/teesim';stale.mkdir();(stale/'config.json').write_text('{}')
        assert status()['external_teesim']=='0'
        ext=t/'data/adb/modules/teesim';ext.mkdir();(ext/'module.prop').write_text('id=teesim\n');(ext/'disable').touch()
        assert status()['external_teesim']=='0';(ext/'disable').unlink();assert status()['external_teesim']=='1';(ext/'disable').touch()
        record('External sync detection distinguishes stale, disabled and enabled external modules')
        run('engine-ensure');first=(state/'tricky-worker.pid').read_text();assert status()['running']=='1'
        run('engine-ensure');assert (state/'tricky-worker.pid').read_text()==first
        record('Idempotent ensure keeps one owned daemon and supervisor')
        run('engine-restart');second=(state/'tricky-worker.pid').read_text();assert second!=first and status()['running']=='1'
        record('Restart refreshes the owned daemon under the existing supervisor')
        # Execute the real repair control with a local action stand-in to avoid upstream downloads.
        (mod/'integrity-action.sh').write_text('#!/bin/sh\necho integrated-action >> "$HE_ROOT/action.calls"\nexit 0\n')
        (config/'keys').mkdir();(config/'keys/persisted.bin').write_bytes(b'RETAIN-APP-KEY')
        (config/'key_db').mkdir();(config/'key_db/cache').write_text('legacy cache')
        (config/'target.txt').write_text('com.example.app?\n');(config/'security_patch.txt').write_text('all=device_default\n');(config/'keybox.xml').write_text((ROOT/'module/tricky/keybox.xml').read_text())
        before=(state/'tricky-worker.pid').read_text();out=run('repair')
        assert 'Repair workflow completed' in out and (state/'tricky-worker.pid').read_text()!=before
        assert (t/'action.calls').read_text().splitlines()==['integrated-action']
        assert (config/'keys/persisted.bin').read_bytes()==b'RETAIN-APP-KEY'
        assert (config/'target.txt').read_text()=='com.example.app?\n' and (config/'security_patch.txt').read_text()=='all=device_default\n'
        assert list((state/'legacy-cache-backups').glob('*/key_db/cache')) and not (config/'key_db/cache').exists()
        record('Repair routes to bundled engine, runs action once, archives legacy caches and preserves native app keys/modes/patches')
        (mod/'integrity-action.sh').write_text('#!/bin/sh\nexit 7\n')
        run('repair',ok=False)
        record('Action failure is reported as partial repair, never a successful repair')
        (mod/'disable').touch();run('repair',ok=False);run('engine-restart',ok=False);(mod/'disable').unlink()
        record('Disabled unified module blocks repair and restart')
        (engine/'inject').unlink();assert status()['installed']=='0';run('repair',ok=False)
        record('Incomplete bundled native payload is accurately diagnosed')
        shutil.copy2(engine/'lib/arm64-v8a/libinject.so',engine/'inject')
        supervisor=int((state/'tricky-supervisor.pid').read_text().split()[0]);os.kill(supervisor,signal.SIGTERM)
        for _ in range(30):
            if not (state/'tricky-supervisor.pid').exists():break
            time.sleep(.1)
        sentinel=subprocess.Popen(['python3','-c','import time;time.sleep(30)'])
        try:
            (state/'tricky-worker.pid').write_text(str(sentinel.pid)+' 1\n')
            assert status()['running']=='0'
            (t/'foreign-process').touch()
            run('engine-restart',ok=False)
            assert sentinel.poll() is None
            record('Stale PID token cannot claim or terminate an unrelated process; foreign daemon is refused')
        finally:
            sentinel.terminate();sentinel.wait(timeout=5)

    finally:
        # Terminate only fixture processes recorded by our own isolated supervisor.
        if (state/'tricky-supervisor.pid').exists():
            try:os.kill(int((state/'tricky-supervisor.pid').read_text().split()[0]),signal.SIGTERM)
            except ProcessLookupError:pass
        time.sleep(.2)
        if (state/'tricky-worker.pid').exists():
            try:os.kill(int((state/'tricky-worker.pid').read_text().split()[0]),signal.SIGTERM)
            except ProcessLookupError:pass
print(json.dumps(results,indent=2));(ROOT/'docs/ENGINE-TEST-RESULTS.json').write_text(json.dumps(results,indent=2)+'\n')
