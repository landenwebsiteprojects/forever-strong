#!/usr/bin/env python3
"""Reproduce the exact fixed-width path relocation from original v45 payloads."""
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[1]
source=root/'upstream/integrity-box-v45-archive'
old=b'/data/adb/modules/playintegrityfix';new=b'/data/adb/modules/halloweenedition'
assert len(old)==len(new)
for entry in json.loads((root/'docs/NATIVE-RELOCATION.json').read_text()):
    rel=entry['path'];data=(source/rel).read_bytes()
    assert hashlib.sha256(data).hexdigest()==entry['original_sha256']
    patched=data.replace(old,new)
    assert len(patched)==len(data)
    assert hashlib.sha256(patched).hexdigest()==entry['relocated_sha256']
    (root/'module'/rel).write_bytes(patched)
    print(rel,entry['occurrences'],'fixed-width paths')
