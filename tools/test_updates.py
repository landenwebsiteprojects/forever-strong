#!/usr/bin/env python3
"""Check the exact feed and ZIP that native root managers will receive."""
from pathlib import Path
import json, zipfile
from release_info import PROPS, VERSION, VERSION_CODE, STEM, OUT, UPDATE_URL, manifest
ROOT = Path(__file__).resolve().parents[1]
assert PROPS['updateJson'] == UPDATE_URL
feed = json.loads((OUT / 'update.json').read_text())
assert feed == manifest()
assert isinstance(feed['versionCode'], int) and feed['versionCode'] > 10004
assert feed['version'] == VERSION
assert feed['zipUrl'].endswith('/' + VERSION + '/' + STEM + '.zip')
assert feed['changelog'].endswith('/' + VERSION + '/RELEASE-NOTES.md')
assert (OUT / 'RELEASE-NOTES.md').is_file()
with zipfile.ZipFile(OUT / (STEM + '.zip')) as z:
    packaged = dict(line.split('=', 1) for line in z.read('module.prop').decode().splitlines() if '=' in line)
    assert packaged == PROPS and packaged['id'] == 'halloweenedition'
    assert int(packaged['versionCode']) == feed['versionCode'] and packaged['updateJson'] == UPDATE_URL
workflow = (ROOT / '.github/workflows/release.yml').read_text()
assert workflow.index('python3 tools/test_updates.py') < workflow.index('gh release create')
assert workflow.index('--draft --target') < workflow.index('--draft=false --latest')
assert 'versionCode must increase' in workflow
result = {'result': 'PASS', 'version': VERSION, 'versionCode': VERSION_CODE, 'tests': ['Native manager schema and HTTPS update endpoint', 'Feed version and ZIP metadata match exactly', 'Existing installed module ID preserved', 'ZIP and changelog URLs name the same immutable release', 'Only complete validated releases advance latest; monotonically increasing versionCode required']}
print(json.dumps(result, indent=2))
(ROOT / 'docs/UPDATE-TEST-RESULTS.json').write_text(json.dumps(result, indent=2) + '\n')
