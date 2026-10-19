# ForeverStrong v1.1

ForeverStrong combines **Integrity Box v45 by [MeowDump](https://github.com/MeowDump/Integrity-Box)** and **Tricky Store OSS v3.1.0 by [beakthoven](https://github.com/beakthoven/TrickyStoreOSS)** into one module with a shared charcoal and orange WebUI.

[Download v1.1](https://github.com/landenwebsiteprojects/forever-strong/releases/download/v1.1/ForeverStrong-v1.1.zip) · [Releases](https://github.com/landenwebsiteprojects/forever-strong/releases) · [Release notes](docs/RELEASE-NOTES.md) · [Validation](docs/V1.1-VALIDATION.md)

Install v1.1 over the existing ForeverStrong module, then reboot. The internal module ID remains `halloweenedition`. Existing shared configuration and app keys are retained. ARM64, ARMv7 and x86_64 use v45 payloads; v45 drops legacy 32-bit x86. Root managers and external Zygisk loader requirements remain as documented below. Real-phone boot and injection validation remain pending.

## Updates in your root manager

Version 1.1 embeds the standard `updateJson` URL pointing to the complete latest published release. Supported Magisk/Kitsune, KernelSU/KernelSU Next and APatch versions can check this feed and offer **Update** in their module list. Refresh/check for updates in the manager; installation remains a user action and requires reboot. Check and notification behavior depends on the manager and its settings. Existing v1.0 installations need to install v1.1 once to acquire this feed.

To publish the next version, change `version` and increase `versionCode` in `module/module.prop`, update `docs/RELEASE-NOTES.md`, and push the versioned changes to `main`. `.github/workflows/release.yml` runs the installer, backend, engine, download, update-feed and WebUI checks, then publishes a draft containing the module ZIP, full source, checksums, notes and `update.json`; only then does it publish the release as latest. Failed checks do not advance the feed. Published releases are never overwritten. Changing upstream Integrity Box by itself does not automatically change ForeverStrong.

## Repair downloads

The official v45 release still uses the published GitHub `archive/Megatron` asset. GitHub's tagged source file differs from the packaged release; release payload provenance is recorded in `docs/V45-PROVENANCE.json`. Downloads use automatic tool fallbacks and explicit network/DNS failure reporting. They preserve HTTPS verification and do not alter global Android DNS. A failed download does not replace the active keybox or fingerprint configuration. Offline XML/key-pair validation precedes atomic keybox replacement. Existing target/patch replacement remains opt-in.

Future upstream security patches, bug fixes and compatibility improvements are planned. This release does not promise a particular Play Integrity verdict.

## Earlier v1.0 implementation and migration details

The following sections document the v1.0 baseline and its prior checks. References to v44, x86 legacy payloads and old version filenames describe that earlier build; v1.1 changes above and the current release notes take precedence.

## Downloads and compatibility (compat-r4)

[Download module ZIP](https://github.com/landenwebsiteprojects/forever-strong/releases/download/v1.0-compat-r4/ForeverStrong-v1.0.zip) · [Complete source archive](https://github.com/landenwebsiteprojects/forever-strong/releases/download/v1.0-compat-r4/ForeverStrong-v1.0-Source.zip) · [Release and checksums](https://github.com/landenwebsiteprojects/forever-strong/releases/tag/v1.0-compat-r4)

This revision retains **Integrity Box v44** and **Tricky Store OSS v3.1.0**. No v45 patches or payloads are included. Version remains v1.0; build is `compat-r4`, versionCode `10004`.

| Root manager | Installation/runtime path | Additional requirements |
|---|---|---|
| Magisk / Kitsune | Host fixture tested | Active Zygisk loader for Zygisk features |
| KernelSU / KernelSU Next | Host fixture tested | External Zygisk loader for Zygisk features; mounting metamodule where required for optional system overlays |
| APatch | Host fixture tested | External Zygisk loader for Zygisk features; manager-supported device/ABI |
| Other root tools / recovery | Not supported | Not a generic `su` ZIP or recovery installer |

These are compatibility implementation and host-test results, **not on-device certification**. Native interception, boot stability, mounting, loader behavior and WebUI permissions still require device validation. Root alone does not provide a Zygisk loader. Scripts-only mode and the OSS daemon remain available without Zygisk, subject to the same device validation.

**Release status: engineering build awaiting rooted-device acceptance.** Host validation passed as documented in `docs/BUILD-AND-TEST-REPORT.md`. No rooted Android device was available. Installation on Kitsune 30.6, native injection, boot stability and every device-changing control remain unverified on real hardware. No Play Integrity verdict is promised or claimed.

## Interface refinement (ui-r3)

The project is now **ForeverStrong**, retaining the top-right **Halloween Edition 1.0** badge at the user's request. The dashboard headline reads **One module. A lot of control.** The supplied Android Avengers image is bundled locally and fades downward into the selected background. No generated replacement image is used.

The existing screens and navigation remain. Shared spacing rules fix search icon/field/clear alignment, property labels wrapping, Nuke/Spoof action rows, switch containment, warning/log separation, and Settings button spacing. Redundant pumpkin button/tile decorations and duplicate tool headings are removed. Settings includes Pumpkin, Violet and Teal accents plus custom accent/background colors. Appearance persists per WebUI host and reaches embedded tools; reset restores charcoal `#151515` and orange `#FF7900`.

**Upgrade:** Install `ForeverStrong-v1.0.zip` over the existing integrated module, then reboot. The internal ID remains `halloweenedition` so this updates the same module and preserves the known native paths, shared settings and bundled-engine routing. Do not install a duplicate standalone Tricky Store. The user reported integration-r2 working; ui-r3 still requires confirmation on the phone.

## Bundled engine routing correction (r2)

This revision fixes the Repair button's standalone-module detection. Every active attestation integration path uses `bin/integration.sh` and the shared lifecycle controller to discover the OSS engine under this module, not a separate `tricky_store` module directory. Repair now saves a config snapshot, archives obsolete legacy caches, runs Integrity Box action, and refreshes the tracked OSS daemon under one supervisor. It retains native OSS app-key persistence (`/data/adb/tricky_store/keys`). Stale folders for disabled external engines no longer take precedence. The alternate scope editor preserves explicit `?` and `!` modes.

Install this update over Halloween Edition and **reboot**. Reboot is required to replace r1's untracked daemon with the r2 supervisor. Do not install an additional Tricky Store module. The new repair workflow and lifecycle passed isolated fixture tests, but actual native operation on the phone remains to be verified.

## Installer correction (r1)

The first v1.0 package failed the user's installation at checksum verification. Its installed-file manifest incorrectly required two `META-INF` bootstrap files that the Manager excludes from the installed directory. Revision r1 removes those bootstrap entries from that manifest while preserving their ZIP contents and release checksum coverage. It also prints specific failed filenames. All installer simulations now use the packaged ZIP with the Manager extraction filter; damaged or missing payloads are still rejected. Download this corrected package and retry installation after following the migration steps below. Successful installation and runtime operation on the phone are still pending.

## Files

- `ForeverStrong-v1.0.zip`: flashable module, ID `halloweenedition`, version `v1.0` / code `10004`, build `compat-r4`.
- `ForeverStrong-v1.0-Source.zip`: complete integration source, available upstream source/dependencies, original supplied archive files, manifests, build tools and test fixtures.
- `ForeverStrong-v1.0-SHA256SUMS.txt`: SHA-256 checksums for release artifacts.

The module ZIP has one root `module.prop`, one principal `webroot/index.html`, one early boot hook and one service hook. It contains the actual native/DEX payloads; it does not contain two standalone installer ZIPs.

## Requirements

Android 10 / API 29 or newer; ARM64, ARMv7, x86_64 or x86 as supplied upstream. Install through the running Android manager: Magisk/Kitsune, KernelSU/KernelSU Next, or APatch. The active manager must supply resetprop. A compatible Zygisk loader is required for the native Integrity Box Zygisk features; KernelSU and APatch require an external loader. Optional app replacements in system/ require the manager's mounting support (a mounting metamodule on KernelSU versions that require one). Existing scripts-only mode is respected when `/sdcard/zygisk` or `/data/adb/Box-Brain/zygisk` exists. Tricky Store OSS still runs in scripts-only mode.

Kitsune does not itself supply the expected WebUI JavaScript bridge. Use KsuWebUIStandalone (`io.github.a13e300.ksuwebui`) or WebUI X (`com.dergoogler.mmrl.webuix`) with root access. The Manager action opens either supported installed host. If neither is installed, the action prints a useful error and does not open an advertising link. Native payload compatibility and host behavior must be checked on your device.

## Before installation and migration

1. Back up your working modules and `/data/adb/Box-Brain`, `/data/adb/tricky_store`, and relevant module-local custom files to private storage. Backups contain private keys; do not publish them.
2. In Kitsune Manager, **disable** the existing Integrity Box / Play Integrity Fix and Tricky Store modules. Also disable competing TEE Simulator or other keystore interceptors. **Reboot with them disabled**, then install this ZIP. A currently injected Tricky Store process remains until reboot.
3. The installer refuses enabled or queued conflicting module IDs: `playintegrityfix`, `playintegrity`, `tricky_store`, `teesim`, `oh_my_keymint`. It does not delete those modules.
4. Exact copies of the supplied v44 global `hash.sh`, `prop.sh`, `lineage.sh` and `.box_cleanup.sh` hooks are moved out of `service.d` into a timestamped private migration backup. An unfamiliar script with one of those generic names causes installation to stop rather than guessing its ownership. Preserve it and resolve ownership manually.
5. Install `ForeverStrong-v1.0.zip` through your active root manager, then reboot. Enable only Halloween Edition for these two engines. Open its WebUI and review Diagnostics before using advanced controls.

Existing `/data/adb/tricky_store/target.txt`, `keybox.xml`, `security_patch.txt`, key persistence databases, Box-Brain settings, fingerprint/profile files, application scopes, paused state and app replacement configuration are retained. Missing targets/keybox receive upstream defaults; an absent patch file remains absent. First installations use the baseline API-appropriate fingerprint template and safe mode. The installer makes a private timestamped migration snapshot before changing defaults.

Do not run the old Integrity Box uninstaller during migration: the original code deletes shared configuration and other module directories. Its complete original source is preserved, as requested, in `upstream/integrity-box-v44-archive/`; it is not the Halloween installer.

## Using the unified WebUI

Dashboard reads actual local device properties, configuration and process presence. A present process is not proof of successful keystore interception, and installed Zygisk libraries are not proof they loaded. The UI states those limits.

Integrity Box exposes all 19 original v44 subpages plus the first-boot configuration page through the rebuilt control center. Original functional DOM, IDs and action logic are retained, with a new shared layout/design system, local fonts and a unified asynchronous shell bridge. The old root dashboard is replaced. The preserved source includes the original pages and deletion code verbatim for comparison. Nonexistent upstream page routes are not presented as working features.

Tricky Store provides:

- Target package listing, installed-package search, add/update/remove, and automatic / leaf (`?`) / generation (`!`) modes. Edit a draft, then Save.
- Security patch editor supporting global/per-package blocks, `all/system/vendor/boot`, date formats and placeholders, `no`, `device_default`, and `prop`.
- Keybox XML import with offline XML, certificate-chain signature and private/public key-pair validation. Validation does not check revocation, server trust, or a Play Integrity verdict. Keys are not displayed by the new control center or exported in diagnostics.
- Root-only backups and restoration, with a pre-change recovery snapshot for each save. Restoring affects shared configuration; reboot afterward. Backups are local recovery snapshots, not portable export files.

Files remain at `/data/adb/tricky_store/target.txt`, `/data/adb/tricky_store/keybox.xml`, `/data/adb/tricky_store/security_patch.txt` so OSS FileObserver reload behavior remains intact. Saves use same-directory atomic replacement. On Android, test actual reload behavior with the target application.

The original Integrity Box action can regenerate targets and replace patch configuration. Halloween defaults to **preserving** those files. Settings offers explicit opt-in flags to restore those original replacement behaviors. Explicit original scope controls can still change the target file. Direct edits made by retained advanced tools keep their upstream semantics.

Destructive commands from migrated tools display a command confirmation. Read the listed command and affected paths. Normal module removal retains the shared configuration and recovery backups. Module removal requires a reboot to unload code. Original persistent-property restoration commands generated by upstream helpers are retained when available.

## Update and rollback

Update by flashing a newer Halloween build with the same module ID, then reboot. The installer copies retained module-local config into the staged update; shared config stays in place.

To return to the originals: disable Halloween Edition and reboot; restore the pre-install private configuration snapshot; re-enable the prior modules and reboot again. If you need the original global hooks, restore only the exact archived copies to their previous locations with executable permissions after verifying which original module owns them. Do not run both engine implementations simultaneously. Do not invoke a preserved source uninstaller as a rollback mechanism.

## Build

The ready-made ZIP requires no compilation. To reproduce packaging from the source tree:

```sh
python3 tools/relocate_native.py
python3 tools/build.py
```

This reproduces the fixed-width filesystem path relocation in the supplied PIF ELF libraries; it is **not** a fresh native compilation. The ID `halloweenedition` was deliberately chosen to match the original ID length, leaving ELF offsets, sizes, instructions and relocations unchanged. Only literal `/data/adb/modules/...` filesystem paths are replaced. Java package namespaces remain unchanged. Original and relocated SHA-256 values are recorded in `docs/NATIVE-RELOCATION.json`.

The v44 source gitlink does not fully match all strings/features in the supplied PIF binaries (`app_profile.prop` is one observed discrepancy). Exact source-to-binary reproducibility of those upstream payloads is not established. The source archive includes all retrieved buildable upstream components and dependency trees, with the corresponding source path relocation, and preserves the original compiled payloads. Do not claim a fully rebuilt native release.

To rebuild upstream components, use their included Gradle wrappers, Android SDK 37 and NDK 29.0.14206865 with the JDK/Gradle versions required by each project. Tricky Store source is pinned to v3.1.0 commit `41383f5`; its supplied release DEX and libraries are used unchanged. External Maven/SDK dependencies remain declared in the upstream build files. See `docs/BUILD-INSTRUCTIONS.md` for validator and test tooling.

## Licenses and testing

GPL-3.0-or-later for new integration code; upstream license terms remain applicable. Full texts are under `module/licenses` and upstream trees. See `ATTRIBUTION.md`, `CHANGELOG.md`, the source audit, manifests and build/test report. Screenshots used internally for layout checks are not evidence of device operation.

## Planned updates

Future updates are planned to incorporate applicable upstream security patches, bug fixes and compatibility improvements. This v1.0 release retains Integrity Box v44.

## Module card banner

KernelSU Next can show the bundled dashboard artwork behind the module card through its local banner property. KernelSU Next applies its own downward gradient to blend the artwork into the card behind the description. The description is shared unchanged with Kitsune through module.prop. Display depends on the manager and its banner settings; stock Magisk does not show these card banners.
