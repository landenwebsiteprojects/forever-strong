#!/usr/bin/env python3
"""Select active-manager tools in isolated boot and WebUI environments."""
from pathlib import Path
import tempfile,subprocess,os,json
ROOT=Path(__file__).resolve().parents[1]
results=[]
with tempfile.TemporaryDirectory() as tmp:
 t=Path(tmp)
 for manager,folder,flags in [('magisk','magisk',{}),('kernelsu','ksu/bin',{'KSU':'true'}),('apatch','ap/bin',{'APATCH':'true','MAGISK_VER_CODE':'27000'})]:
  d=t/'data/adb'/folder;d.mkdir(parents=True,exist_ok=True)
  p=d/'resetprop';p.write_text('#!/bin/sh\nprintf "%s\\n" "'+manager+'"\n');p.chmod(0o755)
  state=t/'data/adb/halloweenedition';state.mkdir(exist_ok=True);(state/'root-manager').write_text(manager+'\n')
  for use_flags in [True,False]:
   env=dict(os.environ,HE_ROOT=tmp)
   for k in ['KSU','APATCH','KERNELPATCH','HE_INSTALLING']:env.pop(k,None)
   if use_flags:env.update(flags)
   out=subprocess.check_output(['sh','-c','. "$1"; he_setup_runtime; printf "%s\\n" "$HE_ROOT_MANAGER"; resetprop; he_root_label','sh',str(ROOT/'module/bin/root-compat.sh')],env=env,text=True).splitlines()
   assert out[0]==manager and out[1]==manager,out
   results.append({'test':manager+(' environment' if use_flags else ' WebUI marker')+' selects matching property binary','result':'PASS'})
print(json.dumps(results,indent=2));(ROOT/'docs/ROOT-COMPAT-TEST-RESULTS.json').write_text(json.dumps(results,indent=2)+'\n')
