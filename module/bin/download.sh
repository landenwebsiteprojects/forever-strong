#!/system/bin/sh
# Shared HTTPS downloader. Never changes Android DNS or disables TLS verification.
# Each failed tool is followed by the next available tool, regardless of UI flags.
he_download_file() (
    he_out=$1; he_url=$2; he_referer=${3:-}
    case "$he_url" in https://*) ;; *) echo 'Download refused: HTTPS is required.' >&2; exit 2;; esac
    umask 077
    he_work=$(mktemp -d "${he_out}.download.XXXXXX") || exit 2
    trap 'rm -rf "$he_work"' EXIT
    trap 'exit 1' HUP INT TERM
    he_part="$he_work/payload"; he_err="$he_work/error"
    he_curl=$(command -v curl 2>/dev/null)
    he_wget=$(command -v wget 2>/dev/null)
    he_bb=''
    for he_candidate in "${HE_DOWNLOAD_BUSYBOX:-}" /data/adb/ksu/bin/busybox /data/adb/ap/bin/busybox /data/adb/magisk/busybox /system/bin/busybox; do
        [ -x "$he_candidate" ] && { he_bb=$he_candidate; break; }
    done
    he_dns=0; he_count=0
    he_accept() {
        [ -s "$he_part" ] || return 1
        mv -f "$he_part" "$he_out"
    }
    he_failed() {
        if grep -Eqi 'bad address|resolve host|name resolution|name or service not known|unable to resolve' "$he_err"; then he_dns=1; fi
        rm -f "$he_part"
        he_count=$((he_count + 1))
        echo "Download attempt $he_count failed; trying the next available method." >&2
    }
    # Absolute executable paths avoid Magisk ash's standalone applet preference.
    if [ -n "$he_curl" ]; then
        set -- --fail --silent --show-error --location --connect-timeout 5 --max-time 15 --proto '=https' --proto-redir '=https'
        [ -z "$he_referer" ] || set -- "$@" --referer "$he_referer"
        # Android's certificate store is not at curl's usual Linux path.
        for he_ca in /apex/com.android.conscrypt/cacerts /system/etc/security/cacerts; do
            [ ! -d "$he_ca" ] || { set -- "$@" --capath "$he_ca"; break; }
        done
        "$he_curl" "$@" --output "$he_part" "$he_url" 2>"$he_err" && he_accept && exit 0
        he_failed
    fi
    if [ -n "$he_wget" ]; then
        set -- -q -T 8 -t 1 -O "$he_part"
        [ -z "$he_referer" ] || set -- "$@" --header "Referer: $he_referer"
        "$he_wget" "$@" "$he_url" 2>"$he_err" && he_accept && exit 0
        he_failed
    fi
    if [ -n "$he_bb" ]; then
        set -- wget -q -T 8 -t 1 -O "$he_part"
        [ -z "$he_referer" ] || set -- "$@" --header "Referer: $he_referer"
        "$he_bb" "$@" "$he_url" 2>"$he_err" && he_accept && exit 0
        he_failed
    fi
    # Retry through Android's own networking implementation if present.
    if [ -x /system/bin/toybox ]; then
        set -- wget -O "$he_part" "$he_url"
        /system/bin/toybox timeout 12 /system/bin/toybox "$@" 2>"$he_err" && he_accept && exit 0
        he_failed
    fi
    # Query a resolver without altering global properties. Keep HTTPS hostnames and
    # certificate verification intact; also resolve the official redirect hosts.
    if [ "$he_dns" = 1 ] && [ -n "$he_curl" ] && [ -n "$he_bb" ]; then
        he_host=${he_url#https://}; he_host=${he_host%%/*}
        case "$he_host" in
          github.com|raw.githubusercontent.com)
            set -- --fail --silent --show-error --location --connect-timeout 5 --max-time 15 --proto '=https' --proto-redir '=https'
            [ -z "$he_referer" ] || set -- "$@" --referer "$he_referer"
            for he_ca in /apex/com.android.conscrypt/cacerts /system/etc/security/cacerts; do
                [ ! -d "$he_ca" ] || { set -- "$@" --capath "$he_ca"; break; }
            done
            for he_host in "$he_host" release-assets.githubusercontent.com objects.githubusercontent.com; do
                he_ip=$("$he_bb" timeout 4 "$he_bb" nslookup "$he_host" 1.1.1.1 2>/dev/null | awk '
                  /^Name:/ {answer=1}
                  answer && /^Address/ {for(i=2;i<=NF;i++) if($i ~ /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/) {print $i; exit}}')
                [ -z "$he_ip" ] || set -- "$@" --resolve "$he_host:443:$he_ip"
            done
            "$he_curl" "$@" --output "$he_part" "$he_url" 2>"$he_err" && he_accept && exit 0
            he_failed
            ;;
        esac
    fi
    if [ "$he_dns" = 1 ]; then
        echo 'Download failed: hostname/DNS resolution failed in the root shell. Check Private DNS, VPN/firewall rules and network access for the WebUI/root manager, or retry on another network. Existing configuration was retained.' >&2
    else
        echo 'HTTPS download failed with every available method (network, HTTP or TLS error). Existing configuration was retained.' >&2
    fi
    exit 3
)
