# CARBINE

Because forest carbon insights need exploring.

CARBINE is a browser-based forest carbon scenario explorer designed around the USDA Forest Service Forest Vegetation Simulator (FVS). The public testing build sends runs to a hosted API that executes compiled official FVS variants.

- Public app: https://carbine.forestenterprise.org
- Hosted FVS API health: https://carbine-api.forestenterprise.org/health

## Commands

```bash
npm install
npm run dev
npm test
npm run build
npm run preview
```

On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`:

```bash
npm.cmd run dev:live -- --host 127.0.0.1 --port 5174 --force
```

For developer-only local official-FVS testing on Windows, start both local services from the project folder:

```bat
npm.cmd run doctor
```

```bat
start-carbine.bat
```

With the bridge running, verify the official smoke path:

```bat
npm.cmd run smoke:official
```

These local commands are for development only. Public testers do not need a command prompt, local FVS installation, or bridge.

## Official FVS Source Path

CARBINE uses compiled official USDA Forest Service FVS source through the hosted API, not a substitute carbon model.

This environment could not fetch GitHub from the shell, so place the official source here manually:

```cmd
fvs-src\ForestVegetationSimulator
```

or download the official source ZIP:

```text
https://github.com/USDAForestService/ForestVegetationSimulator/archive/refs/heads/main.zip
```

Save it as:

```cmd
fvs-src\official-fvs-main.zip
```

Then extract it:

```cmd
powershell -NoProfile -Command "Expand-Archive -LiteralPath fvs-src\official-fvs-main.zip -DestinationPath fvs-src -Force"
npm.cmd run fvs:source:status
```

Once the official source is present, inspect the full official variant list:

```cmd
npm.cmd run fvs:variants
```

Compile the official variant set with:

```cmd
set PATH=C:\msys64\ucrt64\bin;%PATH%
npm.cmd run fvs:build:all
```

`fvs:build:ne` remains only as a narrow troubleshooting command. The public testing UI can request any compiled official variant reported by the hosted API. Users must still review species codes, FVS forest/location code, and site index for the selected regional variant.

## Runtime Position

FVS remains the authoritative calculation engine. The included `FvsMockAdapter` is for interface development only and must not be represented as real FVS output. The public testing path uses the hosted official-FVS API and parses official FVS `FMIN` / `CARBREPT` output configured for US short tons of carbon per acre. See `docs/user-guide.md` for tester workflow and `docs/fvs-build-notes.md` for the runtime feasibility record.

## Web Deployment

The app is built as static assets suitable for GitHub Pages. Static hosting cannot execute native FVS binaries, so a tester-ready deployment must also provide a hosted CARBINE FVS API with the same `/health` and `/run` contract as the local bridge.

The deployed GitHub repository uses this build variable:

```text
VITE_CARBINE_FVS_API_URL=https://carbine-api.forestenterprise.org
```

When that value is present at build time, the Run screen defaults to Hosted FVS API and testers do not need a command prompt, local FVS install, or bridge.

For the first Google Cloud backend path, see `docs/google-cloud-windows-api.md`.
