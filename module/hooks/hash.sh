#!/system/bin/sh

HASH_FILE="/data/adb/Box-Brain/hash.txt"
LOG_DIR="/data/adb/Box-Brain/Integrity-Box-Logs"
LOG_FILE="$LOG_DIR/vbmeta.log"

mkdir -p "$LOG_DIR"

log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') | $1" >> "$LOG_FILE"
}

# Exit if module is disabled or safe mode is enabled 
if [ -f "/data/adb/modules/halloweenedition/disable" ]; then
    log "Integrity Box is disabled, exiting..."
    exit 0
fi

if [ -f "/data/adb/Box-Brain/safemode" ]; then
    log "Safe mode is enabled"
    log "Skipping boot hash spoofing"
    exit 0
fi

log " "
log "Script started"

# Find resetprop
# service.sh exports the active manager's tool directory; do not prefer stale Magisk files.
RESETPROP=$(command -v resetprop 2>/dev/null)

if [ -z "$RESETPROP" ]; then
  log "ERROR: resetprop binary not found. Exiting."
  exit 1
fi

log "Using resetprop: $RESETPROP"

# Always set static default props
"$RESETPROP" ro.boot.vbmeta.size "4096"
"$RESETPROP" ro.boot.vbmeta.hash_alg "sha256"
"$RESETPROP" ro.boot.vbmeta.avb_version "2.0"
"$RESETPROP" ro.boot.vbmeta.device_state "locked"
log "Set static VBMeta props: size=4096, hash_alg=sha256, avb_version=2.0, device_state=locked"

# Handle hash
if [ ! -s "$HASH_FILE" ]; then
  log "Hash file missing or empty : clearing vbmeta.digest"
  "$RESETPROP" --delete ro.boot.vbmeta.digest
  exit 0
fi

# Extract hash
DIGEST=$(tr -cd '0-9a-fA-F' < "$HASH_FILE")

if [ -z "$DIGEST" ]; then
  log "Hash file contained no valid hex. Clearing vbmeta.digest."
  "$RESETPROP" --delete ro.boot.vbmeta.digest
  exit 0
fi

if [ "${#DIGEST}" -ne 64 ]; then
  log "Invalid hash length (${#DIGEST}). Expected 64 (SHA-256). Clearing vbmeta.digest."
  "$RESETPROP" --delete ro.boot.vbmeta.digest
  exit 0
fi

# Set digest if valid
"$RESETPROP" ro.boot.vbmeta.digest "$DIGEST"
log "Set ro.boot.vbmeta.digest = $DIGEST"
log " "

exit 0
