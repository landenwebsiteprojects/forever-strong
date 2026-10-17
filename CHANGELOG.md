# compat-r4 — root manager compatibility, v44 retained

- Removed the combined installer's Magisk-only gate. Recognize explicit KernelSU/APatch environment flags before compatibility Magisk version values or leftover directories.
- Added a shared active-manager tool environment for boot, repair, dashboard and component shell commands; installation records the selected manager for standalone WebUI sessions.
- Root status identifies Magisk/Kitsune, the KernelSU family, or APatch. Magisk denylist calls run only for Magisk. Generic ROM-property setup runs for every manager in Zygisk mode.
- Property tool lookup follows the selected manager; missing resetprop rejects installation before shared configuration changes.
- Preserve v44/OSS v3.1.0 native and DEX bytes, current UI, module ID, targets, app keys and upgrade state. No v45 changes.
- Android/root-manager/device-specific native behavior remains unverified on hardware. Unsupported root tools and recovery are rejected.

# ForeverStrong v1.0 — ui-r3

- Rebrand product and installer display names to ForeverStrong; retain Halloween Edition 1.0 badge.
- Replace dashboard headline and add supplied local poster with a top-to-bottom fade.
- Remove repeated pumpkin decorations from action buttons and engine tiles.
- Align search field, icon and clear button; add separation for warnings, logs and action groups.
- Keep long property names inside cards; align Nuke/Spoof actions and switches.
- Fix nested boot-setting descriptions and warning badges on narrow screens.
- Space Restore appearance defaults below Reduce motion.
- Add persistent custom accent/background colors and three presets across embedded tools.
- Preserve internal module ID, paths, root command handlers and all native/DEX bytes.

## Earlier release history

# v1.0 integration correction r2 (versionCode 10002)

- Replaced standalone Repair module probing with a readable unified repair endpoint and shared bundled-engine descriptor.
- Routed boot startup, process reporting, pre-requirement checks, keybox destinations and fingerprint/patch integration through the unified architecture.
- Added owned PID/start-time tracking, one service supervisor, idempotent startup and owned-daemon restart with truthful partial failure reporting.
- Retained OSS native app keys while privately archiving only obsolete legacy caches during repair.
- Gated optional external TeeSim/KeyMint synchronization on enabled modules so stale folders cannot override bundled OSS.
- Preserved `?`, `!` and automatic target modes in the alternate scope editor; replaced its misleading external-engine status switch with bundled-engine status refresh.
- Kept installer-r1 checksum fix, product version v1.0 and original upstream deletion source.

# v1.0 installer correction r1 (versionCode 10001)

- Reproduced the user's checksum failure after Manager-style extraction of the original release ZIP.
- Corrected the installed manifest to exclude `META-INF/*` bootstrap entries, which remain in the ZIP and are covered by release checksums.
- Kept payload verification enabled and added exact missing/damaged-file messages.
- Replaced source-tree installer fixtures with extraction from the actual ZIP, excluding Manager-omitted files; added corruption and missing-DEX rejection tests.
- Product version remains v1.0. No native payloads or deletion-source behavior changed.

# v1.0 — Halloween Edition

- Integrated Integrity Box v44 and Tricky Store OSS v3.1.0 under unique module ID `halloweenedition`.
- Added a new charcoal/pumpkin dashboard, navigation, configuration editors, recovery tools and diagnostics; rebuilt all original tool-page visual styles and layouts around the retained functional controls.
- Added local pumpkin SVG artwork, button decorations, bundled icon font, touch controls, reduced-motion setting and retained local translations for v44 tools.
- Removed original cat graphics/font/decorations, decorative installer art, opening branding links and simulated verdict dashboard data. Upstream notices remain in Credits/source.
- Consolidated boot hooks, selected correct native payload per ABI, and added an OSS daemon supervisor with bounded restart delay.
- Relocated supplied PIF native filesystem paths by reproducible fixed-width data patch, with corresponding available source edits and before/after hashes.
- Added safe configuration writes, input validation, strict keybox validation, root-only backups and snapshot restore.
- Retained original module-deletion code verbatim in complete source, per the user's instruction. Replaced active lifecycle deletion with scoped cleanup and identified conflict detection.
- Preserved shared configuration and module-local user data during supported migration/updates; quarantined only exact known legacy global hooks.
- Protected manual target modes and security-patch sections from routine action replacement unless explicitly enabled.
- Repaired retained synchronous shell clients for asynchronous WebUI hosts and surfaced bridge failures.
- Added host backend tests, installer simulations and browser checks. No rooted-device acceptance or actual integrity verdict was measured.
