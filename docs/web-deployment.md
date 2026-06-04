# CARBINE Web Deployment

CARBINE's outside-tester build should not require a command prompt, local FVS install, or local bridge.

## Required Architecture

1. GitHub Pages, Netlify, or another static host serves the CARBINE browser app.
2. A hosted CARBINE FVS API runs official FVS executables on a server.
3. The browser app is built with `VITE_CARBINE_FVS_API_URL` pointing at that API.

Static hosting by itself is not enough because native FVS executables cannot run inside GitHub Pages.

For the first Google Cloud deployment path, use a Windows Server VM on Google Compute Engine. See `docs/google-cloud-windows-api.md`.

## API Contract

The hosted API should match the local bridge contract:

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

## Hosted API Process

The current API process is:

```text
npm run fvs:api
```

For a hosted server, configure it with environment variables instead of asking testers to run anything:

```text
CARBINE_FVS_HOST=0.0.0.0
CARBINE_FVS_PORT=8787
FVS_BIN_DIR=/absolute/path/to/ForestVegetationSimulator-main/bin
CARBINE_ALLOWED_ORIGINS=https://your-carbine-web-address
```

On Windows hosting, `FVS_BIN_DIR` can point at the folder containing `fvsne.exe`, `fvsls.exe`, and the other compiled official variant executables.

## Frontend Configuration

Set the repository variable:

```text
VITE_CARBINE_FVS_API_URL=https://your-carbine-fvs-api.example.com
```

Then deploy the Pages workflow. The Run screen will default to Hosted FVS API.

## Local Bridge Status

The local bridge remains useful for CARBINE development and smoke testing. It is not the outside-tester product path.
