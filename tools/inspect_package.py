#!/usr/bin/env python3
from pathlib import Path
import hashlib,zipfile,json,subprocess
from release_info import STEM, VERSION

ROOT=Path(__file__).resolve().parents[1];zip_path=ROOT.parent/'release'/(STEM+'.zip')
with zipfile.ZipFile(zip_path) as z:
 assert z.testzip() is None
 names=z.namelist();assert len(names)==len(set(names))
 assert names.count('module.prop')==1 and sum(n.endswith('/module.prop') for n in names)==0
 assert all(not n.startswith('/') and '..' not in Path(n).parts for n in names)
 assert 'id=halloweenedition\n' in z.read('module.prop').decode()
 assert ('version='+VERSION+'\n') in z.read('module.prop').decode()
 manifest_lines=z.read('files.sha256').decode().splitlines()
 expected_payload={name for name in names if not name.startswith('META-INF/') and name!='files.sha256'}
 assert {line.split('  ',1)[1] for line in manifest_lines}==expected_payload
 for line in manifest_lines:
  digest,name=line.split('  ',1);assert hashlib.sha256(z.read(name)).hexdigest()==digest,name
 for name in ['META-INF/com/google/android/update-binary','post-fs-data.sh','service.sh','uninstall.sh','customize.sh','tricky/daemon','bin/control.sh']:
  assert (z.getinfo(name).external_attr>>16)&0o111,name
 assert z.read('tricky/classes.dex').startswith(b'dex\n')
 assert z.read('bin/validator.dex').startswith(b'dex\n')
 for n in names:
  if n.endswith('.so'):assert z.read(n).startswith(b'\x7fELF'),n
 result={'zip':zip_path.name,'entries':len(names),'manifest_files':len(z.read('files.sha256').decode().splitlines()),'result':'PASS','sha256':hashlib.sha256(zip_path.read_bytes()).hexdigest()}
 print(json.dumps(result,indent=2));(ROOT/'docs/PACKAGE-TEST-RESULTS.json').write_text(json.dumps(result,indent=2)+'\n')
