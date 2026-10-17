#!/system/bin/sh
. "${0%/*}/bin/root-compat.sh"
he_setup_runtime
# Shared settings and keys intentionally survive removal.
# Manager removes only its own module directory. Reboot unloads injected code.
echo 'ForeverStrong removed. Configuration retained in /data/adb/Box-Brain, /data/adb/tricky_store and /data/adb/halloweenedition.'
