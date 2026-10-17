# Source audit — completed before integration edits

Baseline: supplied Integrity Box v44 archive, not repository HEAD.
Tricky Store: upstream v3.1.0 tag 41383f5d4e0d13d86422b49f813c1f106b9e0f3a and official release payload.
Integrity Box v44 tag: 3a75df5cc7e6e7da28c2c44ea5a5c9825c62576c. Repository HEAD consulted: 7a58d895b349886d68167a081f927f32d74c6afb.
PIF gitlink: 42ebfb38af8ff29d75dce1a378cbd682ffe5501d (ShadowHook). Legacy Dobby variant is a separate branch.

## Architecture findings

* Integrity Box supplies a Zygisk library and DEX; compiled native paths are fixed to /data/adb/modules/playintegrityfix. Hooks and WebUI use the same ID.
* Tricky Store OSS app is an app_process-hosted Kotlin/DEX daemon, not an interactive Android settings app. Its native binder interceptor and injector load relative to the daemon module directory. Configuration remains /data/adb/tricky_store. Android Q/R and S+ have distinct keystore implementations.
* Both original installers assume ownership of shared configurations. Integrity Box installer removes unrelated modules, installs unowned service.d files and opens external branding links. Its uninstaller removes shared keybox/targets, Box-Brain and unrelated modules. These destructive lifecycle mechanisms must be replaced.
* Integrity Box action rebuilds target.txt and security_patch.txt, conflicting with OSS per-package modes and patch sections. Consolidated ownership must protect manual configuration while preserving explicitly requested regeneration.
* Original prop.sh overwrites security_patch.txt on boot. It must consume the current configuration without replacing it.
* Baseline UI references nonexistent Certified, Keymint, Faq and TEEsimulator pages; no functional implementation exists in the supplied archive for those routes. Do not expose dead navigation.
* Status fetched from an upstream key-status website is not a device Play Integrity test. Dashboard must not label that data as a tested device verdict.
* Reports include full logcat; a new diagnostics export must exclude arbitrary logs and private key material.
* Native binary strings include app_profile.prop, which is absent in the v44 source gitlink. Exact reproducibility of supplied PIF binary builds is not established. Preserve binary provenance and explicitly document this discrepancy.

## Baseline interfaces

* Assistant: 2 inline action bindings; preserve DOM IDs and handlers while replacing visual styling and shell bridge.
* BootHash: 1 inline action bindings; preserve DOM IDs and handlers while replacing visual styling and shell bridge.
* Control: 17 inline action bindings; preserve DOM IDs and handlers while replacing visual styling and shell bridge.
* Downloader: 7 inline action bindings; preserve DOM IDs and handlers while replacing visual styling and shell bridge.
* Flags: 11 inline action bindings; preserve DOM IDs and handlers while replacing visual styling and shell bridge.
* HideMyFiles: 9 inline action bindings; preserve DOM IDs and handlers while replacing visual styling and shell bridge.
* KeyboxLoader: 0 inline action bindings; preserve DOM IDs and handlers while replacing visual styling and shell bridge.
* KeyboxSource: 6 inline action bindings; preserve DOM IDs and handlers while replacing visual styling and shell bridge.
* Pilot: 3 inline action bindings; preserve DOM IDs and handlers while replacing visual styling and shell bridge.
* Pixel: 11 inline action bindings; preserve DOM IDs and handlers while replacing visual styling and shell bridge.
* PlayIntegrityFork: 28 inline action bindings; preserve DOM IDs and handlers while replacing visual styling and shell bridge.
* Profile: 6 inline action bindings; preserve DOM IDs and handlers while replacing visual styling and shell bridge.
* PropSpoofer: 11 inline action bindings; preserve DOM IDs and handlers while replacing visual styling and shell bridge.
* RepairMode: 5 inline action bindings; preserve DOM IDs and handlers while replacing visual styling and shell bridge.
* Report: 0 inline action bindings; preserve DOM IDs and handlers while replacing visual styling and shell bridge.
* RootImplementation: 6 inline action bindings; preserve DOM IDs and handlers while replacing visual styling and shell bridge.
* Spoofing: 3 inline action bindings; preserve DOM IDs and handlers while replacing visual styling and shell bridge.
* Support: 2 inline action bindings; preserve DOM IDs and handlers while replacing visual styling and shell bridge.
* TrickyStore: 13 inline action bindings; preserve DOM IDs and handlers while replacing visual styling and shell bridge.

All original files and hashes are recorded in BASELINE-MANIFEST.json. Detailed control inventory generated separately.
