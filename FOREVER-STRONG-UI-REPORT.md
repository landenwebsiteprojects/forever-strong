# ForeverStrong v1.0 — UI refinement r3

Build: `ui-r3` · versionCode: `10003` · target: Kitsune 30.6.

## Delivered changes

- Product name: ForeverStrong. The top-right badge remains **Halloween Edition 1.0**, as requested.
- Dashboard headline: **One module. A lot of control.**
- The supplied Android Avengers poster is bundled locally and fades from the top down into the background using CSS. No generated image is used.
- Existing screens and navigation are retained. Shared spacing and containment rules organize the controls throughout the interface.
- The search icon, field and X align in one row. Notices, tips, logs and action groups have separate spacing.
- Long property names wrap inside cards. Nuke and Spoof share an aligned action row; switches remain inside the card at the right.
- Nested boot settings keep their descriptions and warning badges below their main controls.
- Repeated pumpkin decorations are removed from buttons and engine tiles. Duplicate legacy tool headings and the stray `html` text are removed.
- Settings provides Pumpkin, Violet and Teal presets plus custom accent and background colors. Colors are saved per WebUI host, applied to embedded tools and restored by the appearance reset action.
- Restore appearance defaults has a 20-pixel gap below Reduce motion. Other Settings navigation buttons use the same spacing and available width.

## Compatibility and preservation

The internal module ID remains `halloweenedition`. This is intentional: it upgrades the existing module in place and retains the paths required by the existing native payloads. Product display names are changed; engine/configuration paths, target modes, saved keys, backend operations and settings retain the r2 architecture.

All 20 native/DEX/OSS-daemon payload files are byte-identical to integration-r2. The original upstream deletion code remains in the complete source archive. The active installer lifecycle is unchanged except for display text. No standalone attestation engine is added.

The dashboard poster is copied without editing its image bytes. SHA-256: `82d17b733bfadca09f0ff2f8831c28adf1025a0d52781b526acf616886115338`.

## Verification for this revision

- 32 browser regression checks, with no uncaught page errors. A local mocked root bridge is used; no Android commands run.
- All 20 tool pages initialize, and each was checked at 320, 390 and 480 pixels for horizontal overflow and row children escaping their cards.
- Search icon/field/X alignment, clear action, long-name containment, Nuke/Spoof alignment and mode selection, and property switch toggling pass.
- Appearance preset persistence after reload, propagation to an embedded tool, default reset, and at least 16 pixels of reset-button clearance pass.
- Local background image loading, requested headline and edition badge pass.
- 10 installer simulations cover the four ABIs, conflict refusal, known/unknown hooks, upgrade settings preservation, and missing/corrupt payload rejection.
- 9 isolated engine-controller tests pass, including bundled detection, single-instance ownership, repair orchestration and stored-key preservation. Native injection is replaced by a harmless stand-in daemon in these tests.
- 42 shell scripts pass Bash syntax checks; external JavaScript syntax checks pass.
- Final ZIP entry uniqueness, path safety, permissions, CRCs and installed-payload SHA-256 manifest are checked.
- Browser screenshots of the dashboard, property cards and Settings were inspected locally. These contain synthetic test data and are not release runtime content.

Machine-readable evidence is included under `docs/UI-TEST-RESULTS.json`, `UI-R3-STATIC-RESULTS.json`, `ENGINE-TEST-RESULTS.json`, `INSTALLER-TEST-RESULTS.json` and `PACKAGE-TEST-RESULTS.json`.

## Remaining phone checks

The user reported that integration-r2 works. This ui-r3 package has not been flashed or visually checked on the user's phone here. Verify touch/scroll behavior in the chosen WebUI host, saved appearance after reopening, dashboard crop/fade, installation and reboot. No new Play Integrity verdict or Android native-injection result is claimed. The previously documented upstream native source/binary mismatch remains unchanged.

## Installation

Install `ForeverStrong-v1.0.zip` over the current integrated module and reboot. The entry will be named ForeverStrong. Keep standalone attestation modules disabled. Source, licenses, build instructions, earlier engineering limitations and test fixtures are included in `ForeverStrong-v1.0-Source.zip`.
