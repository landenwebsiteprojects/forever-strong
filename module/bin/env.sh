#!/system/bin/sh
# HE_ROOT is an isolated filesystem root used by the host test harness only.
HE_ROOT=${HE_ROOT:-}
HE_MODULE=${HE_MODULE:-/data/adb/modules/halloweenedition}
STATE="$HE_ROOT/data/adb/halloweenedition"
BOX="$HE_ROOT/data/adb/Box-Brain"
TS="$HE_ROOT/data/adb/tricky_store"
MOD="$HE_ROOT$HE_MODULE"
# Resolve property tools for boot, WebUI and repair shells consistently.
. "${0%/*}/root-compat.sh"
he_setup_runtime
umask 077
mkdir -p "$STATE" "$TS" "$BOX"
fail() { printf '%s\n' "$*" >&2; exit 1; }
lock() {
    if [ -f "$STATE/write.lock/pid" ]; then
        oldpid=$(cat "$STATE/write.lock/pid")
        case "$oldpid" in ''|*[!0-9]*) ;; *) if ! kill -0 "$oldpid" 2>/dev/null; then rm -f "$STATE/write.lock/pid"; rmdir "$STATE/write.lock" 2>/dev/null; fi;; esac
    fi
    mkdir "$STATE/write.lock" 2>/dev/null || fail 'Another configuration operation is running. Retry shortly.'
    echo $$ > "$STATE/write.lock/pid"
    trap 'rm -f "$STATE/write.lock/pid"; rmdir "$STATE/write.lock"' EXIT
    trap 'exit 1' HUP INT TERM
}
config_path() {
    case "$1" in
        targets) printf '%s' "$TS/target.txt";;
        patch) printf '%s' "$TS/security_patch.txt";;
        keybox) printf '%s' "$TS/keybox.xml";;
        fingerprint) printf '%s' "$MOD/custom.pif.prop";;
        apps) printf '%s' "$MOD/apps.txt";;
        hash) printf '%s' "$BOX/hash.txt";;
        blacklist) printf '%s' "$BOX/blacklist.txt";;
        *) fail 'Unsupported configuration name';;
    esac
}
validate() {
    name=$1; file=$2
    [ "$(wc -c < "$file")" -le 1048576 ] || fail 'Configuration exceeds 1 MiB'
    case "$name" in
      targets|apps|blacklist)
        awk '
        /^[[:space:]]*(#|$)/ {next}
        {line=$0; sub(/\r$/, "",line); if (line !~ /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)+[!?]?$/) exit 1;
        sub(/[!?]$/, "",line); if(seen[line]++) exit 1}' "$file" || fail 'Invalid or duplicate package. Use one package per line, with optional ! or ? suffix.';;
      patch)
        awk '
        /^[[:space:]]*(#|$)/ {next}
        /^\[[A-Za-z_][A-Za-z0-9_.]*\]$/ {next}
        {s=$0; sub(/\r$/, "",s); if(index(s,"=")) {count=split(s,a,"="); if(a[1]!~/^(all|system|vendor|boot)$/ || count!=2) exit 1; s=a[2]}
         if(s~/^(no|device_default|prop)$/) next;
         gsub(/YYYY/,"2026",s);gsub(/MM/,"10",s);gsub(/DD/,"16",s);gsub(/-/,"",s);
         if(s!~/^[0-9]+$/ || (length(s)!=6 && length(s)!=8)) exit 1;
         y=substr(s,1,4)+0;m=substr(s,5,2)+0;d=(length(s)==8?substr(s,7,2)+0:1);
         if(y<1970 || m<1 || m>12 || d<1 || d>31) exit 1;
         if((m==4||m==6||m==9||m==11)&&d>30) exit 1;
         leap=(y%4==0&&(y%100!=0||y%400==0));if(m==2&&d>28+leap)exit 1}' "$file" || fail 'Invalid security patch configuration. Use documented keys, package sections, keywords or dates.';;
      hash)
        [ ! -s "$file" ] || { [ "$(tr -d '\r\n' < "$file" | wc -c)" -eq 64 ] && ! grep -q '[^0-9a-fA-F]' "$file"; } || fail 'Boot hash must be exactly 64 hexadecimal characters, or empty.';;
      fingerprint)
        awk '/^[[:space:]]*(#|$)/ {next} !/^[A-Za-z0-9_.-]+=/ {exit 1}' "$file" || fail 'Fingerprint entries must use property=value syntax.';;
      keybox)
        [ -f "$MOD/bin/validator.dex" ] || fail 'Keybox validator is missing'
        if [ -n "$HE_ROOT" ]; then
            java -cp "$HE_VALIDATOR_CLASSES" KeyboxValidator "$file" || fail 'Keybox validation failed'
        else
            CLASSPATH="$MOD/bin/validator.dex" /system/bin/app_process /system/bin KeyboxValidator "$file" || fail 'Keybox validation failed'
        fi;;
      *) fail 'Unsupported configuration';;
    esac
}
# Snapshot allowlist only. No traversal of logs or native persistence databases.
backup() {
    id=$(date '+%Y%m%d-%H%M%S')-$$
    dest="$STATE/backups/$id"
    mkdir -p "$dest/files" || fail 'Cannot create backup'
    for n in targets patch keybox fingerprint apps hash blacklist; do
        src=$(config_path "$n")
        if [ -f "$src" ] && [ ! -L "$src" ]; then cp -p "$src" "$dest/files/$n" || fail 'Backup failed'; else touch "$dest/files/$n.absent"; fi
    done
    [ ! -d "$BOX" ] || cp -a "$BOX" "$dest/box" || fail 'Flag backup failed'
    # Logs may contain sensitive upstream output: they are not included.
    rm -rf "$dest/box/Integrity-Box-Logs" "$dest/box/autorun.lockdir"
    touch "$dest/complete"
    chmod -R go-rwx "$dest"
    printf '%s\n' "$id"
}
