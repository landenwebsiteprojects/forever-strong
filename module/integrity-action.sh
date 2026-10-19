#!/system/bin/sh

MODPATH="${0%/*}"
. "$MODPATH/common_func.sh"

# Paths
BOX="/data/adb/Box-Brain"
LOGDIR="$BOX/Integrity-Box-Logs"
SCRIPT_DIR="$MODPATH/webroot/common_scripts"

mkdir -p "$BOX" "$LOGDIR"
print_header
cleanup_root_logs
cleanup_ota
cleanup_lsposed
cleanup_gapps_logs
reset_tricky_store || exit 1
download_keybox || exit 1
update_targets || exit 1
sh "$SCRIPT_DIR/cleanup.sh" >/dev/null 2>&1;
sh "$MODPATH/osm0sis.sh" || { echo "Fingerprint update failed; existing installed configuration retained." >&2; exit 1; }
handle_security_patch || exit 1
restart_google_services
update_module_description
echo " "
echo " "
echo "    -- ACTION COMPLETED SUCCESSFULLY --"

if [ "$KSU_NEXT" = "true" ]; then
    sh "$SCRIPT_DIR/hehe.sh"
fi

handle_delay
exit 0
