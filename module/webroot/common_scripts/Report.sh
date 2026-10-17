#!/system/bin/sh
MOD=/data/adb/modules/halloweenedition
OUT=/sdcard/Download/ForeverStrong-diagnostics.txt
mkdir -p /sdcard/Download || exit 1
sh "$MOD/bin/control.sh" diagnostics > "$OUT" || exit 1
echo "Sanitized diagnostics saved to $OUT"
