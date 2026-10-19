#!/usr/bin/env python3
"""Deterministic packaging of audited payloads, source and local UI. Python 3.11+."""
from pathlib import Path
import hashlib,json,os,stat,zipfile
from release_info import VERSION, STEM, manifest
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT.parent/'release';OUT.mkdir(exist_ok=True)
mod=ROOT/'module'
# Magisk/Kitsune's default installer deliberately omits META-INF/* from MODPATH.
# Keep those ZIP bootstrap files, but verify only the installed module payload here.
files=[p for p in sorted(mod.rglob('*')) if p.is_file() and p.name!='files.sha256' and p.relative_to(mod).parts[0]!='META-INF']
(mod/'files.sha256').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.relative_to(mod).as_posix()+'\n' for p in files))
def package(base,dest,exclude=()):
    with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for p in sorted(base.rglob('*')):
            if not p.is_file() or any(x in p.parts for x in exclude):continue
            if base==ROOT and p.parent==ROOT and p.name.startswith('ForeverStrong-') and p.suffix=='.zip':continue
            rel=p.relative_to(base).as_posix();i=zipfile.ZipInfo(rel,(2026,10,18,0,0,0));i.create_system=3
            mode=0o755 if p.suffix=='.sh' or p.name in ['gradlew','daemon','update-binary'] else 0o644
            i.external_attr=(stat.S_IFREG|mode)<<16;i.compress_type=zipfile.ZIP_DEFLATED
            z.writestr(i,p.read_bytes())
package(mod,OUT/(STEM+'.zip'))
package(ROOT,OUT/(STEM+'-Source.zip'),('.git','.source-upload','node_modules','__pycache__'))
for n in ['README.md','docs/BUILD-AND-TEST-REPORT.md','CHANGELOG.md','ATTRIBUTION.md','docs/FOREVER-STRONG-UI-REPORT.md','docs/ROOT-COMPATIBILITY-REPORT.md','docs/RELEASE-NOTES.md','docs/V1.1-VALIDATION.md']:
    import shutil
    p=ROOT/n
    if p.exists():shutil.copy2(p,OUT/p.name)
(OUT/'update.json').write_text(json.dumps(manifest(),indent=2)+'\n')
artifacts=[p for p in sorted(OUT.iterdir()) if p.is_file() and not p.name.endswith('SHA256SUMS.txt') and (not p.name.startswith('ForeverStrong-') or p.name.startswith(STEM+'-') or p.name==STEM+'.zip')]
(OUT/(STEM+'-SHA256SUMS.txt')).write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in artifacts))
print(json.dumps([{'name':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in artifacts],indent=2))
