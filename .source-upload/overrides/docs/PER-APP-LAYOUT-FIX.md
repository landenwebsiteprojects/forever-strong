# ForeverStrong v1.0 — per-app spoofing layout correction

The shared header action styling forced five buttons onto one line while allowing text to wrap at any character. Pixel's app container was flex without a column direction, so app entries also compressed sideways.

The corrected page places App List and System Apps together in the heading, then Backup/Restore and Select All/Deselect All in two-column mobile rows. Wider embedded views use four columns. Button words stay horizontal. The search uses the full row, and each app occupies a separate full-width row with its name and package. Existing action handlers and target storage paths are retained. Labels render as text.

The browser regression fixture passed at outer viewports 320, 390, 480 and 720px. Actual frame widths were 288, 358, 448 and 454px. Buttons were at least 114px wide; app rows shared the available width. All other existing WebUI checks also passed. This is host browser evidence, not a rooted-phone test.

The module card uses the same local webroot/assets/dashboard.jpeg artwork as the dashboard. KernelSU Next reads the banner property and applies a theme-aware downward fade behind the description. Kitsune and other managers retain the same module.prop description.

Primary manager source: https://github.com/KernelSU-Next/KernelSU-Next/blob/dev/manager/app/src/main/java/com/rifsxd/ksunext/ui/screen/Module.kt
