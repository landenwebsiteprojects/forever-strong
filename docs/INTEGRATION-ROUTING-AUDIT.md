# Integration routing audit — r2

The original v44 RepairMode script was probed in an isolated browser with a mocked shell. Its decoded sequence checked standalone `playintegrityfix/action.sh`, `tricky_store/service.sh` and `teesim/service.sh`, plus each module's disable/remove files. With the standalone Tricky Store branch selected, it reset `/data/adb/tricky_store/key_db`, ran Integrity Box action, then sourced the standalone Tricky Store service. These checks do not recognize a bundled engine. Original obfuscated source is preserved verbatim in upstream/integrity-box-v44-archive.

## New authoritative paths

| Role | Path |
|---|---|
| Module owner | /data/adb/modules/halloweenedition |
| Bundled OSS DEX, injector and library | /data/adb/modules/halloweenedition/tricky |
| Shared native configuration | /data/adb/tricky_store |
| Native OSS application key persistence | /data/adb/tricky_store/keys |
| Shell descriptor | bin/integration.sh |
| WebUI descriptor | webroot/integration.js |
| Service lifecycle | bin/engine-control.sh and bin/tricky-supervisor.sh |

Repair now invokes the unified backend: validate bundled payload and owner state; save a private config snapshot; archive only old legacy caches; run Integrity Box action; restart the owned OSS daemon under the one supervisor. It preserves `/keys` rather than treating native app keys as disposable caches. Process presence is reported separately from verified interception.

BootConfiguration, the main dashboard, the alternate target/blacklist page, keybox destination availability, PIF patch generation, common action cache handling and boot service startup now use the descriptor. Optional external TeeSim JSON and KeyMint TOML synchronization is gated by an enabled external module; stale data folders no longer satisfy those checks or take precedence over bundled OSS. These are incompatible formats and are not falsely redirected into OSS files.

Configuration files keep their native OSS paths and formats. The alternate scope editor preserves `?` and `!` modes when saving unrelated app selections. The external TeeSim switch on that page becomes a bundled-engine status refresh; the optional external sync flag remains accessible in Flags.

Native payloads are unchanged from r1. Original deletion code remains preserved in the upstream source snapshot. The installer-r1 manifest fix is retained.
