# ForeverStrong v1.0 — build and testing report

**Status: packaged engineering build; rooted-device acceptance pending.** The module, integration source, WebUI, installer and test harnesses were implemented. This is not a certified, hardware-tested release. No suitable rooted Android/Kitsune device was attached. No Play Integrity verdict was measured.

## Current UI refinement r3

Current build is `ui-r3`, versionCode `10003`. The detailed current UI report is `FOREVER-STRONG-UI-REPORT.md`. Thirty-two browser regressions passed, including all 20 tools at 320/390/480 pixels, actual Nuke/Spoof selection and switch toggling, search clearing, theme persistence, and reset-button spacing. Ten installer fixtures and nine engine-controller fixtures passed again. All 20 native/DEX/OSS-daemon payload files match integration-r2 byte for byte. The user reported integration-r2 working; this revision still requires their on-device UI/upgrade confirmation. Earlier build evidence and limitations below remain historical context.

## Integration r2 correction following the repair failure

Product version remains v1.0, versionCode 10002, build `integration-r2`. The user's Repair button reported no attestation module. An isolated runtime probe decoded the old Repair script's standalone module-file checks and workflow; those checks could not discover the engine bundled under Halloween Edition. The new readable Repair UI calls a unified backend and shared engine descriptor. Startup, status, boot checks, the target/blacklist editor, keybox destinations, fingerprint patch updates and optional external synchronization now recognize the bundled engine and its native configuration paths.

The lifecycle controller tracks both PID and `/proc` start time, ensures one supervisor, restarts only its owned daemon, and refuses to adopt/kill an unowned external daemon. Repair snapshots config, archives obsolete legacy caches, runs the retained Integrity Box action once, then refreshes OSS through the controller. Native OSS `/data/adb/tricky_store/keys` persistence is retained. Existing target `?`/`!` modes and patch sections survive unless original replacement behavior was explicitly enabled.

Nine new isolated engine tests passed, including no-standalone-module detection, idempotent startup, owned-daemon restart, repair orchestration, app-key preservation, action failure, disabled module and incomplete payload behavior. The test daemon and Integrity Box network action were stand-ins; no Android injection or upstream download was executed by those tests. Browser tests now click Repair, accept its confirmation, verify routing to the unified backend, and check mode preservation in the alternate scope editor. See `ENGINE-TEST-RESULTS.json`, `UI-TEST-RESULTS.json` and `INTEGRATION-ROUTING-AUDIT.md`. On-device success of this revision is still pending.

## Installer r1 correction following the failed phone installation

The user supplied a Kitsune installation screenshot showing failure at `Verifying package contents` with `Package checksum verification failed`. The original v1.0 ZIP was extracted with the Manager's default `META-INF/*` exclusion and its checksum check reproduced the failure: both `META-INF/com/google/android/update-binary` and `META-INF/com/google/android/updater-script` were missing from the installed directory, although present and intact in the ZIP. The earlier installer tests copied the complete module tree and missed this extraction difference.

Installer revision r1 (versionCode 10001, product version still v1.0) excludes these bootstrap entries from the installed-file manifest. They remain in the flashable ZIP and remain covered by the final release SHA-256. Verification of every installed payload file stays enabled; failures now name the missing or damaged file. All four ABI installer fixtures now extract the actual ZIP with the Manager exclusion, and additional tests reject missing and corrupted DEX payloads while leaving shared configuration unchanged. This is a host reproduction and fix; a successful retry on the user's phone is still pending.

Source reference for the extraction contract: https://github.com/topjohnwu/Magisk/blob/master/scripts/util_functions.sh (`install_module`, `unzip -o "$ZIPFILE" -x 'META-INF/*' -d $MODPATH`). The exact user's installed Manager binary was not available for inspection.

## Implemented

One module entry (`halloweenedition`, version `v1.0`), one principal WebUI, original v44 payload and official OSS v3.1.0 DEX/native libraries. The supplied v44 archive, rather than repository HEAD, is the baseline. Modern and legacy PIF native paths were relocated without changing string lengths, ELF layout or Java namespaces. OSS runs from a dedicated module subdirectory to preserve relative injector/library loading; its configuration stays in `/data/adb/tricky_store`.

The new dashboard, navigation, toolkit catalog, manual target modes, patch editor, keybox import/validation, recovery controls, diagnostic views and settings are integrated with shell operations. All original tool pages are reachable; functional IDs and handlers remain while old stylesheets/layout presentation were replaced with one local design system. Tool translations are bundled. Original root-dashboard language/gesture/cache/intro presentation settings do not map one-to-one to the new navigation and were superseded by the new interface. Existing saved settings are retained on disk.

The installer checks environment, verifies file hashes, preserves user configuration, selects native components per ABI, recognizes active conflicts, and quarantines only exact known global hooks. It does not silently delete other modules. The complete original deletion logic remains verbatim in the source archive, per the user's follow-up instruction. Destructive advanced controls remain available with command confirmation. Uninstallation preserves shared keys, flags and recovery snapshots.

The retained Integrity Box action remains available. Manual OSS targets/modes and patch sections are protected from routine action regeneration by default; explicit opt-in restores replacement behavior. The original key export to shared storage during an ordinary action was replaced by root-only snapshots. Original raw-logcat reporting was replaced by sanitized diagnostics. All original source remains available for review.

## Verified in this environment

| Check | Result | Boundary |
|---|---|---|
| Source inventory | 134 ZIP entries; 242 original HTML controls/action elements inventoried | Inventory includes original root and first-boot pages; dynamic generated controls additionally remain in their scripts |
| Shell syntax | 42 module shell scripts parsed successfully with Bash | Android mksh/BusyBox runtime behavior is not established by Bash parsing |
| Native relocation | All 7 supplied modern/legacy ELF libraries match documented relocated hashes; old filesystem prefix removed | ELF data patch verified; no Android loader execution |
| Preserved deletion source | Original customize.sh, uninstall.sh and cleanup.sh byte-identical in source tree | Preserved source files are not invoked as the Halloween lifecycle |
| Real configuration backend | Valid target suffixes, duplicate/injection rejection, patch sections/placeholders/date validation, atomic saves | Temporary synthetic filesystem; host shell |
| Keybox validation | AOSP default XML passes; malformed counts and external entity input rejected; key pairs and certificate chains checked; private read refused | Host JRE cryptography provider; Android DEX/provider execution remains pending |
| Backup / restore | Target/keybox/patch and flags recovery, pre-change snapshot, path traversal refusal, private permissions | Host filesystem; native key persistence databases retained but not copied by ordinary config snapshots |
| Write safeguards | Symlink writes and simultaneous transactions rejected | Root caller can still bypass the UI or edit filesystem directly |
| Installer simulations | ARM64, ARMv7, x86_64 and x86 payload selection and staging pass | Manager extraction filter reproduced from the ZIP; helpers simulated; corrected build phone flashing pending |
| Migration simulations | Disabled original module/config retained, exact legacy hooks quarantined, unknown hooks refused | Exact supplied baseline hook bytes only |
| Upgrade simulation | Saved fingerprint and paused state survive staging | No real reboot/update transition |
| Removal test | Shared config and backup directories survive | Native code unload requires reboot |
| Browser checks | Dashboard bridge/state, target drafts/save confirmation, patch/recovery navigation, diagnostics, flag state, all 20 tool pages initialize without uncaught errors | Mocked native bridge; successful UI rendering is not an Android operation test |
| Mobile layout | 390 px dashboard checked without horizontal overflow | Not a full matrix of devices, accessibility settings or all dynamic dialogs |
| Packaging | Single root metadata entry, local asset paths, ZIP CRC/hash/permission/manifest checks | Installability structure verified, actual flashing pending |
| Branding | New pumpkin SVG/CSS/font assets, original cat artwork/font removed from module UI; upstream names retained in Credits and required source/dependency URLs | Dynamic strings are sanitized by the shared component adapter; downloaded third-party files remain upstream products |

The machine-readable `BACKEND-TEST-RESULTS.json`, `INSTALLER-TEST-RESULTS.json`, `UI-TEST-RESULTS.json`, `STATIC-TEST-RESULTS.json`, baseline inventory and native relocation manifest accompany the source. Browser fixture values are explicitly synthetic and never embedded in the delivered WebUI runtime.

## Build provenance and unresolved source discrepancy

Tricky Store OSS official release v3.1.0 (`41383f5`, release build 172) supplies its DEX and 4 ABI library pairs unchanged. Its tagged source, PLTI dependency and build manifests are included. The exported Gradle file uses fixed version metadata to support a source tree without `.git`.

Integrity Box PIF source is included at the v44 gitlink `42ebfb3`, plus the available legacy branch. The supplied compiled v44 libraries refer to `app_profile.prop`, while the v44 source gitlink does not contain the corresponding feature string. Consequently exact source-to-binary correspondence is not proven. The native payloads were retained and relocated, not rebuilt from that mismatched source. A full upstream Android SDK/NDK build was not completed. Do not describe the complete native module as freshly compiled or fully reproducible from upstream source.

The upstream RepairMode source remains preserved but has been replaced in the installed UI by a readable repair workflow. Its decoded original sequence and the adapted orchestration are documented in the routing audit. Optional upstream download endpoints and files were not exercised against a user's device. Advanced v44 controls can retain broad upstream effects even though the redesigned lifecycle is scoped. Their confirmations expose commands; users must inspect the affected targets.

## Required rooted-device acceptance

1. On the user's existing Kitsune 30.6 setup, keep private backups, disable the original engines, reboot, and install the ZIP. Capture the actual installation log. Verify unique Manager entry and unchanged unrelated modules/configs.
2. Reboot and inspect early/hash/lineage/prop/Integrity Box exit statuses. Check that only one TrickyStoreOSS process and one optional autopilot daemon run. Confirm Zygisk loads the selected PIF library and correct DEX; confirm OSS injection through its own native logs and an independent keystore test.
3. Exercise all exposed tool controls against baseline behavior, including profile switches, property flags, app spoofing, boot digest, source handling, repairs, automation, root configuration, file hiding/restore and optional downloads. A static handler inventory or mocked bridge is not a claim that every real operation passed.
4. Save AUTO / ? / ! targets, global and per-app patch blocks, and a test keybox. Confirm OSS FileObserver reload and expected behavior in each target application. Verify private key data is absent from ordinary logs and exported diagnostics.
5. Exercise backups, restore, update, disable, rollback and removal across real reboots; confirm that unrelated modules/data and original user settings survive. Test malformed inputs and native initialization failures.
6. Test WebUI hosts, touch/scroll navigation, dialogs and translations on the actual phone. Confirm expected root access and actionable failures.
7. Run an independent Play Integrity checker and record its actual result, if desired. No result follows automatically from this build.

Until these checks pass, the user's hardware-specific acceptance requirements remain open. The deliverables are concrete implementation artifacts for that test cycle, not proof that both engines operate conflict-free on the device.
