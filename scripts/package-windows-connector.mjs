import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = join(repoRoot, "connector-packages");
const stageRoot = join(packageRoot, "carbine-fvs-connector-windows-x64");
const archivePath = join(packageRoot, "carbine-fvs-connector-windows-x64.zip");
const nodeExe = process.execPath;

if (process.platform !== "win32") {
  throw new Error("Windows connector packaging currently requires Windows so node.exe can be bundled.");
}

if (!existsSync(nodeExe)) {
  throw new Error(`Could not find the current Node runtime at ${nodeExe}.`);
}

await rm(stageRoot, { recursive: true, force: true });
await rm(archivePath, { force: true });
await mkdir(join(stageRoot, "runtime"), { recursive: true });
await mkdir(join(stageRoot, "app"), { recursive: true });

await copyFile(nodeExe, join(stageRoot, "runtime", "node.exe"));
await copyFile(join(repoRoot, "scripts", "local-fvs-bridge.mjs"), join(stageRoot, "app", "local-fvs-bridge.mjs"));

await writeFile(join(stageRoot, "START-CARBINE-FVS-CONNECTOR.cmd"), startConnectorCmd(), "utf8");
await writeFile(join(stageRoot, "OPEN-CARBINE.cmd"), openCarbineCmd(), "utf8");
await writeFile(join(stageRoot, "CHECK-CONNECTOR.cmd"), checkConnectorCmd(), "utf8");
await writeFile(join(stageRoot, "README.txt"), readmeText(), "utf8");

await compressArchive(stageRoot, archivePath);
console.log(`Created ${archivePath}`);

function startConnectorCmd() {
  return `@echo off
setlocal

set "ROOT=%~dp0"

if not exist "%ROOT%runtime\\node.exe" (
  echo CARBINE could not find the bundled Node runtime.
  echo Re-download the Carbine FVS Connector package and try again.
  echo.
  pause
  exit /b 1
)

if not exist "%ROOT%app\\local-fvs-bridge.mjs" (
  echo CARBINE could not find the connector application.
  echo Re-download the Carbine FVS Connector package and try again.
  echo.
  pause
  exit /b 1
)

if not "%~1"=="" (
  set "FVS_BIN_DIR=%~1"
)

if "%CARBINE_FVS_HOST%"=="" set "CARBINE_FVS_HOST=127.0.0.1"
if "%CARBINE_FVS_PORT%"=="" set "CARBINE_FVS_PORT=8787"

echo Starting the Carbine FVS Connector...
echo.
echo Connector address: http://%CARBINE_FVS_HOST%:%CARBINE_FVS_PORT%
if not "%FVS_BIN_DIR%"=="" echo FVS folder: %FVS_BIN_DIR%
echo.
echo Leave this window open while using Local FVS in CARBINE.
echo Close this window to stop the connector.
echo.

"%ROOT%runtime\\node.exe" "%ROOT%app\\local-fvs-bridge.mjs"

echo.
echo The Carbine FVS Connector stopped.
pause
`;
}

function openCarbineCmd() {
  return `@echo off
setlocal

set "ROOT=%~dp0"
set "CARBINE_URL=https://carbine.forestenterprise.org/"

start "Carbine FVS Connector" "%SystemRoot%\\System32\\cmd.exe" /k ""%ROOT%START-CARBINE-FVS-CONNECTOR.cmd" %*"
timeout /t 3 /nobreak >nul
start "" "%CARBINE_URL%"

echo CARBINE is opening in your browser.
echo Leave the connector window open while using Local FVS.
`;
}

function checkConnectorCmd() {
  return `@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $h = Invoke-RestMethod 'http://127.0.0.1:8787/health'; Write-Host 'Connector reachable.'; Write-Host ('Variants detected: ' + $h.variants.Count); if ($h.variants.Count -gt 0) { Write-Host ($h.variants -join ', ') } else { Write-Host 'No FVS variants detected yet.' } } catch { Write-Host 'Connector is not reachable at http://127.0.0.1:8787'; Write-Host $_.Exception.Message }; Read-Host 'Press Enter to close'"
`;
}

function readmeText() {
  return `CARBINE FVS CONNECTOR FOR WINDOWS

What this is
------------
This package lets CARBINE use FVS installed on this computer.
It starts a private local connector at:

  http://127.0.0.1:8787

It does not expose FVS to the internet.

Normal use
----------
1. Install USDA Forest Service FVS for Windows.
2. Double-click OPEN-CARBINE.cmd.
3. Leave the connector window open.
4. In CARBINE, choose Local FVS and click Test connection.

Connector only
--------------
Double-click START-CARBINE-FVS-CONNECTOR.cmd if CARBINE is already open.

If FVS is in an unusual folder
-----------------------------
Drag the FVS executable folder onto START-CARBINE-FVS-CONNECTOR.cmd, or run:

  START-CARBINE-FVS-CONNECTOR.cmd "C:\\Path\\To\\FVS\\bin"

Troubleshooting
---------------
Double-click CHECK-CONNECTOR.cmd to see whether the connector is reachable
and how many FVS variants it found.

The connector searches common FVS locations, including C:\\FVS,
C:\\Program Files\\FVS, and C:\\Users\\<you>\\FVS.
`;
}

function compressArchive(source, destination) {
  return new Promise((resolvePromise, reject) => {
    const command = [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      `Compress-Archive -Path '${source.replace(/'/g, "''")}\\*' -DestinationPath '${destination.replace(/'/g, "''")}' -Force`
    ];
    const child = spawn("powershell.exe", command, { stdio: "inherit", windowsHide: true });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`Compress-Archive exited with code ${code}.`));
    });
  });
}
