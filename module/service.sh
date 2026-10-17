#!/system/bin/sh
MODPATH=${0%/*}
. "$MODPATH/bin/root-compat.sh"
he_setup_runtime
STATE=/data/adb/halloweenedition
umask 077
mkdir -p "$STATE"
[ -e "$MODPATH/disable" ] && exit 0
bootid=$(cat /proc/sys/kernel/random/boot_id)
LOCK="$STATE/boot-$bootid"
mkdir "$LOCK" 2>/dev/null || exit 0
rm -f "$STATE/boot.ready"
sh "$MODPATH/hooks/hash.sh" > "$STATE/hash.log" 2>&1
hash_rc=$?
printf '%s\n' "$hash_rc" > "$STATE/hash.exit"
(sh "$MODPATH/hooks/lineage.sh" > "$STATE/lineage.log" 2>&1; echo $? > "$STATE/lineage.exit") &
lineage_pid=$!
(sh "$MODPATH/hooks/prop.sh" > "$STATE/prop.log" 2>&1; echo $? > "$STATE/prop.exit") &
prop_pid=$!
# OSS injection uses relative paths; its supervisor runs from the OSS directory.
sh "$MODPATH/bin/engine-control.sh" ensure > "$STATE/engine-start.log" 2>&1 &
sh "$MODPATH/integrity-service.sh" > "$STATE/integrity-service.log" 2>&1
rc=$?
printf '%s\n' "$rc" > "$STATE/integrity-service.exit"
wait "$lineage_pid" "$prop_pid"
# Safe-mode skips return 1 upstream; show the recorded status rather than inventing success.
if [ "$rc" -eq 0 ] && [ "$hash_rc" -eq 0 ] && [ "$(cat "$STATE/lineage.exit")" -eq 0 ] && [ "$(cat "$STATE/prop.exit")" -eq 0 ]; then
    touch "$STATE/boot.ready"
fi
exit "$rc"
