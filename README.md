# CARBINE

Because forest carbon insights need exploring.

CARBINE is a browser-based forest carbon scenario explorer designed around the USDA Forest Service Forest Vegetation Simulator (FVS). The public workflow is to run FVS on the user's own computer through the local Carbine FVS Connector.

- Public app: https://carbine.forestenterprise.org

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

For local official-FVS testing on Windows, install the official USDA FVS Complete Package, then start both local services from the project folder:

```bat
START-CARBINE-FVS-CONNECTOR.cmd
```

The packaged Windows connector also includes `INSTALL-CARBINE-FVS-CONNECTOR.cmd`, which installs the connector under `%LOCALAPPDATA%\CarbineFvsConnector` and adds Start Menu shortcuts.

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

For public users, CARBINE should present this as the Carbine FVS Connector rather than as a developer bridge. See `docs/local-fvs-connector.md`.

## Official FVS Source Path

CARBINE uses compiled official USDA Forest Service FVS executables, not a substitute carbon model. Public runs should reach those executables through the user's local connector.

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

`fvs:build:ne` remains only as a narrow troubleshooting command. The public testing UI can request any compiled official variant reported by the local connector. Users must still review species codes, FVS forest/location code, and site index for the selected regional variant.

## Runtime Position

FVS remains the authoritative calculation engine. The included `FvsMockAdapter` is for interface development only and must not be represented as real FVS output. The public path uses the user's local FVS connector and parses official FVS `FMIN` / `CARBREPT` output configured for US short tons of carbon per acre. See `docs/user-guide.md` for tester workflow and `docs/fvs-build-notes.md` for the runtime feasibility record.

## Web Deployment

The app is built as static assets suitable for GitHub Pages. Static hosting cannot execute native FVS binaries, so public users run FVS through the local CARBINE FVS Connector on their own computer.

For the first Google Cloud backend path, see `docs/google-cloud-windows-api.md`.
