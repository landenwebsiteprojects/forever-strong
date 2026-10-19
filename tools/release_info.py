#!/usr/bin/env python3
"""Derive release filenames and the manager update feed from module metadata."""
from pathlib import Path
import json, re, sys

ROOT = Path(__file__).resolve().parents[1]
PROPS = dict(line.split('=', 1) for line in (ROOT / 'module/module.prop').read_text().splitlines() if '=' in line)
VERSION = PROPS['version']
VERSION_CODE = int(PROPS['versionCode'])
assert re.fullmatch(r'v[0-9]+\.[0-9]+(?:\.[0-9]+)?', VERSION), 'Use a release version such as v1.1 or v1.1.1'
assert PROPS['id'] == 'halloweenedition', 'Published module identity must be preserved'
assert VERSION_CODE > 10004
REPO = 'landenwebsiteprojects/forever-strong'
STEM = 'ForeverStrong-' + VERSION
OUT = ROOT.parent / 'release'
UPDATE_URL = f'https://github.com/{REPO}/releases/latest/download/update.json'

def manifest():
    return {
        'version': VERSION,
        'versionCode': VERSION_CODE,
        'zipUrl': f'https://github.com/{REPO}/releases/download/{VERSION}/{STEM}.zip',
        'changelog': f'https://github.com/{REPO}/releases/download/{VERSION}/RELEASE-NOTES.md',
    }

if __name__ == '__main__':
    if '--github-output' in sys.argv:
        print(f'tag={VERSION}\nversion_code={VERSION_CODE}\nstem={STEM}')
    else:
        print(json.dumps(manifest(), indent=2))
