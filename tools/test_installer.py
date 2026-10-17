#!/usr/bin/env python3
import pathlib,shutil,tempfile,subprocess,json,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
results=[]
def scenario(abi='arm64',conflict=False,legacy=False,unknown=False,upgrade=False,corrupt=False,missing=False,manager='magisk',no_resetprop=False,bootmode=True,stale_magisk=False):
 with tempfile.TemporaryDirectory(prefix='halloween-installer-') as tmp:
  t=pathlib.Path(tmp);data=t/'data/adb';sd=t/'sdcard'
  tools=t/'bin';tools.mkdir()
  if manager=='magisk':
   (data/'magisk').mkdir(parents=True);(data/'magisk/util_functions.sh').touch()
  elif manager in ['kernelsu','kernelsu-next']:
   (data/'ksu/bin').mkdir(parents=True)
   # A leftover Magisk installation must not beat an explicit KSU flag.
   if stale_magisk:(data/'magisk').mkdir();(data/'magisk/util_functions.sh').touch()
  elif manager=='apatch':(data/'ap/bin').mkdir(parents=True)
  if not no_resetprop:
   rp=tools/'resetprop';rp.write_text('#!/bin/sh\nexit 0\n');rp.chmod(0o755)
  stage=data/'modules_update/halloweenedition';stage.mkdir(parents=True)
  # Reproduce the Manager's extraction filter from the final ZIP, not a source-tree copy.
  with zipfile.ZipFile(ROOT.parent/'release/ForeverStrong-v1.0.zip') as archive:
   for name in archive.namelist():
    if not name.startswith('META-INF/'):archive.extract(name,stage)
  assert not (stage/'META-INF').exists()
  if corrupt:(stage/'tricky/classes.dex').write_bytes(b'damaged payload')
  if missing:(stage/'tricky/classes.dex').unlink()
  ts=data/'tricky_store';ts.mkdir();(ts/'target.txt').write_text('com.user.existing?\n');(ts/'security_patch.txt').write_text('[com.user.existing]\nall=20250101\n')
  sentinel=data/'modules/unrelated/personal.txt';sentinel.parent.mkdir(parents=True);sentinel.write_text('retain')
  if conflict:
   d=data/'modules/playintegrityfix';d.mkdir();(d/'module.prop').write_text('id=playintegrityfix\n')
  if upgrade:
   old=data/'modules/halloweenedition';shutil.copytree(ROOT/'module',old);(old/'custom.pif.prop').write_text('MODEL=User saved model\n');(old/'stop').touch()
  if legacy:
   old=data/'modules/playintegrityfix';old.mkdir(exist_ok=True);(old/'disable').touch();(old/'custom.pif.prop').write_text('MODEL=Migration model\n')
   (data/'service.d').mkdir()
   import re
   s=(ROOT/'upstream/integrity-box-v44-archive/customize.sh').read_text()
   for name in ['hash.sh','prop.sh','lineage.sh','.box_cleanup.sh']:
    marker='cat <<\'EOF\' > "$boot/'+name+'"\n';a=s.index(marker)+len(marker);v=s[a:s.index('\nEOF',a)]+'\n';(data/'service.d'/name).write_text(v)
  if unknown:
   (data/'service.d').mkdir(exist_ok=True);(data/'service.d/hash.sh').write_text('echo unrelated hook\n')
  script=(ROOT/'module/customize.sh').read_text().replace('/data/adb',str(data)).replace('/sdcard',str(sd))
  # Source the real helper from staged payload; HE_ROOT isolates its filesystem probes.
  flags={'magisk':'','kernelsu':'KSU=true','kernelsu-next':'KSU=true\nKSU_NEXT=true','apatch':'APATCH=true\nMAGISK_VER_CODE=27000','unknown':''}[manager]
  wrapper='''#!/bin/sh
ui_print(){ echo "$*"; }
abort(){ echo "ABORT: $*" >&2; exit 71; }
set_perm_recursive(){ :; }
'''+f'BOOTMODE={str(bootmode).lower()}\nAPI=34\nARCH={abi}\nMODPATH="{stage}"\nHE_ROOT="{t}"\nPATH="{tools}:$PATH"\n{flags}\n'+script
  runfile=t/'install-test.sh';runfile.write_text(wrapper)
  r=subprocess.run(['sh',str(runfile)],capture_output=True,text=True)
  if conflict or unknown or corrupt or missing or manager=='unknown' or no_resetprop or not bootmode:
   assert r.returncode==71,(r.stdout,r.stderr)
   if corrupt or missing:assert 'tricky/classes.dex' in r.stdout+r.stderr,(r.stdout,r.stderr)
   assert sentinel.read_text()=='retain';assert (ts/'target.txt').read_text()=='com.user.existing?\n';return
  assert r.returncode==0,(r.stdout,r.stderr)
  assert (data/'halloweenedition/root-manager').read_text().strip()==('kernelsu' if manager=='kernelsu-next' else manager)
  assert sentinel.read_text()=='retain'
  assert (ts/'target.txt').read_text()=='com.user.existing?\n'
  assert (ts/'security_patch.txt').read_text()=='[com.user.existing]\nall=20250101\n'
  assert (stage/'tricky/inject').stat().st_mode&0o111
  assert 'Installation completed' in r.stdout
  if upgrade:assert (stage/'custom.pif.prop').read_text()=='MODEL=User saved model\n' and (stage/'stop').exists()
  if legacy:
   assert (stage/'custom.pif.prop').read_text()=='MODEL=Migration model\n'
   assert (data/'modules/playintegrityfix').exists()
   assert not (data/'service.d/.box_cleanup.sh').exists()
   assert len(list((data/'halloweenedition/migration').glob('*/hooks/.box_cleanup.sh')))==1
for abi in ['arm64','arm','x64','x86']:
 scenario(abi);results.append({'test':'Install staging and correct payload selection: '+abi,'result':'PASS'})
for label,kwargs in [('Active conflicting module aborts without deletion',{'conflict':True}),('Exact baseline service hooks quarantined; disabled module and settings retained',{'legacy':True}),('Unrecognized generic service hook aborts untouched',{'unknown':True}),('Upgrade retains module config and paused state',{'upgrade':True}),('Damaged DEX rejected with Manager-style extraction',{'corrupt':True}),('Missing DEX rejected with Manager-style extraction',{'missing':True})]:
 scenario(**kwargs);results.append({'test':label,'result':'PASS'})
print(json.dumps(results,indent=2));(ROOT/'docs/INSTALLER-TEST-RESULTS.json').write_text(json.dumps(results,indent=2)+'\n')

for manager in ['kernelsu','kernelsu-next','apatch']:
 scenario(manager=manager);scenario(manager=manager,upgrade=True)
 results.append({'test':manager+' install and upgrade preserve config without Magisk dependency','result':'PASS'})
for label,kw in [('Unknown manager rejected',{'manager':'unknown'}),('Missing resetprop rejected before mutation',{'no_resetprop':True}),('Recovery installation rejected',{'bootmode':False})]:
 scenario(**kw);results.append({'test':label,'result':'PASS'})
print(json.dumps(results,indent=2));(ROOT/'docs/INSTALLER-TEST-RESULTS.json').write_text(json.dumps(results,indent=2)+'\n')

scenario(manager='kernelsu',stale_magisk=True)
results.append({'test':'KernelSU flags outrank leftover Magisk directory','result':'PASS'})
(ROOT/'docs/INSTALLER-TEST-RESULTS.json').write_text(json.dumps(results,indent=2)+'\n')
