# Build and validation instructions

## Package the provided payloads

Python 3.11 or newer:

```sh
python3 tools/relocate_native.py
python3 tools/build.py
```

Output is in a sibling `release/` directory. ZIP entries use a fixed timestamp and permissions. `module/files.sha256` is regenerated from the final module files, excluding itself and the `META-INF/*` bootstrap entries that Manager deliberately omits from the installed directory. It protects installation against missing/corrupted contents; it is not an author signature.

The module sources already contain the relocated native binaries and compiled validator. Neither Gradle nor an Android SDK is needed to reproduce packaging.

## Rebuild the validator

`validator/KeyboxValidator.java` targets Java 11 bytecode and Android API 29+. The build here used OpenJDK 17 runtime, Eclipse ECJ 3.37.0 and R8/D8 8.3.37. ECJ was used because the host did not include javac. JARs are obtainable from the official Eclipse Maven artifact and Google's R8 releases; they are build tools, not runtime module dependencies.

```sh
mkdir -p validator-classes validator-dex
java -jar /path/to/ecj-3.37.0.jar -11 -d validator-classes validator/KeyboxValidator.java
java -cp /path/to/r8-8.3.37.jar com.android.tools.r8.D8 --min-api 29 --output validator-dex validator-classes/KeyboxValidator.class 'validator-classes/KeyboxValidator$1.class'
cp validator-dex/classes.dex module/bin/validator.dex
java -cp validator-classes KeyboxValidator module/tricky/keybox.xml
```

The DEX is executed by Android's `app_process` only for keybox validation. The public Java utility does not print XML, private keys or raw parser errors. AOSP default keybox verification passed on the host JRE. Android provider/DEX execution still requires on-device verification.

## Rebuild upstream native components

Modern and legacy PlayIntegrityFork source trees have the native filesystem path literal changed to `/data/adb/modules/halloweenedition`. Java namespaces are unchanged. Their own Gradle/CMake files declare SDK/NDK/compiler and prefab dependencies. Tricky Store OSS's exported build file uses fixed v3.1.0 revision metadata so it can build without a `.git` directory. Its native/Kotlin logic is unchanged.

Use each project's declared build toolchain and run its Gradle `assembleRelease` task. Place a freshly rebuilt modern PIF DEX/libraries in `module/classes.dex` and `module/zygisk`, its legacy build under `module/legacy`, and OSS DEX/libraries in `module/tricky`. Re-run package tests after any replacement. **No full upstream native rebuild was completed in this environment.** The available source gitlink does not establish exact reproducibility of the supplied v44 PIF binary, so a rebuild is a new binary variant and requires regression tests.

## Engine routing regression tests

`python3 tools/test_engine.py` uses the actual descriptor, lifecycle controller, supervisor and repair orchestration in an isolated filesystem with a harmless stand-in daemon and local stand-in action. It verifies detection without a separate module directory, process ownership, idempotency, restart and data preservation. The test harness adapts host `/proc` lookup only when its PID namespace differs from the mounted procfs; shipped module code is unchanged. It does not execute Android native injection.

## Host tests

`tools/test_backend.py` exercises the actual shell control backend with `HE_ROOT` pointing to a temporary synthetic filesystem. Set `HE_VALIDATOR_CLASSES` in the test file/environment to the host validator class directory if its location differs. It never writes Android paths on a real device. `tools/test_installer.py` rewrites the installer's absolute data paths into a temporary fixture and simulates Manager-provided utility functions. It requires a current package manifest; run `tools/build.py` first.

`tools/test_ui.cjs` uses Playwright with a mocked root bridge and local HTTP server. Set `HE_PLAYWRIGHT` to the Playwright package and `HE_CHROME` to an installed Chromium executable. It exercises navigation, draft/save confirmation, state hydration, inline handler compilation and all tool-page initialization; it does not execute Android commands. Browser screenshots are local QA artifacts outside the release source tree.

The optional migration utility needs BeautifulSoup 4 and the shell adapter transformation needs Acorn. Final transformed pages are already supplied; these tools are not necessary for packaging. Do not rerun migration tools over already migrated code without reviewing the output.

See the report for the mandatory rooted-device acceptance sequence.

## Root compatibility regression

Run `python3 tools/test_root_compat.py` and `python3 tools/test_installer.py` after packaging. These use isolated manager fixtures and harmless resetprop stubs; no root-manager/native success on Android is claimed.
