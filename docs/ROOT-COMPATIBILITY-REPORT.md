# ForeverStrong v1.0 — compat-r4

ForeverStrong combines two existing modules into one: Integrity Box v44 by MeowDump and Tricky Store OSS v3.1.0 by beakthoven.

The release retains the Integrity Box v44 baseline and OSS v3.1.0. No v45 source, patch, binary or release archive is included. Product version remains v1.0, versionCode 10004, module ID halloweenedition.

## Changed behavior

The manager sources customize.sh after extraction. KernelSU/APatch use their manager installer; META-INF/update-binary remains the standard Magisk bootstrap. Environment flags APATCH/KERNELPATCH and KSU precede a Magisk compatibility version or an old Magisk directory. Unknown installers, recovery and missing resetprop fail before configuration changes. Manager selection is saved for standalone WebUI shells. Boot, repair and WebUI commands share the selected manager's tool path. Status reports that manager, rather than invoking magisk on every device. Magisk denylist calls are manager-specific; common ROM-property workarounds are manager-independent.

## Boundaries

This implements the documented Magisk/Kitsune, KernelSU family and APatch module environments. It does not add arbitrary root software support, install/change root managers, add a Zygisk loader or guarantee integrity verdicts. KernelSU/APatch require an external compatible Zygisk loader for Zygisk features. KernelSU versions with metamodules require mounting support for optional system/ overlays. The standalone WebUI bridge does not make the native backend manager-independent by itself. Late-load, device-specific mounts, SELinux/native interception and real-device boot acceptance remain unverified.

Native/DEX payloads are checked byte-for-byte against ui-r3. All source credits and licenses remain. Original source and legacy scripts remain available under upstream/.

## Validation

See INSTALLER-TEST-RESULTS.json, ROOT-COMPAT-TEST-RESULTS.json, ENGINE-TEST-RESULTS.json, BACKEND-TEST-RESULTS.json, UI-TEST-RESULTS.json and PACKAGE-TEST-RESULTS.json for host evidence. Host fixtures do not execute Android injection or prove on-device success.

Fresh browser validation runs in the publication workflow with a mocked root bridge. Earlier UI evidence in the archive is the ui-r3 baseline; the latest workflow log and committed JSON evidence identify the new run. No real Android commands execute in that browser test.

## Primary references

- https://kernelsu.org/guide/module.html — environment flags, customize.sh, lifecycle and external Zygisk support.
- https://kernelsu.org/guide/metamodule.html — optional system overlay mounting.
- https://apatch.dev/apm-guide.html — APatch environment flags, property tools and module lifecycle.
- https://topjohnwu.github.io/Magisk/guides.html — Magisk installer and lifecycle.

## Planned updates

Future updates are planned to incorporate applicable upstream security patches, bug fixes and compatibility improvements. This v1.0 release retains Integrity Box v44.
