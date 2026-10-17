#!/system/bin/sh
# Authoritative architecture descriptor. Shared config paths match OSS's native implementation.
HE_PREFIX=${HE_ROOT:-}
HE_MODULE_DIR="$HE_PREFIX${HE_MODULE:-/data/adb/modules/halloweenedition}"
HE_ENGINE_DIR="$HE_MODULE_DIR/tricky"
HE_CONFIG_DIR="$HE_PREFIX/data/adb/tricky_store"
HE_STATE_DIR="$HE_PREFIX/data/adb/halloweenedition"
he_engine_installed() {
    for he_file in classes.dex daemon inject libTrickyStoreOSS.so; do
        [ -s "$HE_ENGINE_DIR/$he_file" ] || return 1
    done
}
he_engine_enabled() { [ ! -e "$HE_MODULE_DIR/disable" ] && [ ! -e "$HE_MODULE_DIR/remove" ]; }
he_external_enabled() {
    case "$1" in teesim|oh_my_keymint) ;; *) return 1;; esac
    he_external="$HE_PREFIX/data/adb/modules/$1"
    [ -f "$he_external/module.prop" ] && [ ! -e "$he_external/disable" ] && [ ! -e "$he_external/remove" ]
}
he_process_start() { sed 's/^[0-9]* (.*) //' "/proc/$1/stat" 2>/dev/null | awk '{print $20}'; }
he_record_pid() {
    he_start=$(he_process_start "$2")
    [ -n "$he_start" ] || return 1
    printf '%s %s\n' "$2" "$he_start" > "$1.new" && mv -f "$1.new" "$1"
}
he_read_pid() {
    [ -f "$1" ] || return 1
    read -r he_pid he_ticks < "$1"
    case "$he_pid:$he_ticks" in *[!0-9:]*|:|*:) return 1;; esac
    [ -n "$he_pid" ] && [ "$(he_process_start "$he_pid")" = "$he_ticks" ] || return 1
    # A zombie has exited even if its parent hasn't reaped it yet.
    he_state=$(sed 's/^[0-9]* (.*) //' "/proc/$he_pid/stat" 2>/dev/null | cut -d' ' -f1)
    [ "$he_state" != Z ] || return 1
    printf '%s\n' "$he_pid"
}
he_worker_pid() { he_read_pid "$HE_STATE_DIR/tricky-worker.pid"; }
he_supervisor_pid() { he_read_pid "$HE_STATE_DIR/tricky-supervisor.pid"; }
he_engine_status() {
    echo 'owner=halloweenedition'
    echo 'kind=TrickyStoreOSS'
    printf 'module=%s\nengine=%s\nconfig=%s\n' "$HE_MODULE_DIR" "$HE_ENGINE_DIR" "$HE_CONFIG_DIR"
    he_engine_installed && echo installed=1 || echo installed=0
    he_engine_enabled && echo enabled=1 || echo enabled=0
    if he_worker_pid >/dev/null; then echo running=1; else echo running=0; fi
    if he_supervisor_pid >/dev/null; then echo supervised=1; else echo supervised=0; fi
    he_external_enabled teesim && echo external_teesim=1 || echo external_teesim=0
    he_external_enabled oh_my_keymint && echo external_omk=1 || echo external_omk=0
    echo 'interception=not verified by process presence'
}
he_reset_legacy_cache() {
    # Preserve OSS v3.1.0's actual /keys persistence store. Reinitializing it would invalidate app keys.
    [ "${HE_CACHE_RESET_DONE:-}" != true ] || return 0
    he_cache_backup="$HE_STATE_DIR/legacy-cache-backups/$(date +%Y%m%d-%H%M%S)-$$"
    for he_cache_name in key_db persistent_keys; do
        he_cache="$HE_CONFIG_DIR/$he_cache_name"
        [ -e "$he_cache" ] || continue
        [ -d "$he_cache" ] && [ ! -L "$he_cache" ] || { echo 'Refusing non-directory legacy cache' >&2; return 1; }
        mkdir -p "$he_cache_backup" || return 1
        mv "$he_cache" "$he_cache_backup/$he_cache_name" && mkdir -p "$he_cache" || return 1
    done
    HE_CACHE_RESET_DONE=true
    export HE_CACHE_RESET_DONE
}
