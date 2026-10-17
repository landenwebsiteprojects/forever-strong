#!/usr/bin/env python3
"""Exercise the real shell backend against an isolated synthetic Android filesystem."""
import base64, json, os, pathlib, shutil, subprocess, tempfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
results=[]
with tempfile.TemporaryDirectory(prefix='halloween-test-') as tmp:
    env=dict(os.environ,HE_ROOT=tmp,HE_VALIDATOR_CLASSES=os.environ.get('HE_VALIDATOR_CLASSES',str(ROOT.parent/'build-tools/validator-classes')))
    mod=pathlib.Path(tmp)/'data/adb/modules/halloweenedition'
    shutil.copytree(ROOT/'module',mod)
    backend=mod/'bin/control.sh'
    def run(*args,ok=True):
        r=subprocess.run(['sh',str(backend),*args],env=env,capture_output=True,text=True)
        assert (r.returncode==0)==ok,(args[0:2],r.returncode,r.stdout,r.stderr)
        return r.stdout.strip()
    enc=lambda x:base64.b64encode(x.encode()).decode()
    def test(name,fn):fn();results.append({'test':name,'result':'PASS'})
    def target():
        text='# target modes\ncom.example.auto\ncom.example.leaf?\ncom.example.generate!\n'
        run('write','targets',enc(text));assert run('read','targets')==text.strip()
        run('write','targets',enc('com.example.auto\ncom.example.auto!'),ok=False)
        run('write','targets',enc('x; touch /tmp/escaped'),ok=False)
        assert run('read','targets')==text.strip()
    test('Target modes persist; duplicate and injection syntax rejected without mutation',target)
    def patch():
        text='all=YYYY-MM-05\nvendor=device_default\nboot=no\n[com.example.auto]\nsystem=2024-02-29\n'
        run('write','patch',enc(text));assert run('read','patch')==text.strip()
        for bad in ['all=2025-02-29','all=2026-19-01','all=2026-04-31','wrong=20260101']:
            run('write','patch',enc(bad),ok=False)
        assert run('read','patch')==text.strip()
    test('Per-package patch sections, placeholders and date validation',patch)
    def keybox():
        valid=(ROOT/'module/tricky/keybox.xml').read_text()
        run('write','keybox',enc(valid));key=pathlib.Path(tmp)/'data/adb/tricky_store/keybox.xml';assert key.read_text()==valid
        run('read','keybox',ok=False)
        run('write','keybox',enc('<!DOCTYPE x [<!ENTITY s SYSTEM "file:///etc/passwd">]><AndroidAttestation>&s;</AndroidAttestation>'),ok=False)
        run('write','keybox',enc(valid.replace('NumberOfKeyboxes>1','NumberOfKeyboxes>9')),ok=False)
        assert key.read_text()==valid
        assert key.stat().st_mode&0o077==0
    test('Keybox XML/key/chain validation, entity rejection, no display and private permissions',keybox)
    def hash_test():
        run('write','hash',enc('a'*64));assert run('read','hash')=='a'*64
        run('write','hash',enc('z'*64),ok=False);run('write','hash',enc(''),ok=True)
    test('Boot digest length, hex and empty configuration',hash_test)
    def recovery():
        run('flag','safemode','1');snapshot=run('backup')
        original=run('read','targets');run('write','targets',enc('com.other.app!\n'));run('flag','safemode','0')
        run('restore',snapshot);assert run('read','targets')==original;assert 'safemode=1' in run('flags')
        run('restore','../../etc',ok=False);assert snapshot in run('backups')
        assert (pathlib.Path(tmp)/'data/adb/halloweenedition/backups'/snapshot/'files/keybox').stat().st_mode&0o077==0
    test('Secure backup, atomic restore, flag restoration and traversal rejection',recovery)
    def safeguards():
        ts=pathlib.Path(tmp)/'data/adb/tricky_store';(ts/'target.txt').unlink();(ts/'target.txt').symlink_to('/etc/passwd')
        run('write','targets',enc('com.example.app'),ok=False)
        state=pathlib.Path(tmp)/'data/adb/halloweenedition';(state/'write.lock').mkdir();run('backup',ok=False);(state/'write.lock').rmdir()
    test('Symlink writes and simultaneous transactions refused',safeguards)
    def privacy():
        out=run('diagnostics');assert 'PRIVATE KEY' not in out and 'BEGIN CERTIFICATE' not in out
        assert 'verdict' in out
    test('Diagnostic output excludes private keys and makes no measured verdict claim',privacy)
    def uninstall():
        subprocess.run(['sh',str(mod/'uninstall.sh')],env=env,capture_output=True,check=True)
        assert (pathlib.Path(tmp)/'data/adb/tricky_store/keybox.xml').exists()
        assert (pathlib.Path(tmp)/'data/adb/Box-Brain').exists()
    test('Uninstall preserves shared configuration and backups',uninstall)
print(json.dumps(results,indent=2))
(ROOT/'docs/BACKEND-TEST-RESULTS.json').write_text(json.dumps(results,indent=2)+'\n')
