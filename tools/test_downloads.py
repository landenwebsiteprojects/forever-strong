#!/usr/bin/env python3
"""Exercise real fallback and keybox staging code with isolated transport fixtures."""
from pathlib import Path
import base64, codecs, hashlib, json, os, shutil, subprocess, tempfile

ROOT = Path(__file__).resolve().parents[1]
RESULTS = []
def record(name):
    RESULTS.append({'test': name, 'result': 'PASS'})

with tempfile.TemporaryDirectory(prefix='forever-download-') as tmp:
    t = Path(tmp); bins = t / 'bin'; bins.mkdir()
    fake = '''#!/bin/sh
tool=${0##*/}
printf '%s %s\\n' "$tool" "$*" >> "$HE_ATTEMPTS"
if [ "$tool" = busybox ]; then
  case "$1" in
    timeout) shift 2; exec "$@";;
    nslookup) printf 'Server: 1.1.1.1\\nAddress: 1.1.1.1:53\\n\\nName: %s\\nAddress: 192.0.2.17\\n' "$2"; exit 0;;
    wget) shift; tool=bbwget;;
  esac
fi
original="$*"; out=''
while [ "$#" -gt 0 ]; do
  case "$1" in -O|--output) shift; out=$1;; esac
  shift
done
case "$HE_TRANSPORT_MODE:$tool" in
  wget:wget|busybox:bbwget|curl:curl) cp "$HE_PAYLOAD" "$out"; exit 0;;
  empty:*) : > "$out"; exit 0;;
  dns:curl) case "$original" in *--resolve*github.com:443:192.0.2.17*release-assets.githubusercontent.com:443:192.0.2.17*) cp "$HE_PAYLOAD" "$out"; exit 0;; esac;;
esac
echo "wget: bad address 'github.com'" >&2
exit 6
'''
    for name in ['curl', 'wget', 'busybox']:
        p = bins / name; p.write_text(fake); p.chmod(0o755)
    # Host containers may lack xxd; Android provides it through the platform or BusyBox.
    if not shutil.which('xxd'):
        hex_tool = bins / 'xxd'
        hex_tool.write_text('#!/usr/bin/env python3\nimport pathlib,sys\nsys.stdout.buffer.write(bytes.fromhex(pathlib.Path(sys.argv[-1]).read_text()))\n')
        hex_tool.chmod(0o755)
    payload = t / 'payload'; payload.write_bytes(b'fixture data')
    attempts = t / 'attempts'; output = t / 'download'
    env = dict(os.environ, PATH=str(bins) + ':' + os.environ['PATH'], HE_PAYLOAD=str(payload), HE_ATTEMPTS=str(attempts), HE_DOWNLOAD_BUSYBOX=str(bins / 'busybox'))
    for mode, ok in [('curl', True), ('wget', True), ('busybox', True), ('dns', True), ('fail', False), ('empty', False)]:
        output.write_bytes(b'previous data'); attempts.write_text(''); env['HE_TRANSPORT_MODE'] = mode
        run = subprocess.run(['sh', '-c', '. "$1"; he_download_file "$2" "$3"', 'sh', str(ROOT / 'module/bin/download.sh'), str(output), 'https://github.com/MeowDump/Integrity-Box/releases/download/archive/Megatron'], env=env, capture_output=True, text=True, timeout=20)
        assert (run.returncode == 0) == ok, (mode, run.stderr)
        assert output.read_bytes() == (b'fixture data' if ok else b'previous data'), mode
        assert not list(t.glob('download.download.*')), mode
        log = attempts.read_text(); assert '--insecure' not in log and '--no-check-certificate' not in log
        if mode == 'wget': assert log.index('curl ') < log.index('wget ')
        if mode == 'fail': assert 'DNS resolution failed' in run.stderr
        if mode == 'dns': assert '--resolve' in log and 'nslookup github.com 1.1.1.1' in log
        record({'curl': 'Initial native transport success', 'wget': 'Failed curl falls through to wget without a flag', 'busybox': 'Failed native transports fall through to BusyBox', 'dns': 'DNS failure retries per request with TLS hostnames and redirect hosts', 'fail': 'Exhausted DNS fallback reports failure and preserves existing output', 'empty': 'Zero-byte successful responses never replace existing output'}[mode])
    mod = t / 'data/adb/modules/halloweenedition'; (mod / 'bin').mkdir(parents=True); (mod / 'webroot/common_scripts').mkdir(parents=True)
    shutil.copyfile(ROOT / 'module/bin/download.sh', mod / 'bin/download.sh')
    (mod / 'common_func.sh').write_text('P(){ :; }\nhe_external_enabled(){ return 1; }\n')
    adb = t / 'data/adb'; localtmp = t / 'data/local/tmp'; localtmp.mkdir(parents=True)
    ts = adb / 'tricky_store'; ts.mkdir(); active = ts / 'keybox.xml'
    validator = t / 'app_process'; validator.write_text('#!/bin/sh\nshift\nexec java -cp "$HE_VALIDATOR_CLASSES" "$@"\n'); validator.chmod(0o755)
    script = (ROOT / 'module/webroot/common_scripts/key.sh').read_text().replace('/data/adb', str(adb)).replace('/data/local/tmp', str(localtmp)).replace('/system/bin/app_process', str(validator))
    entry = mod / 'webroot/common_scripts/key.sh'; entry.write_text(script)
    def encode(data):
        data = codecs.encode(data.decode(), 'rot_13').encode().hex().encode()
        for _ in range(10): data = base64.b64encode(data)
        return data
    valid = (ROOT / 'module/tricky/keybox.xml').read_bytes()
    for mode, incoming, ok in [('curl', b'invalid base64', False), ('curl', encode(b'<not-a-keybox/>'), False), ('fail', encode(valid), False), ('curl', encode(valid), True)]:
        active.write_bytes(b'previous private key sentinel'); payload.write_bytes(incoming); env['HE_TRANSPORT_MODE'] = mode
        run = subprocess.run(['sh', str(entry)], env=env, capture_output=True, text=True, timeout=20)
        assert (run.returncode == 0) == ok, (mode, run.stdout, run.stderr)
        assert active.read_bytes() == (valid if ok else b'previous private key sentinel')
        assert not list(ts.glob('.keybox.*'))
        if ok: assert active.stat().st_mode & 0o777 == 0o600
    record('Real keybox pipeline preserves active keys on download, decoding and XML/crypto validation failure; validated success installs atomically with private permissions')

for entry in json.loads((ROOT / 'docs/NATIVE-RELOCATION.json').read_text()):
    original = (ROOT / 'upstream/integrity-box-v45-archive' / entry['path']).read_bytes()
    relocated = (ROOT / 'module' / entry['path']).read_bytes()
    assert hashlib.sha256(original).hexdigest() == entry['original_sha256']
    assert hashlib.sha256(relocated).hexdigest() == entry['relocated_sha256']
    assert original.replace(b'/data/adb/modules/playintegrityfix', b'/data/adb/modules/halloweenedition') == relocated
record('All three native ABI libraries come from official v45, with only fixed-width module-path relocation')
assert not (ROOT / 'module/legacy').exists(); record('No v44 legacy native payload remains installed')
print(json.dumps(RESULTS, indent=2))
(ROOT / 'docs/DOWNLOAD-TEST-RESULTS.json').write_text(json.dumps(RESULTS, indent=2) + '\n')

# Execute the actual v45 action sequence with isolated stage implementations.
with tempfile.TemporaryDirectory(prefix='forever-action-') as tmp:
    t=Path(tmp); mod=t/'module'; (mod/'webroot/common_scripts').mkdir(parents=True)
    trace=t/'trace'
    functions=['print_header','cleanup_root_logs','cleanup_ota','cleanup_lsposed','cleanup_gapps_logs','reset_tricky_store','download_keybox','update_targets','handle_security_patch','restart_google_services','update_module_description','handle_delay']
    common='step(){ echo "$1" >> "$HE_TRACE"; [ "$HE_FAIL_STAGE" != "$1" ]; }\n'
    common+=''.join(name+'(){ step '+name+'; }\n' for name in functions)
    (mod/'common_func.sh').write_text(common)
    (mod/'webroot/common_scripts/cleanup.sh').write_text('exit 0\n')
    (mod/'osm0sis.sh').write_text('echo fingerprint >> "$HE_TRACE"\n[ "$HE_FAIL_STAGE" != fingerprint ]\n')
    action=(ROOT/'module/integrity-action.sh').read_text().replace('/data/adb/Box-Brain',str(t/'box'))
    entry=mod/'integrity-action.sh'; entry.write_text(action)
    for stage in ['download_keybox','fingerprint','update_targets','handle_security_patch','none']:
        trace.write_text(''); env=dict(os.environ,HE_TRACE=str(trace),HE_FAIL_STAGE=stage,KSU_NEXT='false')
        run=subprocess.run(['sh',str(entry)],env=env,capture_output=True,text=True,timeout=10)
        assert (run.returncode==0)==(stage=='none'),(stage,run.stdout,run.stderr)
        assert ('ACTION COMPLETED SUCCESSFULLY' in run.stdout)==(stage=='none')
        if stage=='download_keybox': assert 'fingerprint' not in trace.read_text()
        if stage=='fingerprint': assert 'restart_google_services' not in trace.read_text()
record('Actual v45 action stops on failed download, fingerprint, target or patch stage and never reports false completion')
(ROOT/'docs/DOWNLOAD-TEST-RESULTS.json').write_text(json.dumps(RESULTS,indent=2)+'\n')
