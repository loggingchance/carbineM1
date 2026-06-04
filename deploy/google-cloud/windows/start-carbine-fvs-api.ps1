param(
  [string]$RepoRoot,
  [int]$Port = 8787,
  [string]$HostName = "0.0.0.0",
  [string]$FvsBinDir,
  [string]$AllowedOrigins = "*"
)

$ErrorActionPreference = "Stop"

if (-not $RepoRoot) {
  $RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
}

if (-not $FvsBinDir) {
  $FvsBinDir = Join-Path $RepoRoot "fvs-src\ForestVegetationSimulator-main\bin"
}

$logDir = Join-Path $RepoRoot "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$env:CARBINE_FVS_HOST = $HostName
$env:CARBINE_FVS_PORT = [string]$Port
$env:FVS_BIN_DIR = $FvsBinDir
$env:CARBINE_ALLOWED_ORIGINS = $AllowedOrigins

Set-Location $RepoRoot

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logPath = Join-Path $logDir "carbine-fvs-api-$timestamp.log"

"Starting CARBINE FVS API" | Tee-Object -FilePath $logPath
"RepoRoot=$RepoRoot" | Tee-Object -FilePath $logPath -Append
"Host=$HostName" | Tee-Object -FilePath $logPath -Append
"Port=$Port" | Tee-Object -FilePath $logPath -Append
"FVS_BIN_DIR=$FvsBinDir" | Tee-Object -FilePath $logPath -Append
"AllowedOrigins=$AllowedOrigins" | Tee-Object -FilePath $logPath -Append

node scripts/local-fvs-bridge.mjs *>> $logPath
