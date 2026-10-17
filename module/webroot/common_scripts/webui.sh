#!/system/bin/sh
if pm path io.github.a13e300.ksuwebui >/dev/null 2>&1; then
    exec am start -n io.github.a13e300.ksuwebui/.WebUIActivity -e id halloweenedition
elif pm path com.dergoogler.mmrl.webuix >/dev/null 2>&1; then
    exec am start -n com.dergoogler.mmrl.webuix/.ui.activity.webui.WebUIActivity -e MOD_ID halloweenedition
fi
echo 'A root WebUI host is required. Install KsuWebUIStandalone or WebUI X, then open ForeverStrong.'
exit 1
