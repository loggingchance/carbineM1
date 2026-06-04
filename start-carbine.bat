@echo off
setlocal

set "ROOT=%~dp0"
set "UI_URL=http://127.0.0.1:5174/"

if /I "%~1"=="--dry-run" (
  echo CARBINE root: %ROOT%
  echo Doctor command: cd /d "%ROOT%" ^&^& npm.cmd run doctor
  echo Bridge command: cd /d "%ROOT%" ^&^& npm.cmd run fvs:bridge
  echo UI command: cd /d "%ROOT%" ^&^& npm.cmd run dev:live -- --host 127.0.0.1 --port 5174 --force
  exit /b 0
)

if not exist "%ROOT%package.json" (
  echo CARBINE could not find package.json next to this launcher.
  echo Put start-carbine.bat in the CARBINE project folder and try again.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo CARBINE could not find npm.cmd. Install Node.js, then reopen this window and try again.
  pause
  exit /b 1
)

echo Starting CARBINE official FVS bridge and UI...
echo.
echo Leave the two new terminal windows open while testing.
echo The browser should open to %UI_URL%
echo.

start "CARBINE FVS Bridge" cmd /k ""cd /d "%ROOT%" && npm.cmd run fvs:bridge""
timeout /t 2 /nobreak >nul
start "CARBINE UI" cmd /k ""cd /d "%ROOT%" && npm.cmd run dev:live -- --host 127.0.0.1 --port 5174 --force""
timeout /t 4 /nobreak >nul
start "" "%UI_URL%"

echo CARBINE startup has been requested.
echo If the browser opens too quickly, wait for the UI terminal to say VITE ready, then refresh.
pause
