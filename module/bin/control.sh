#!/system/bin/sh
BASE=${0%/*}
. "$BASE/env.sh"
. "$BASE/integration.sh"
op=$1
shift || true
case "$op" in
  status)
    printf 'version=v1.1\n'
    printf 'device='; getprop ro.product.model 2>/dev/null || echo unknown
    printf 'android='; getprop ro.build.version.release 2>/dev/null || echo unknown
    printf 'abi='; getprop ro.product.cpu.abi 2>/dev/null || echo unknown
    printf 'selinux='; getenforce 2>/dev/null || echo unknown
    printf 'root='; he_root_label
    printf 'integrity='; if [ -e "$MOD/disable" ]; then echo disabled; elif [ -f "$STATE/boot.ready" ]; then echo 'boot hooks completed'; elif [ -f "$STATE/integrity-service.exit" ]; then echo 'hooks recorded; review diagnostics for skipped steps or errors'; else echo 'awaiting reboot or initialization'; fi
    printf 'zygisk='; if [ -e "$MOD/stop" ]; then echo paused; elif [ -d "$MOD/zygisk" ]; then echo 'installed; loader must be checked on device'; else echo 'scripts only'; fi
    printf 'tricky='; if ! he_engine_installed; then echo 'bundled payload incomplete'; elif ! he_engine_enabled; then echo 'unified module disabled'; elif he_worker_pid >/dev/null; then echo 'owned process present; interception unverified'; else echo 'bundled engine installed; process not running'; fi
    printf 'targets='; if [ -f "$TS/target.txt" ]; then awk '!/^[[:space:]]*(#|$)/ {n++} END{print n+0}' "$TS/target.txt"; else echo 0; fi
    printf 'keybox='; if [ -s "$TS/keybox.xml" ]; then echo present; else echo missing; fi
    printf 'tee='; if [ -f "$TS/tee_status" ]; then head -c 100 "$TS/tee_status"; echo; else echo 'not yet reported'; fi
    printf 'profile='; for f in advanced pixelify legacy wipe; do if [ -f "$BOX/$f" ]; then printf '%s ' "$f"; fi; done; echo
    ;;
  engine-status) he_engine_status;;
  engine-ensure|engine-restart)
    sh "$BASE/engine-control.sh" "${op#engine-}";;
  repair)
    he_engine_installed || fail 'Bundled Tricky Store OSS payload is incomplete. Reinstall ForeverStrong.'
    he_engine_enabled || fail 'ForeverStrong is disabled or marked for removal.'
    lock
    recovery=$(backup) || fail 'Cannot save pre-repair configuration'
    echo "Recovery snapshot: $recovery"
    he_reset_legacy_cache || fail 'Cannot archive legacy attestation caches'
    echo 'Running Integrity Box action with bundled OSS configuration'
    sh "$MOD/integrity-action.sh"
    action_rc=$?
    echo 'Refreshing the bundled Tricky Store OSS service'
    sh "$BASE/engine-control.sh" restart
    engine_rc=$?
    [ "$action_rc" -eq 0 ] || fail "Integrity Box action failed (exit $action_rc). OSS service refresh exit: $engine_rc. Review partial results."
    [ "$engine_rc" -eq 0 ] || fail 'Integrity Box action completed, but bundled OSS did not restart. Review Diagnostics.'
    echo 'Repair workflow completed. No integrity verdict was measured.';;
  read)
    [ "$1" != keybox ] || fail 'Private keys are never displayed. Use secure backup or import.'
    p=$(config_path "$1"); [ ! -L "$p" ] || fail 'Symlink configuration refused'
    [ ! -f "$p" ] || cat "$p";;
  write|validate)
    name=$1; encoded=$2
    p=$(config_path "$name")
    lock
    [ ! -L "$p" ] || fail 'Symlink configuration refused'
    temp="$p.he-tmp-$$"
    trap 'rm -f "$temp"; rm -f "$STATE/write.lock/pid"; rmdir "$STATE/write.lock"' EXIT
    printf '%s' "$encoded" | base64 -d > "$temp" || fail 'Invalid base64 input'
    validate "$name" "$temp"
    if [ "$op" = write ]; then
        backup >/dev/null || fail 'Pre-change backup failed'
        chmod 600 "$temp"; chown 0:0 "$temp" 2>/dev/null || true
        mv -f "$temp" "$p" || fail 'Atomic save failed'
        echo 'Saved. Tricky Store reloads its configuration through FileObserver. Restart affected apps if necessary.'
    else echo 'Configuration validation passed'; fi;;
  flags)
    for f in safemode autopilot halloween-auto-targets halloween-auto-patch; do [ -f "$BOX/$f" ] && echo "$f=1" || echo "$f=0"; done;;
  flag)
    case "$1" in safemode|halloween-auto-targets|halloween-auto-patch) ;; *) fail 'Unsupported flag';; esac
    lock; backup >/dev/null
    case "$2" in 1) touch "$BOX/$1";;0) rm -f "$BOX/$1";;*) fail 'Expected 0 or 1';;esac
    echo 'Setting saved. Reboot for boot-time changes.';;
  backup) lock; backup;;
  backups) [ ! -d "$STATE/backups" ] || for d in "$STATE"/backups/*; do [ ! -f "$d/complete" ] || basename "$d"; done;;
  restore)
    id=$1
    case "$id" in ''|*[!0-9-]*) fail 'Invalid backup ID';; esac
    d="$STATE/backups/$id"
    [ -f "$d/complete" ] || fail 'Backup not found or incomplete'
    lock
    # Validate all inputs before the first replacement, then keep a rollback snapshot.
    for n in targets patch keybox fingerprint apps hash blacklist; do [ ! -f "$d/files/$n" ] || validate "$n" "$d/files/$n"; done
    before=$(backup) || fail 'Cannot create rollback snapshot'
    restore_files() {
      from=$1
      for n in targets patch keybox fingerprint apps hash blacklist; do
        p=$(config_path "$n")
        [ ! -L "$p" ] || return 1
        if [ -f "$from/files/$n" ]; then cp "$from/files/$n" "$p.he-restore" && chmod 600 "$p.he-restore" && mv -f "$p.he-restore" "$p" || return 1
        elif [ -f "$from/files/$n.absent" ]; then rm -f "$p" || return 1; fi
      done
    }
    if ! restore_files "$d"; then restore_files "$STATE/backups/$before"; fail 'Restore failed. Rollback attempted; inspect configuration before reboot.'; fi
    # Restore the captured flag tree, preserving current diagnostic logs and live daemon locks.
    if [ -d "$d/box" ]; then
      stage="$STATE/box-restore-$$"
      cp -a "$d/box" "$stage" || fail 'Cannot stage flag restoration'
      for keep in Integrity-Box-Logs autorun.lockdir daemon_heartbeat .executing; do
        if [ -e "$BOX/$keep" ]; then cp -a "$BOX/$keep" "$stage/$keep" || fail 'Cannot preserve runtime state'; fi
      done
      mv "$BOX" "$STATE/box-before-restore-$$" || fail 'Cannot retain current flags'
      if ! mv "$stage" "$BOX"; then mv "$STATE/box-before-restore-$$" "$BOX"; fail 'Cannot restore flags; original tree retained'; fi
    fi
    echo 'Configuration restored. A rollback snapshot was saved. Reboot to restore boot behavior.';;
  diagnostics)
    # Deliberately avoid arbitrary logs, getprop dumps, key XML and key persistence databases.
    echo 'ForeverStrong v1.1 — sanitized diagnostics'
    sh "$BASE/control.sh" status
    for n in targets patch; do p=$(config_path "$n"); if [ -f "$p" ]; then (validate "$n" "$p") && echo "$n=valid" || echo "$n=invalid"; else echo "$n=missing"; fi; done
    echo 'No Play Integrity verdict was measured by this report.'
    ;;
  action)
    lock; backup >/dev/null
    sh "$MOD/integrity-action.sh";;
  *) fail 'Unknown operation';;
esac
