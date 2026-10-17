# ForeverStrong v1.0 — upstream source and attribution

ForeverStrong combines two modules into one: Integrity Box v44 by MeowDump and Tricky Store OSS v3.1.0 by beakthoven. The shared interface and integration do not imply authorship of the original engines.

| Component | Revision / provenance | License / notes |
|---|---|---|
| Integrity Box v44 archive | User-supplied `v44-Integrity-Box-16-10-2026(1).zip`; per-file hashes in `docs/BASELINE-MANIFEST.json` | MeowDump and contributors; GPL-3.0 |
| Integrity Box v44 repository | `3a75df5cc7e6e7da28c2c44ea5a5c9825c62576c`; consulted HEAD `7a58d895b349886d68167a081f927f32d74c6afb` | https://github.com/MeowDump/Integrity-Box |
| PlayIntegrityFork modern source | v44 gitlink `42ebfb38af8ff29d75dce1a378cbd682ffe5501d` | chiteroman, osm0sis, MeowDump and contributors; GPL-3.0; source/binary discrepancies documented |
| PlayIntegrityFork legacy source | `9346fe598c988667c030a04a8a9d8a30d9c8eb5d` | Legacy Dobby branch; source available, exact supplied binary build revision not established |
| Tricky Store OSS | v3.1.0, `41383f5d4e0d13d86422b49f813c1f106b9e0f3a`; official asset `Tricky-Store-OSS-v3.1.0-172-41383f5-Release.zip` | Copyright 2026 Dakkshesh <beakthoven@gmail.com>; GPL-3.0-or-later; https://github.com/beakthoven/TrickyStoreOSS |
| PLTI | `1e09f3a0939780c6f9235383c6d430906b961d87` | PerformanC; dependency source and license included |
| nlohmann/json | `55f93686c01528224f448c19128836e7df245f72` | MIT; source/license included |
| local_cxa_atexit_finalize_impl | `b269136606d6f230089fbf47a0b219f7f2ccef3c` | 5ec1cff; source/license included |
| Material Icons font | Retrieved from Google's material-design-icons repository | Apache-2.0; license included |
| ShadowHook, Dobby, LSPosed libcxx, Bouncy Castle, Android platform stubs | Declared in included upstream Gradle/CMake manifests and source notices | Applicable upstream notices retained; downloadable build dependencies are not vendored wholesale |
| Halloween Edition integration and pumpkin SVG | v1.0 | GPL-3.0-or-later |

All original supplied archive files, including destructive code, are preserved verbatim under `upstream/integrity-box-v44-archive`. The original OSS source installer is also preserved. Credits do not imply endorsement. No upstream logo/cat artwork is used in the new product design.

## ForeverStrong ui-r3 dashboard image

The user supplied the Android Avengers composite poster for their dashboard (`webroot/assets/dashboard.jpeg`). It is bundled without pixel edits; opacity and fade are applied in CSS. No ownership or endorsement of depicted characters, Android branding or original artwork is claimed. Native upstream license notices remain unchanged.
