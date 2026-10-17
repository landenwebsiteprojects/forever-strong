This `legacy` folder exists to keep the module compatible with older x86/x86_64 hardware, where Shadow Hook is not supported. Instead of maintaining separate modules for modern and legacy devices, both implementations are included in the same package and the correct one is selected automatically during installation.

On installation, IntegrityBox checks the device ABI:

- `armeabi-v7a` / `arm64-v8a` = Modern hardware >>> uses the latest Shadow Hook implementation. The `legacy` folder is removed because it is not needed.

- Other ABIs (mainly x86/x86_64) = Legacy hardware >>> the Shadow Hook files are replaced with the Dobby-based fallback from this folder.

The `v7a` and `v8a` variants are also kept in the legacy package as a safety measure. If ABI detection behaves unexpectedly, these files help prevent the module from failing due to missing architecture variant.

In short, this `legacy` folder allows one module to support both modern and legacy hardware without requiring separate releases, while modern devices continue to use the preferred Shadow Hook implementation

if you still have any questions feel free to contact me on telegram @TempMeow