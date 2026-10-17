#!/system/bin/sh
BASE=${0%/*}
. "$BASE/integration.sh"
umask 077
mkdir -p "$HE_STATE_DIR"
he_engine_installed && he_engine_enabled || exit 1
# PID plus /proc start time prevents PID reuse from claiming an unrelated process.
if he_supervisor_pid >/dev/null; then exit 0; fi
SUPERVISOR_LOCK="$HE_STATE_DIR/tricky-supervisor.lock"
if ! mkdir "$SUPERVISOR_LOCK" 2>/dev/null; then
    # A newly starting supervisor may not have recorded its PID yet. Do not race it.
    he_supervisor_pid >/dev/null && exit 0
    echo 'Supervisor lock exists without a live owner; retry after reboot or inspect Diagnostics.' >&2
    exit 1
fi
he_record_pid "$HE_STATE_DIR/tricky-supervisor.pid" "$$" || exit 1
child=''
cleanup() {
    trap - EXIT HUP INT TERM
    owned=$(he_worker_pid) && [ "$owned" = "$child" ] && kill "$owned" 2>/dev/null
    rm -f "$HE_STATE_DIR/tricky-worker.pid" "$HE_STATE_DIR/tricky-supervisor.pid"
    rmdir "$SUPERVISOR_LOCK" 2>/dev/null
}
trap cleanup EXIT
trap 'exit 0' HUP INT TERM
cd "$HE_ENGINE_DIR" || exit 1
# An untracked external or pre-upgrade daemon is never killed by this supervisor.
if he_worker_pid >/dev/null || pidof TrickyStoreOSS >/dev/null 2>&1; then
    echo 'An unowned TrickyStoreOSS process is running. Reboot with only ForeverStrong enabled.' > "$HE_STATE_DIR/tricky.error"
    exit 1
fi
backoff=2
while he_engine_enabled; do
    ./daemon "$HE_ENGINE_DIR" &
    child=$!
    he_record_pid "$HE_STATE_DIR/tricky-worker.pid" "$child" || true
    wait "$child"
    rc=$?
    rm -f "$HE_STATE_DIR/tricky-worker.pid"
    echo "Bundled OSS exited with code $rc; retry in $backoff seconds" > "$HE_STATE_DIR/tricky.error"
    he_engine_enabled || break
    # Restart requests do not accumulate the failure backoff.
    if [ -f "$HE_STATE_DIR/tricky.restart" ]; then
        rm -f "$HE_STATE_DIR/tricky.restart"; backoff=2
    fi
    sleep "$backoff"
    [ "$backoff" -ge 60 ] || backoff=$((backoff * 2))
    [ "$backoff" -le 60 ] || backoff=60
done
