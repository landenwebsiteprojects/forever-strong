#!/system/bin/sh

MODPATH="/data/adb/modules/halloweenedition"
UPDATEPATH="/data/adb/modules_update/halloweenedition"

# Load common functions
if [ -f "$MODPATH/common_func.sh" ]; then
    . "$MODPATH/common_func.sh"
elif [ -f "$UPDATEPATH/common_func.sh" ]; then
    . "$UPDATEPATH/common_func.sh"
else
    echo "ERROR: common_func.sh not found"
    exit 1
fi

# Paths
umask 077
RECORD="/data/adb/Box-Brain"
TRICKY_STORE="/data/adb/tricky_store"
KEYBOX="$TRICKY_STORE/keybox.xml"
LOG_FILE="$RECORD/Integrity-Box-Logs/keybox.log"
TEMP_FILE="$(mktemp -p /data/local/tmp)"
CLEANUP="$MODPATH/webroot/common_scripts/cleanup.sh"
UCLEANUP="$UPDATEPATH/webroot/common_scripts/cleanup.sh"
BACKUP_DIR="$RECORD/KeyBackup"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
KEYBOX_BACKUP="$BACKUP_DIR/keybox_$TIMESTAMP.xml"
SIM_KEY="/data/adb/teesim/keybox.xml"
SIM_KEYBACKUP="$BACKUP_DIR/teesim_keybox_$TIMESTAMP.xml"

log() {
    echo "$*" | tee -a "$LOG_FILE"
}

# Cleanup temp files on exit
trap 'rm -f "$TEMP_FILE"' EXIT

# Create directories
mkdir -p "$TRICKY_STORE" "$RECORD" "$RECORD/Integrity-Box-Logs" "$BACKUP_DIR"
touch "$LOG_FILE"

# Get busybox path
BB=$(P)

# Backup existing keybox with timestamp
if [ -s "$KEYBOX" ]; then
    cp -f "$KEYBOX" "$KEYBOX_BACKUP"
    log " ✦ Backed up default keybox"
fi

# Keybox download URL
KEYBOX_URL="https://github.com/MeowDump/Integrity-Box/releases/download/archive/Megatron"

. "$MODPATH/bin/download.sh"
log "Fetching the official keybox source with automatic download fallbacks..."
he_download_file "$TEMP_FILE" "$KEYBOX_URL" || exit 3

# Decode the downloaded file
# The file is encoded as: base64 > hex > ROT13
log " "
log " ✦ Decoding keybox file..."

TMP_HEX="$(mktemp -p /data/local/tmp)"

# Base64 decode
CURRENT="$TEMP_FILE"
for i in $(seq 1 10); do
    NEXT="$(mktemp -p /data/local/tmp)"
    if ! base64 -d "$CURRENT" > "$NEXT" 2>/dev/null; then
        log " ✦ ERROR: Base64 decode failed at iteration $i"
        rm -f "$NEXT" "$TMP_HEX"
        exit 4
    fi
    rm -f "$CURRENT"
    CURRENT="$NEXT"
done

# Hex decode
decode_hex() {
    if command -v xxd >/dev/null 2>&1; then
        xxd -r -p "$CURRENT"
    elif [ -n "$BB" ]; then
        "$BB" xxd -r -p "$CURRENT"
    else
        echo 'Hex decoder unavailable' >&2
        return 1
    fi
}
if ! decode_hex > "$TMP_HEX" 2>/dev/null; then
    log " ✦ ERROR: Hex decoding failed"
    rm -f "$CURRENT" "$TMP_HEX"
    exit 5
fi
rm -f "$CURRENT"

# Decode into a private staged file. Never truncate the active keybox on failure.
STAGED_KEY=$(mktemp "$TRICKY_STORE/.keybox.XXXXXX") || exit 6
trap 'rm -f "$TEMP_FILE" "${CURRENT:-}" "${TMP_HEX:-}" "$STAGED_KEY"' EXIT
if ! tr 'A-Za-z' 'N-ZA-Mn-za-m' < "$TMP_HEX" > "$STAGED_KEY"; then
    log "ERROR: Keybox decoding failed; active keybox retained"
    exit 6
fi
if [ ! -s "$STAGED_KEY" ] || [ -L "$KEYBOX" ]; then
    log "ERROR: Invalid keybox destination or empty payload; active keybox retained"
    exit 7
fi
if ! CLASSPATH="$MODPATH/bin/validator.dex" /system/bin/app_process /system/bin KeyboxValidator "$STAGED_KEY" >/dev/null 2>&1; then
    log "ERROR: Downloaded keybox did not pass offline validation; active keybox retained"
    exit 7
fi
chmod 600 "$STAGED_KEY" || exit 7
mv -f "$STAGED_KEY" "$KEYBOX" || exit 7
rm -f "$TMP_HEX"

log " ✦ Keybox upgrade complete"
log " "

# Clean temporary files
if [ -f "$CLEANUP" ]; then
  sh "$CLEANUP" > /dev/null 2>&1
elif [ -f "$UCLEANUP" ]; then
  sh "$UCLEANUP" > /dev/null 2>&1
fi

# OMK Keybox Support
OMK_DIR="/data/misc/keystore/omk"
OMK_KEYBOX="$OMK_DIR/keybox.xml"
OMK_KEYBOX_BAK="$OMK_DIR/keybox.xml.bak"

if he_external_enabled oh_my_keymint && [ -d "$OMK_DIR" ]; then
    if [ -s "$OMK_KEYBOX" ]; then
        cp -f "$OMK_KEYBOX" "$OMK_KEYBOX_BAK"
        log " ✦ KeyMint attestation archived"
    fi
    cp -f "$KEYBOX" "$OMK_KEYBOX"
    log " ✦ Attestation loaded to KeyMint"
fi

# Backup TEE SIM keybox with timestamp
if he_external_enabled teesim && [ -s "$SIM_KEY" ]; then
    cp -f "$SIM_KEY" "$SIM_KEYBACKUP"
    log " ✦ TEE-SIM attestation archived"
fi

# Copy keybox to SIM path
if he_external_enabled teesim && [ -d "/data/adb/teesim" ] && [ -s "$KEYBOX" ]; then
    cp -f "$KEYBOX" "$SIM_KEY"
    log " ✦ Attestation loaded to TEE-SIM"
fi
