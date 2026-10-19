#!/system/bin/sh

MODPATH="/data/adb/modules/halloweenedition"
. "$MODPATH/common_func.sh"

F=/data/adb/ksu/cache/risk.json
T=$F.tmp
U=https://github.com/MeowDump/MeowDump/releases/download/v4/risk.json
B=$(P)

ksud module risk disable || true

[ -f "$F" ] && [ -x "$B" ] || exit 0
I=false
"$B" lsattr "$F" 2>/dev/null | grep -q i && I=true && "$B" chattr -i "$F" 2>/dev/null || true
rm -f "$T"
"$B" wget -q -O "$T" -- "$U" 2>/dev/null && [ -s "$T" ] || {
    rm -f "$T"
    $I && "$B" chattr +i "$F" 2>/dev/null
    exit 1
}
mv -f "$T" "$F" 2>/dev/null || {
    rm -f "$T"
    $I && "$B" chattr +i "$F" 2>/dev/null
    exit 1
}
$I && "$B" chattr +i "$F" 2>/dev/null

ksud module risk disable
exit 0
