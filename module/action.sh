#!/system/bin/sh
MODPATH=${0%/*}
. "$MODPATH/bin/root-compat.sh"
he_setup_runtime
exec sh "$MODPATH/webroot/common_scripts/webui.sh"
