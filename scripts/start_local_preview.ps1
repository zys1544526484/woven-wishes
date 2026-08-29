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
$previewMutex = [System.Threading.Mutex]::new($false, "Local\WovenWishesPreview_3A89F1D4")
$previewMutexAcquired = $false

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
      -TimeoutSec 5 `
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
  $savedPid = Get-SavedPreviewPid
  return $null -ne $savedPid -and $savedPid -eq $ProcessId -and (Test-ProjectViteProcess $ProcessId)
}

function Get-SavedPreviewPid {
  if (-not (Test-Path -LiteralPath $serverPidFile -PathType Leaf)) {
    return $null
  }

  try {
    $pidText = Get-Content -LiteralPath $serverPidFile -Raw -ErrorAction Stop
  }
  catch {
    return $null
  }

  if ([string]::IsNullOrWhiteSpace($pidText)) {
    return $null
  }

  $savedPid = 0
  if (-not [int]::TryParse($pidText.Trim(), [ref]$savedPid) -or $savedPid -le 0) {
    return $null
  }

  return $savedPid
}

try {
  try {
    $previewMutexAcquired = $previewMutex.WaitOne([TimeSpan]::FromSeconds(75))
  }
  catch [System.Threading.AbandonedMutexException] {
    $previewMutexAcquired = $true
  }

  if (-not $previewMutexAcquired) {
    throw "Another preview launcher is still starting. Wait a moment and run the launcher again."
  }

$needsManagedServer = $true
$managedPid = $null
if (Test-PreviewPort) {
  $listenerPid = Get-PreviewListenerPid
  if ($null -ne $listenerPid -and (Test-ManagedPreview $listenerPid)) {
    $needsManagedServer = $false
    $managedPid = $listenerPid
  }
  elseif ($null -ne $listenerPid -and (Test-ProjectViteProcess $listenerPid)) {
    Stop-Process -Id $listenerPid -Force
    $stopDeadline = (Get-Date).AddSeconds(5)
    while ((Test-PreviewPort) -and (Get-Date) -lt $stopDeadline) {
      Start-Sleep -Milliseconds 100
    }
  }
  elseif (Test-WovenWishesReady) {
    throw "The preview is not managed by this launcher. Close the program on port 4173 and run the launcher again."
  }
  else {
    throw "Port 4173 is used by another program. Close that program and run the launcher again."
  }
}
else {
  $savedPid = Get-SavedPreviewPid
  if ($null -ne $savedPid -and (Test-ProjectViteProcess $savedPid)) {
    $needsManagedServer = $false
    $managedPid = $savedPid
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
  $managedPid = $serverProcess.Id
}

$ready = $false
$deadline = (Get-Date).AddSeconds(60)
$processCheckNotBefore = (Get-Date).AddSeconds(2)
$missingProcessChecks = 0
while ((Get-Date) -lt $deadline) {
  if ($null -ne $managedPid -and (Get-Date) -ge $processCheckNotBefore) {
    if (Test-ProjectViteProcess $managedPid) {
      $missingProcessChecks = 0
    }
    else {
      $missingProcessChecks += 1
      if ($missingProcessChecks -ge 3) {
        break
      }
    }
  }
  if ((Test-PreviewPort) -and (Test-WovenWishesReady)) {
    $ready = $true
    break
  }
  Start-Sleep -Milliseconds 300
}

if (-not $ready) {
  throw "The local preview did not become ready. See $serverErrorLog"
}

$refreshToken = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$previewUrl = "$previewOrigin/?refresh=$refreshToken"
if (-not $NoBrowser) {
  Start-Process -FilePath $previewUrl
}

Write-Host "Woven Wishes is open."
Write-Host "Stable local URL: $previewOrigin/"
Write-Host "The preview keeps running after this Codex task ends. Run the launcher again after a PC restart."
}
finally {
  if ($previewMutexAcquired) {
    $previewMutex.ReleaseMutex()
  }
  $previewMutex.Dispose()
}
