#!/system/bin/sh

MODPATH="/data/adb/modules/halloweenedition"
. $MODPATH/common_func.sh

# Module path and file references
LOG_DIR="/data/adb/Box-Brain/Integrity-Box-Logs"
PROP="/data/adb/modules/halloweenedition/system.prop"

note() {
    TS="$(date '+%Y-%m-%d %H:%M:%S')"
    mkdir -p "$LOG_DIR" 2>/dev/null
    printf "%s | %s\n" "$TS" "$1" >> "$LOG_DIR/Lineage.log"
}

# Abort the script & delete flags wen safe mode is active
if [ -f "/data/adb/Box-Brain/safemode" ]; then
    note "$(date '+%Y-%m-%d %H:%M:%S') : Safemode active, script aborted." >> "/data/adb/Box-Brain/Integrity-Box-Logs/safemode.log"
    safemode_flags
    exit 1
fi

# Exit if module is disabled
if [ -f "/data/adb/modules/halloweenedition/disable" ]; then
    note "Integrity Box is disabled, exiting..."
    exit 0
fi

# Module install path
export MODPATH="/data/adb/modules/halloweenedition"

NO_LINEAGE_FLAG="/data/adb/Box-Brain/NoLineageProp"
NODEBUG_FLAG="/data/adb/Box-Brain/nodebug"
TAG_FLAG="/data/adb/Box-Brain/tag"

TMP_PROP="$MODPATH/tmp.prop"
SYSTEM_PROP="$MODPATH/system.prop"
> "$TMP_PROP" # clear old temp file

# Build summary of active flags
FLAGS_ACTIVE=""
[ -f "$NO_LINEAGE_FLAG" ] && FLAGS_ACTIVE="$FLAGS_ACTIVE NoLineageProp"
[ -f "$NODEBUG_FLAG" ] && FLAGS_ACTIVE="$FLAGS_ACTIVE nodebug"
[ -f "$TAG_FLAG" ] && FLAGS_ACTIVE="$FLAGS_ACTIVE tag"

if [ -n "$FLAGS_ACTIVE" ]; then
    note "Prop sanitization flags active: $FLAGS_ACTIVE"
    note "Preparing temporary prop file..."
    getprop | grep "userdebug" >> "$TMP_PROP"
    getprop | grep "test-keys" >> "$TMP_PROP"
    getprop | grep "lineage_" >> "$TMP_PROP"

    # Convert Android getprop output from "[key]: [value]" to the
    # key=value syntax required by system.prop loaders.
    sed -i 's///g' "$TMP_PROP"
    sed -i -E 's/^\[([^]]+)\]: \[(.*)\]$/\1=\2/' "$TMP_PROP"
else
    note "No prop sanitization flags found. Skipping."
fi

# LineageOS cleanup
if [ -f "$NO_LINEAGE_FLAG" ]; then
    note "NoLineageProp flag detected. Deleting LineageOS props..."
    for prop in \
        ro.lineage.build.version \
        ro.lineage.build.version.plat.rev \
        ro.lineage.build.version.plat.sdk \
        ro.lineage.device \
        ro.modversion \
        ro.lineage.display.version \
        ro.lineage.releasetype \
        ro.lineage.version \
        ro.lineagelegal.url; do
        resetprop --delete "$prop"
    done
    sed -i 's/lineage_//g' "$TMP_PROP"
    note "LineageOS props sanitized."
fi

# userdebug to user
if [ -f "$NODEBUG_FLAG" ]; then
    if grep -q "userdebug" "$TMP_PROP"; then
        sed -i 's/userdebug/user/g' "$TMP_PROP"
    fi
    note "userdebug to user sanitization applied."
fi

# test-keys to release-keys
if [ -f "$TAG_FLAG" ]; then
    if grep -q "test-keys" "$TMP_PROP"; then
        sed -i 's/test-keys/release-keys/g' "$TMP_PROP"
    fi
    note "test-keys to release-keys sanitization applied."
fi

# Finalize system.prop
if [ -s "$TMP_PROP" ]; then
    note "Sorting and creating final system.prop..."
    sort -u "$TMP_PROP" > "$SYSTEM_PROP"
    rm -f "$TMP_PROP"
    note "system.prop created at $SYSTEM_PROP."

    note "Waiting 30 seconds before applying props..."
    sleep 30

    note "Applying props via resetprop..."
    resetprop -n --file "$SYSTEM_PROP"
    note "Prop sanitization applied from system.prop"
fi

# Explicit fingerprint sanitization
if [ -f "$NODEBUG_FLAG" ] || [ -f "$TAG_FLAG" ]; then
    fp=$(getprop ro.build.fingerprint)
    fp_clean="$fp"

    [ -f "$NODEBUG_FLAG" ] && fp_clean=${fp_clean/userdebug/user}
    [ -f "$TAG_FLAG" ] && {
        fp_clean=${fp_clean/test-keys/release-keys}
        fp_clean=${fp_clean/dev-keys/release-keys}
    }

    if [ "$fp" != "$fp_clean" ]; then
        resetprop ro.build.fingerprint "$fp_clean"
        [ -f "$NODEBUG_FLAG" ] && resetprop ro.build.type "user"
        [ -f "$TAG_FLAG" ] && resetprop ro.build.tags "release-keys"
        note "Fingerprint sanitized to $fp_clean"
    else
        note "Fingerprint already clean. No changes applied."
    fi
fi
