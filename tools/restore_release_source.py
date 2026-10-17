#!/usr/bin/env python3
"""Verify transport chunks, restore the exact source ZIP and export its contents."""
from pathlib import Path
import hashlib,json,shutil,stat,zipfile
ROOT=Path(__file__).resolve().parents[1]
manifest=ROOT/'.source-upload/manifest.json'
if not manifest.exists():raise SystemExit('Source transport manifest is absent; this one-time publication has already completed or is incomplete.')
m=json.loads(manifest.read_text())
release=ROOT.parent/'release';release.mkdir(exist_ok=True)
archive=release/'ForeverStrong-v1.0-Source.zip'
with archive.open('wb') as out:
 for part in m['parts']:
  name=part['name']
  if Path(name).name!=name:raise SystemExit('Unsafe source part name')
  data=(ROOT/'.source-upload'/name).read_bytes()
  if len(data)!=part['bytes'] or hashlib.sha256(data).hexdigest()!=part['sha256']:raise SystemExit('Source part checksum mismatch')
  out.write(data)
if hashlib.sha256(archive.read_bytes()).hexdigest()!=m['source_sha256']:raise SystemExit('Source archive checksum mismatch')
for name,digest in m['artifacts'].items():
 if Path(name).name!=name:raise SystemExit('Unsafe artifact name')
 if name==archive.name:continue
 data=(ROOT/name).read_bytes()
 if hashlib.sha256(data).hexdigest()!=digest:raise SystemExit('Artifact checksum mismatch: '+name)
 (release/name).write_bytes(data)
with zipfile.ZipFile(archive) as z:
 if z.testzip() is not None:raise SystemExit('Source ZIP CRC failed')
 for info in z.infolist():
  p=Path(info.filename)
  if p.is_absolute() or '..' in p.parts or '.git' in p.parts:raise SystemExit('Unsafe source ZIP path')
  dest=ROOT/p
  if not dest.resolve().is_relative_to(ROOT.resolve()):raise SystemExit('Source path escaped checkout')
  z.extract(info,ROOT)
  if not info.is_dir():dest.chmod((info.external_attr>>16)&0o777 or 0o644)
print('Verified complete source archive and release artifacts; source restored.')
