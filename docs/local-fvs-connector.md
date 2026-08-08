# Local FVS Connector

CARBINE can run FVS on the user's own computer through a small localhost connector. This is the preferred low-cost path for regular users. The hosted Carbine Cloud FVS API remains a fallback for users who cannot install or start FVS locally.

## User Workflow

1. Open CARBINE.
2. On Run, choose `Local FVS`.
3. Install USDA Forest Service FVS.
   - Windows: use the official Complete Package at https://www.fs.usda.gov/fvs/software/complete.php.
   - macOS: USDA provides source code rather than a simple official macOS installer. A packaged macOS connector should be treated as future distribution work until the build and redistribution path is verified.
4. Start the Carbine FVS Connector.
5. Click `Test connection`.
6. Run scenarios.

## Connector Contract

The browser calls:

```text
GET  http://127.0.0.1:8787/health
POST http://127.0.0.1:8787/run
```

The connector must send normal CORS headers and `Access-Control-Allow-Private-Network: true` so an HTTPS CARBINE page can request a user-approved local service in modern Chromium browsers.

## Auto Detection

The current Node connector checks these sources:

- `FVS_EXE` for one explicit variant executable.
- `FVS_BIN_DIR` or `CARBINE_FVS_DIR`.
- The CARBINE source build folder, `fvs-src/ForestVegetationSimulator-main/bin`.
- Common Windows paths such as `C:\FVS` and `C:\Program Files\FVS`.
- Common macOS build/install paths such as `/usr/local/bin`, `/opt/homebrew/bin`, and `/Applications/FVS`.

If detection fails, set `FVS_BIN_DIR` to the folder containing `FVSne.exe`, `FVSls.exe`, and the other variant executables, or set `FVS_EXE` to one executable for single-variant testing.

## Browser Security Notes

The connector binds to `127.0.0.1` by default. Do not expose it on a public network interface for normal desktop use. Browser local-network protections may ask the user for permission when a public HTTPS site calls localhost; that prompt is expected.
