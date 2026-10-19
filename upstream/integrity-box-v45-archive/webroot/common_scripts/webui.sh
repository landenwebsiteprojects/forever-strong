#!/system/bin/sh

if pm list packages | grep -q "io.github.a13e300.ksuwebui"; then
   am start -n "io.github.a13e300.ksuwebui/.WebUIActivity" -e id "playintegrityfix"
   exit 0
fi

if pm list packages | grep -q "com.dergoogler.mmrl.webuix"; then
   am start -n "com.dergoogler.mmrl.webuix/.ui.activity.webui.WebUIActivity" -e MOD_ID "playintegrityfix"
   exit 0
fi

am start -a android.intent.action.VIEW -d "https://github.com/5ec1cff/KsuWebUIStandalone/releases"
exit 0
