#!/system/bin/sh
# Shared manager selection. Explicit manager flags beat spoofed Magisk versions
# and leftover directories. HE_ROOT is only for isolated host fixtures.
he_detect_manager() {
    if [ "${APATCH:-}" = true ] || [ "${KERNELPATCH:-}" = true ]; then
        HE_ROOT_MANAGER=apatch
    elif [ "${KSU:-}" = true ]; then
        HE_ROOT_MANAGER=kernelsu
    elif [ "${HE_INSTALLING:-}" = true ]; then
        if [ -f "${HE_ROOT:-}/data/adb/magisk/util_functions.sh" ]; then
            HE_ROOT_MANAGER=magisk
        else HE_ROOT_MANAGER=unknown; fi
    else
        HE_ROOT_MANAGER=unknown
        if [ -r "${HE_ROOT:-}/data/adb/halloweenedition/root-manager" ]; then
            read -r HE_ROOT_MANAGER < "${HE_ROOT:-}/data/adb/halloweenedition/root-manager"
        fi
        case "$HE_ROOT_MANAGER" in magisk|kernelsu|apatch) ;; *) HE_ROOT_MANAGER=unknown;; esac
    fi
    export HE_ROOT_MANAGER
    [ "$HE_ROOT_MANAGER" != unknown ]
}
he_setup_runtime() {
    he_detect_manager || true
    case "$HE_ROOT_MANAGER" in
        magisk) HE_TOOL_DIR="${HE_ROOT:-}/data/adb/magisk";;
        kernelsu) HE_TOOL_DIR="${HE_ROOT:-}/data/adb/ksu/bin";;
        apatch) HE_TOOL_DIR="${HE_ROOT:-}/data/adb/ap/bin";;
        *) HE_TOOL_DIR=;;
    esac
    [ -z "$HE_TOOL_DIR" ] || PATH="$HE_TOOL_DIR:$PATH"
    export PATH
    IS_MAGISK=false
    [ "$HE_ROOT_MANAGER" != magisk ] || IS_MAGISK=true
    export IS_MAGISK
}
he_root_label() {
    case "$HE_ROOT_MANAGER" in
        magisk) printf 'Magisk/Kitsune';;
        kernelsu) printf 'KernelSU family';;
        apatch) printf 'APatch';;
        *) printf 'Unidentified manager';;
    esac
    printf '\n'
}
