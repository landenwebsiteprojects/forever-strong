#!/system/bin/sh
MODPATH="/data/adb/modules/halloweenedition"
. $MODPATH/common_func.sh

for proc in com.google.android.gms.unstable com.google.android.gms com.android.vending; do
  kill_process "$proc"
done

exit 0
