param(
  [string]$RepoRoot,
  [int]$Port = 8787,
  [string]$AllowedOrigins = "*"
)

$ErrorActionPreference = "Stop"

if (-not $RepoRoot) {
  $RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
}

$startScript = Join-Path $RepoRoot "deploy\google-cloud\windows\start-carbine-fvs-api.ps1"
$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$startScript`" -RepoRoot `"$RepoRoot`" -Port $Port -AllowedOrigins `"$AllowedOrigins`""
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
  -TaskName "CARBINE FVS API" `
  -Action $action `
  -Trigger $trigger `
  -Principal $principal `
  -Settings $settings `
  -Description "Starts the CARBINE hosted FVS API at boot." `
  -Force | Out-Null

Write-Host "Installed scheduled task: CARBINE FVS API"
Write-Host "Start it now with:"
Write-Host 'Start-ScheduledTask -TaskName "CARBINE FVS API"'
