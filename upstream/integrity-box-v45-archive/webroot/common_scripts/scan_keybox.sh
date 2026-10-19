#!/system/bin/sh

OUT="/data/adb/Box-Brain/Integrity-Box-Logs/keybox_scan.log"
TARGET="/sdcard/Download"

rm -f "$OUT"

# epoch|size_bytes|full_path
find "$TARGET" -type f -iname "*.xml" -printf "%T@|%s|%p\n" 2>/dev/null \
  | sort -nr >> "$OUT"
