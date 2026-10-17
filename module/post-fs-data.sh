#!/system/bin/sh
MODPATH=${0%/*}
. "$MODPATH/bin/root-compat.sh"
he_setup_runtime
STATE=/data/adb/halloweenedition
[ -e "$MODPATH/disable" ] && exit 0
umask 077
mkdir -p "$STATE"
rm -f "$STATE/boot.ready"
sh "$MODPATH/integrity-post-fs-data.sh" > "$STATE/early.log" 2>&1
rc=$?
printf '%s\n' "$rc" > "$STATE/early.exit"
exit "$rc"
