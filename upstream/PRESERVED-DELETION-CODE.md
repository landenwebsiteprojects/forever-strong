# Preserved upstream deletion code

The complete original Integrity Box v44 archive source, including customize.sh, uninstall.sh and webroot/common_scripts/cleanup.sh, is retained verbatim under integrity-box-v44-archive/.
The original Tricky Store installer is retained under trickystore-oss-v3.1.0/module/customize.sh.
These files contain their original deletion paths and logic. They are source references and are not invoked by the Halloween Edition installer.
The integrated installer uses scoped staging cleanup, shared-config preservation and exact-hash legacy hook quarantine. Runtime destructive controls retained from v44 are behind the unified command confirmation dialog.
Do not run a preserved upstream uninstaller to remove Halloween Edition: it can delete shared configs and other modules.
