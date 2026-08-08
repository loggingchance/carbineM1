@echo off
setlocal

set "ROOT=%~dp0"

if not exist "%ROOT%scripts\local-fvs-bridge.mjs" (
  echo CARBINE could not find scripts\local-fvs-bridge.mjs next to this launcher.
  echo Put this launcher in the CARBINE project folder and try again.
  echo.
  pause
  exit /b 1
)

where node.exe >nul 2>nul
if errorlevel 1 (
  echo CARBINE could not find Node.js.
  echo Install Node.js for Windows, then reopen this launcher.
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

node.exe "%ROOT%scripts\local-fvs-bridge.mjs"

echo.
echo The Carbine FVS Connector stopped.
pause
