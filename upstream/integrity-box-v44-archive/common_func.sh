RECORD="/data/adb/Box-Brain/Integrity-Box-Logs"
OUT="/storage/emulated/0/Download/IntegrityModules"
BOX="/data/adb/Box-Brain"
LOGZ="/data/adb/Box-Brain/Integrity-Box-Logs/move.log"
LOG_FILE="/data/adb/Box-Brain/Integrity-Box-Logs/action.log"
WIDTH=53

# Truncate per-run logs once at startup instead of inside every logger
mkdir -p "$RECORD"
for _f in denylist.log lineage.log patch.log boot.log; do
    : > "$RECORD/$_f"
done
: > "$LOG_FILE"

record() { # record <file> <message>
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $2" >> "$RECORD/$1"
}
say() {    # say <file> <message>
    record "$1" "$2"; echo "$2"
}
log() {    # log <message>
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
    /system/bin/log -t PATCH_OVERRIDE "$1"
}

make_exec() {
    chmod +x "$1"
}

# Property Backend Setup
RESETPROP="resetprop -n"
PROP_DELETE="resetprop --delete"
COMPACT_SUPPORTED=false
PROP_WAIT="resetprop -w"
IS_MAGISK=false

setup_resetprop() {
    if [ -f "/data/adb/magisk" ] || [ -f "/data/adb/magisk/magisk" ]; then
        if [ -f /data/adb/magisk/util_functions.sh ]; then
            MAGISK_VER=$(grep MAGISK_VER_CODE /data/adb/magisk/util_functions.sh | cut -d= -f2)
            [ "$MAGISK_VER" -lt 27003 ] 2>/dev/null && RESETPROP="resetprop_hexpatch"
        fi
        resetprop --help 2>&1 | grep -q "compact" && COMPACT_SUPPORTED=true
    else
        for _p in /data/adb/ksu/bin /data/adb/ap/bin; do
            [ -x "$_p/resetprop" ] && { export PATH="$_p:$PATH"; break; }
        done
        COMPACT_SUPPORTED=true
    fi
}
setup_resetprop

# stub for boot-time
if [ "$(getprop sys.boot_completed)" != "1" ]; then
    ui_print() { return; }
fi

run_compact() {
    $COMPACT_SUPPORTED && resetprop -c 2>/dev/null
}

make_exec() {
    chmod 755 "$1"
}

randomize_banner() {
    local prop_file="/data/adb/modules/playintegrityfix/module.prop"
    local base_url="https://raw.githubusercontent.com/MeowDump/MeowDump/refs/heads/main/Banner"
    local random_num=$((RANDOM % 14 + 1))
    local new_banner="${base_url}/mona${random_num}.png"

    sed -i "s|^banner=.*|banner=${new_banner}|" "$prop_file"
}

detect_downloader() {
  if command -v curl >/dev/null 2>&1; then
    DOWNLOADER=$(command -v curl); DL_MODE="curl"; return
  fi
  if command -v wget >/dev/null 2>&1; then
    DOWNLOADER=$(command -v wget); DL_MODE="wget"; return
  fi
  if [ -x /data/adb/magisk/busybox ]; then
    DOWNLOADER="/data/adb/magisk/busybox"; DL_MODE="busybox"; return
  fi
  if [ -x /data/adb/ksu/bin/busybox ]; then
    DOWNLOADER="/data/adb/ksu/bin/busybox"; DL_MODE="busybox"; return
  fi
  if toybox wget --help >/dev/null 2>&1; then
    DOWNLOADER="toybox"; DL_MODE="toybox"; return
  fi
  DOWNLOADER=""; DL_MODE=""
}

# Connectivity check 
wait_for_network() { 
  local max_wait="${1:-30}" step=2 waited=0 host

  while [ "$waited" -lt "$max_wait" ]; do
    for host in 1.1.1.1 8.8.8.8 9.9.9.9 223.5.5.5 114.114.114.114; do
      ping -c1 -W2 "$host" >/dev/null 2>&1 && return 0
    done
    sleep "$step"
    waited=$((waited+step))
  done
  return 1
}

safe_mv() {
  src="$1"; dst="$2"
  mkdir -p "$(dirname "$dst")"
  mv "$src" "$dst" 2>>"$LOGZ" || cp -f "$src" "$dst" 2>>"$LOGZ" && rm -f "$src"
  return $?
}

denylog() { say denylist.log "$1"; }
lineage() { say lineage.log "$*"; }
chup()    { record pixel.log "$1"; }
boot_log(){ say boot.log "$1"; }
log_patch(){ record patch.log "$*"; }
writelog(){ log "$1"; }

# Configure DenyList
add_if_missing() {
    pkg="$1"; proc="$2"
    entry="$pkg|${proc:-$pkg}"
    if ! magisk --denylist ls | grep -q "$entry"; then
        magisk --denylist add "$pkg" $proc
        denylog "[AutoDeny] Added $entry"
    fi
}

setval() { grep -q "^$2=" "$1" && sed -i "s/^$2=.*/$2=$3/" "$1" && log "$2 > $3" || log "$2 not found"; }

add_pkg() {
  pkg="$1"
  if [ "$teeBroken" = "true" ]; then
    echo "${pkg}!" >> "$TMP"
  else
    echo "$pkg" >> "$TMP"
  fi
}

print_header() {
  echo "
  ___     _                _ _
 |_ _|_ _| |_ ___ __ _ _ _(_) |_ _  _
  | || ' \  _/ -_) _  | '_| |  _| || |
 |___|_||_\__\___\__, |_| |_|\__|\_, |
 | _ ) _____ __  |___/           |__/
 | _ \/ _ \ \ /
 |___/\___/_\_\


"
}

log_step() {
  local status="$1" task="$2" timestamp
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  printf -- " ✦ %-10s %s\n" "$status" "$task"
  printf "[%s] %-10s %s\n" "$timestamp" "$status" "$task" >> "$LOG_FILE"
}

handle_delay() {
  if [ "$KSU" = "true" ] || [ "$APATCH" = "true" ] && [ "$KSU_NEXT" != "true" ] && [ "$MMRL" != "true" ]; then
    echo
    echo " Closing in 7 seconds..."
    sleep 7
  fi
}

kill_process() {
  TARGET="$1"
  PID=$(pidof "$TARGET")
  if [ -n "$PID" ]; then
    kill -9 $PID
    log "- Killed $TARGET"
  else
    log "- $TARGET not running"
  fi
}

hide_recovery_folders() {
    [ -f /data/adb/Box-Brain/twrp ] || return

    SRC="/sdcard"
    DEST="/data/adb/recovery_backups"
    mkdir -p "$DEST"

    FOLDERS="TWRP OrangeFox FOX PBRP PitchBlack Recovery"

    random_str() { head /dev/urandom | tr -dc A-Za-z0-9 | head -c 12; }

    for F in $FOLDERS; do
        DIR="$SRC/$F"
        [ -d "$DIR" ] || continue

        if [ -f "$DIR/.twrps" ]; then
            rm -f "$DIR/.twrps" 2>/dev/null
            if [ -f "$DIR/.twrps" ]; then
                NEWF=".$(random_str)_$(date +%s)"
                mv "$DIR" "$SRC/$NEWF" 2>/dev/null
                DIR="$SRC/$NEWF"
                rm -f "$DIR/.twrps" 2>/dev/null
            fi
        fi

        SUB=$(find "$DIR" -mindepth 1 -maxdepth 1 -type d ! -name ".*" 2>/dev/null | wc -l)

        if [ "$SUB" -gt 0 ]; then
            mv "$DIR" "$DEST/$(random_str)" 2>/dev/null
        else
            rm -rf "$DIR" 2>/dev/null
        fi
    done
}

run_temp_exec() {
    local script="$1" orig_mode

    if [ ! -r "$script" ]; then
        echo "Script $script not readable ❌"
        return 1
    fi

    orig_mode=$(stat -c "%a" "$script")
    echo "Original permission: $orig_mode"

    chmod +x "$script"
    echo "Temporary +x granted, executing..."
    "$script"

    echo "Execution finished, reverting permission"
    chmod "$orig_mode" "$script"
}

remove_if_exists() {
    if [ -e "$1" ]; then
        rm -rf "$1"
        record action.log "Deleted: $1"
    fi
}

safemode_flags() {
    local dir="/data/adb/Box-Brain"
    [ -f "$dir/safemode" ] || return 0

    for f in spoof-los-boot nuke-los-boot spoof-custom-rom-boot NoLineageProp nodebug build tag encrypt hidehook; do
        remove_if_exists "$dir/$f"
    done
}

# BusyBox detector
P() {
  for Q in /data/adb/modules/busybox-ndk/system/*/busybox \
           /data/adb/ksu/bin/busybox \
           /data/adb/ap/bin/busybox \
           /data/adb/magisk/busybox; do
    [ -x "$Q" ] && echo "$Q" && return
  done
}

# Base64 decoder
Z() {
  b=0; s=0
  while IFS= read -r -n1 c; do
    case "$c" in
      [A-Z]) v=$(printf '%d' "'$c"); v=$((v - 65));;
      [a-z]) v=$(printf '%d' "'$c"); v=$((v - 71));;
      [0-9]) v=$(printf '%d' "'$c"); v=$((v + 4));;
      '+') v=62;;
      '/') v=63;;
      '=') break;;
      *) continue;;
    esac
    b=$((b << 6 | v)); s=$((s + 6))
    if [ "$s" -ge 8 ]; then
      s=$((s - 8)); o=$(((b >> s) & 0xFF))
      printf \\$(printf '%03o' "$o")
    fi
  done
}

check_and_set_prop() {
    local PROP="$1"
    local VALUE="$2"
    local CURRENT

    if [ -f /data/adb/Box-Brain/force-reset ]; then
        if $RESETPROP "$PROP" "$VALUE" >/dev/null 2>&1; then
            record pixel.log "Forced $PROP > $VALUE"
            return 0
        fi

        record pixel.log "Failed to force $PROP"
        return 1
    fi

    if ! getprop | grep -Fq "[$PROP]:"; then
        record pixel.log "Skipped $PROP (not found)"
        return 0
    fi

    CURRENT=$(getprop "$PROP")

    if [ "$CURRENT" = "$VALUE" ]; then
        record pixel.log "Unchanged $PROP = $CURRENT"
        return 0
    fi

    if $RESETPROP "$PROP" "$VALUE" >/dev/null 2>&1; then
        record pixel.log "Set $PROP > $VALUE (was: $CURRENT)"
        return 0
    fi

    record pixel.log "Failed to set $PROP"
    return 1
}

resetprop_if_match() {
    local PROP="$1"
    local MATCH="$2"
    local VALUE="$3"
    local CURRENT

    CURRENT=$(resetprop "$PROP")

    case "$CURRENT" in
        *"$MATCH"*)
            if $RESETPROP "$PROP" "$VALUE" >/dev/null 2>&1; then
                record pixel.log "Matched $PROP: $CURRENT -> $VALUE"
                return 0
            fi

            record pixel.log "Failed modifying $PROP"
            return 1
            ;;
    esac

    return 2
}

delprop_if_exist() {
    local PROP="$1"

    if resetprop "$PROP" >/dev/null 2>&1; then
        if $PROP_DELETE "$PROP" >/dev/null 2>&1; then
            record pixel.log "Deleted $PROP"
            return 0
        fi

        record pixel.log "Failed deleting $PROP"
        return 1
    fi

    return 2
}

persistprop() {
    local NAME="$1"
    local NEWVALUE="$2"
    local CURVALUE

    CURVALUE=$(resetprop "$NAME")

    if ! grep -qF "\"$NAME\"" "$MODPATH/uninstall.sh" 2>/dev/null; then
        if [ -n "$CURVALUE" ]; then
            [ "$NEWVALUE" = "$CURVALUE" ] || \
                echo "resetprop -n -p \"$NAME\" \"$CURVALUE\"" >> "$MODPATH/uninstall.sh"
        else
            echo "resetprop -p --delete \"$NAME\"" >> "$MODPATH/uninstall.sh"
        fi
    fi

    resetprop -n -p "$NAME" "$NEWVALUE"
}

# Hexpatch Fallback
resetprop_hexpatch() {
    case "$1" in
        -f|--force) local FORCE=1; shift;;
    esac

    local NAME="$1"
    local NEWVALUE="$2"
    local CURVALUE
    CURVALUE=$(resetprop "$NAME")

    [ ! "$NEWVALUE" ] || [ ! "$CURVALUE" ] && return 1
    [ "$NEWVALUE" = "$CURVALUE" ] && [ ! "$FORCE" ] && return 2

    local NEWLEN=${#NEWVALUE}
    local PROPFILE
    if [ -f /dev/__properties__ ]; then
        PROPFILE=/dev/__properties__
    else
        PROPFILE="/dev/__properties__/$(resetprop -Z "$NAME")"
    fi
    [ ! -f "$PROPFILE" ] && return 3
    local NAMEOFFSET
    NAMEOFFSET=$(strings -t d "$PROPFILE" | grep "$NAME" | head -1 | cut -d\  -f1)

    local NEWHEX
    NEWHEX="$(printf '%02x' "$NEWLEN")$(printf "$NEWVALUE" | od -A n -t x1 -v | tr -d ' \n')$(printf "%$((92-NEWLEN))s" | sed 's/ /00/g')"
    echo -ne "\x00\x00" | dd obs=1 count=2 seek=$((NAMEOFFSET-96)) conv=notrunc of="$PROPFILE" 2>/dev/null
    echo -ne "$(printf "$NEWHEX" | sed -e 's/.\{2\}/&\\x/g' -e 's/^/\\x/' -e 's/\\x$//')" | dd obs=1 count=93 seek=$((NAMEOFFSET-93)) conv=notrunc of="$PROPFILE" 2>/dev/null
}

wait_for_boot() {
    say boot.log "Waiting for Android to finish booting..."
    local count=0
    while [ "$(getprop sys.boot_completed)" != "1" ]; do
        sleep 1
        count=$((count + 1))
        [ "$count" -ge 300 ] && { say boot.log "Boot wait timeout"; return 1; }
    done
    sleep 3
    say boot.log "Initialising, please wait."
    say boot.log " "
}

reset_tricky_store() {
    if [ -d "/data/adb/tricky_store/key_db" ]; then
        rm -rf "/data/adb/tricky_store/key_db"
        mkdir -p "/data/adb/tricky_store/key_db"
    fi

    if [ -d "/data/adb/tricky_store/persistent_keys" ]; then
        rm -rf "/data/adb/tricky_store/persistent_keys"
        mkdir -p "/data/adb/tricky_store/persistent_keys"
    fi
}
