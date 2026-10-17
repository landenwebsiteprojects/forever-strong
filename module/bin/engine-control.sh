#!/system/bin/sh
BASE=${0%/*}
. "$BASE/integration.sh"
op=${1:-status}
[ "$op" != status ] || { he_engine_status; exit 0; }
case "$op" in ensure|restart) ;; *) echo 'Unsupported engine operation' >&2; exit 1;; esac
he_engine_installed || { echo 'Bundled Tricky Store OSS payload is incomplete. Reinstall the unified module.' >&2; exit 1; }
he_engine_enabled || { echo 'ForeverStrong is disabled or marked for removal. Enable it and reboot.' >&2; exit 1; }
umask 077
mkdir -p "$HE_STATE_DIR"
ENGINE_LOCK="$HE_STATE_DIR/engine-control.lock"
if [ -f "$ENGINE_LOCK/owner" ] && ! he_read_pid "$ENGINE_LOCK/owner" >/dev/null; then
    rm -f "$ENGINE_LOCK/owner"
    rmdir "$ENGINE_LOCK" 2>/dev/null
fi
mkdir "$ENGINE_LOCK" 2>/dev/null || { echo 'An engine lifecycle operation is already running.' >&2; exit 1; }
trap 'rm -f "$ENGINE_LOCK/owner"; rmdir "$ENGINE_LOCK" 2>/dev/null' EXIT
he_record_pid "$ENGINE_LOCK/owner" "$$" || { echo 'Cannot record the lifecycle owner from /proc.' >&2; exit 1; }
old_worker=$(he_worker_pid)
if [ "$op" = restart ] && [ -n "$old_worker" ]; then
    touch "$HE_STATE_DIR/tricky.restart"
    kill "$old_worker" || { echo 'Cannot signal the owned OSS daemon' >&2; exit 1; }
    n=0
    while [ "$(he_worker_pid)" = "$old_worker" ] && [ "$n" -lt 5 ]; do sleep 1; n=$((n+1)); done
    [ "$(he_worker_pid)" != "$old_worker" ] || { echo 'Owned OSS daemon did not stop. Reboot instead of forcing another instance.' >&2; exit 1; }
fi
if ! he_supervisor_pid >/dev/null; then
    # Recover only an unowned stale directory after its PID record is proven dead.
    [ ! -d "$HE_STATE_DIR/tricky-supervisor.lock" ] || rmdir "$HE_STATE_DIR/tricky-supervisor.lock" 2>/dev/null
    rm -f "$HE_STATE_DIR/tricky.error"
    nohup sh "$BASE/tricky-supervisor.sh" > "$HE_STATE_DIR/tricky-supervisor.log" 2>&1 < /dev/null &
fi
n=0
while [ "$n" -lt 15 ]; do
    worker=$(he_worker_pid)
    if [ -n "$worker" ] && { [ "$op" != restart ] || [ "$worker" != "$old_worker" ]; }; then
        echo 'Bundled Tricky Store OSS process is running under the unified supervisor. Interception still requires a device test.'
        exit 0
    fi
    if [ "$n" -gt 1 ] && ! he_supervisor_pid >/dev/null && [ -f "$HE_STATE_DIR/tricky.error" ]; then
        cat "$HE_STATE_DIR/tricky.error" >&2
        exit 1
    fi
    sleep 1; n=$((n+1))
done
echo 'Bundled OSS did not reach a running process state. Check Diagnostics and reboot if an old daemon remains.' >&2
exit 1
