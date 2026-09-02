# CARBINE Web Deployment

CARBINE's outside-tester build should use Local FVS through the CARBINE FVS Connector.

## Required Architecture

1. GitHub Pages, Netlify, or another static host serves the CARBINE browser app.
2. A local Carbine FVS Connector runs official FVS executables on the user's computer.

Static hosting by itself is not enough because native FVS executables cannot run inside GitHub Pages. The browser needs the user's localhost connector.

For the first Google Cloud deployment path, use a Windows Server VM on Google Compute Engine. See `docs/google-cloud-windows-api.md`.

The earlier public hosted FVS API path has been disabled in the app to avoid owner-paid public compute.

## API Contract

The local connector contract is:

```text
GET /health
POST /run
```

`GET /health` returns whether official FVS is available and which variants are installed.

`POST /run` receives:

```json
{
  "variant": "NE",
  "scenarioId": "baseline",
  "keywordFile": "FVS keyword text",
  "treeFile": "FVS tree data text"
}
```

It returns the FVS exit status plus raw output files, including `input.out` and `input.sum` when available.

## Local Connector Process

The connector process is:

```text
npm run fvs:api
```

For local connector development, configure it with:

```text
CARBINE_FVS_HOST=127.0.0.1
CARBINE_FVS_PORT=8787
FVS_BIN_DIR=/absolute/path/to/ForestVegetationSimulator-main/bin
```

On Windows hosting, `FVS_BIN_DIR` can point at the folder containing `fvsne.exe`, `fvsls.exe`, and the other compiled official variant executables.

## Local Bridge Status

The local bridge is now the Carbine FVS Connector product path. It remains useful for development and smoke testing too.
