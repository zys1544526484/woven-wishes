param(
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$previewOrigin = "http://127.0.0.1:4173"
$previewStateDir = Join-Path $projectRoot ".local-preview"
$serverLog = Join-Path $previewStateDir "vite.log"
$serverErrorLog = Join-Path $previewStateDir "vite-error.log"
$serverPidFile = Join-Path $previewStateDir "server.pid"
$viteEntry = Join-Path $projectRoot "node_modules\vite\bin\vite.js"

function Test-PreviewPort {
  $client = $null
  try {
    $client = [System.Net.Sockets.TcpClient]::new()
    $connection = $client.ConnectAsync("127.0.0.1", 4173)
    if (-not $connection.Wait(350)) {
      return $false
    }
    return $client.Connected
  }
  catch {
    return $false
  }
  finally {
    if ($null -ne $client) {
      $client.Dispose()
    }
  }
}

function Test-WovenWishesReady {
  try {
    $response = Invoke-WebRequest `
      -Uri "$previewOrigin/" `
      -UseBasicParsing `
      -TimeoutSec 1 `
      -Headers @{ "Cache-Control" = "no-cache" }

    return $response.StatusCode -eq 200 `
      -and $response.Content.Contains('<meta name="woven-wishes-app-id" content="woven-wishes-local-preview"')
  }
  catch {
    return $false
  }
}

function Get-PreviewListenerPid {
  $listener = Get-NetTCPConnection `
    -LocalAddress "127.0.0.1" `
    -LocalPort 4173 `
    -State Listen `
    -ErrorAction SilentlyContinue | Select-Object -First 1

  if ($null -eq $listener) {
    return $null
  }

  return [int]$listener.OwningProcess
}

function Test-ProjectViteProcess([int]$ProcessId) {
  $process = Get-CimInstance Win32_Process -Filter "ProcessId=$ProcessId" -ErrorAction SilentlyContinue
  if ($null -eq $process -or [string]::IsNullOrWhiteSpace($process.CommandLine)) {
    return $false
  }

  return $process.Name -eq "node.exe" -and $process.CommandLine.Contains($viteEntry)
}

function Test-ManagedPreview([int]$ProcessId) {
  if (-not (Test-Path -LiteralPath $serverPidFile -PathType Leaf)) {
    return $false
  }

  $savedPid = 0
  if (-not [int]::TryParse((Get-Content -LiteralPath $serverPidFile -Raw).Trim(), [ref]$savedPid)) {
    return $false
  }

  return $savedPid -eq $ProcessId -and (Test-ProjectViteProcess $ProcessId)
}

$needsManagedServer = $true
if (Test-PreviewPort) {
  if (-not (Test-WovenWishesReady)) {
    throw "Port 4173 is used by another program. Close that program and run the launcher again."
  }

  $listenerPid = Get-PreviewListenerPid
  if ($null -ne $listenerPid -and (Test-ManagedPreview $listenerPid)) {
    $needsManagedServer = $false
  }
  elseif ($null -ne $listenerPid -and (Test-ProjectViteProcess $listenerPid)) {
    Stop-Process -Id $listenerPid -Force
    $stopDeadline = (Get-Date).AddSeconds(5)
    while ((Test-PreviewPort) -and (Get-Date) -lt $stopDeadline) {
      Start-Sleep -Milliseconds 100
    }
  }
  else {
    throw "The preview is not managed by this launcher. Close the program on port 4173 and run the launcher again."
  }
}

if ($needsManagedServer) {
  $nodePath = (Get-Command node.exe -ErrorAction Stop).Source

  if (-not (Test-Path -LiteralPath $viteEntry -PathType Leaf)) {
    throw "Local dependencies are missing. Run npm ci in the project folder, then run the launcher again."
  }

  New-Item -ItemType Directory -Force -Path $previewStateDir | Out-Null

  $serverProcess = Start-Process `
    -FilePath $nodePath `
    -ArgumentList @($viteEntry, "--host", "127.0.0.1", "--port", "4173", "--strictPort") `
    -WorkingDirectory $projectRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $serverLog `
    -RedirectStandardError $serverErrorLog `
    -PassThru

  Set-Content -LiteralPath $serverPidFile -Value $serverProcess.Id -Encoding ascii

  $deadline = (Get-Date).AddSeconds(20)
  while (-not (Test-WovenWishesReady) -and (Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 250
  }

  if (-not (Test-WovenWishesReady)) {
    throw "The local preview did not start. See $serverErrorLog"
  }
}

$refreshToken = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$previewUrl = "$previewOrigin/?refresh=$refreshToken"
if (-not $NoBrowser) {
  Start-Process -FilePath $previewUrl
}

Write-Host "Woven Wishes is open."
Write-Host "Stable local URL: $previewOrigin/"
Write-Host "The preview keeps running after this Codex task ends. Run the launcher again after a PC restart."
