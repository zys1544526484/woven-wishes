param(
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$previewOrigin = "http://127.0.0.1:4173"
$previewStateDir = Join-Path $projectRoot ".local-preview"
$serverErrorLog = Join-Path $previewStateDir "vite-error.log"
$serverPidFile = Join-Path $previewStateDir "server.pid"
$viteEntry = Join-Path $projectRoot "node_modules\vite\bin\vite.js"
$runnerScript = Join-Path $PSScriptRoot "run_local_preview_server.ps1"
$taskName = "WovenWishesLocalPreview"
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

function Ensure-PreviewScheduledTask {
  $requiredCommands = @(
    "Get-ScheduledTask",
    "Register-ScheduledTask",
    "New-ScheduledTaskAction",
    "New-ScheduledTaskTrigger",
    "New-ScheduledTaskSettingsSet",
    "New-ScheduledTaskPrincipal",
    "Start-ScheduledTask",
    "Stop-ScheduledTask"
  )

  foreach ($commandName in $requiredCommands) {
    if ($null -eq (Get-Command $commandName -ErrorAction SilentlyContinue)) {
      return $false
    }
  }

  $powerShellPath = (Get-Command powershell.exe -ErrorAction Stop).Source
  $runnerArguments = "-NoLogo -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$runnerScript`""
  $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
  $taskMatches = $null -ne $existingTask `
    -and $existingTask.Actions.Count -eq 1 `
    -and $existingTask.Actions[0].Execute -eq $powerShellPath `
    -and $existingTask.Actions[0].Arguments -eq $runnerArguments

  if ($taskMatches) {
    return $true
  }

  if ($null -ne $existingTask -and $existingTask.State -eq "Running") {
    Stop-ScheduledTask -TaskName $taskName
  }

  $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
  $action = New-ScheduledTaskAction `
    -Execute $powerShellPath `
    -Argument $runnerArguments `
    -WorkingDirectory $projectRoot
  $trigger = New-ScheduledTaskTrigger -AtLogOn -User $currentUser
  $settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)
  $principal = New-ScheduledTaskPrincipal `
    -UserId $currentUser `
    -LogonType Interactive `
    -RunLevel Limited

  Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "Keeps the Woven Wishes local review link available for every Codex window." `
    -Force | Out-Null

  return $true
}

function Stop-StaleProjectPreview {
  $savedPid = Get-SavedPreviewPid
  if ($null -eq $savedPid -or -not (Test-ProjectViteProcess $savedPid)) {
    return
  }

  Stop-Process -Id $savedPid -Force
  $stopDeadline = (Get-Date).AddSeconds(5)
  while ((Get-Process -Id $savedPid -ErrorAction SilentlyContinue) -and (Get-Date) -lt $stopDeadline) {
    Start-Sleep -Milliseconds 100
  }
}

function Start-FallbackPreview {
  $nodePath = (Get-Command node.exe -ErrorAction Stop).Source
  $serverLog = Join-Path $previewStateDir "vite.log"

  $serverProcess = Start-Process `
    -FilePath $nodePath `
    -ArgumentList @($viteEntry, "--host", "127.0.0.1", "--port", "4173", "--strictPort") `
    -WorkingDirectory $projectRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $serverLog `
    -RedirectStandardError $serverErrorLog `
    -PassThru

  Set-Content -LiteralPath $serverPidFile -Value $serverProcess.Id -Encoding ascii
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

  if (-not (Test-Path -LiteralPath $viteEntry -PathType Leaf)) {
    throw "Local dependencies are missing. Run npm ci in the project folder, then run the launcher again."
  }
  if (-not (Test-Path -LiteralPath $runnerScript -PathType Leaf)) {
    throw "The persistent preview runner is missing: $runnerScript"
  }

  New-Item -ItemType Directory -Force -Path $previewStateDir | Out-Null

  if (Test-PreviewPort) {
    $listenerPid = Get-PreviewListenerPid
    if (-not (Test-WovenWishesReady)) {
      throw "Port 4173 is used by another program. Close that program and run the launcher again."
    }
    if ($null -eq $listenerPid -or -not (Test-ProjectViteProcess $listenerPid)) {
      throw "The preview on port 4173 is not this project's Vite server. Close it and run the launcher again."
    }
  }
  else {
    Stop-StaleProjectPreview

    $scheduledTaskReady = $false
    try {
      $scheduledTaskReady = Ensure-PreviewScheduledTask
    }
    catch {
      Write-Warning "Windows could not register the persistent preview task. Falling back to this session only: $($_.Exception.Message)"
    }

    if ($scheduledTaskReady) {
      $task = Get-ScheduledTask -TaskName $taskName -ErrorAction Stop
      if ($task.State -eq "Running") {
        Stop-ScheduledTask -TaskName $taskName
        Start-Sleep -Milliseconds 500
      }
      Start-ScheduledTask -TaskName $taskName
    }
    else {
      Start-FallbackPreview
    }

    $ready = $false
    $deadline = (Get-Date).AddSeconds(60)
    while ((Get-Date) -lt $deadline) {
      if ((Test-PreviewPort) -and (Test-WovenWishesReady)) {
        $ready = $true
        break
      }
      Start-Sleep -Milliseconds 300
    }

    if (-not $ready) {
      throw "The local preview did not become ready. See $serverErrorLog"
    }
  }

  $refreshToken = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  $previewUrl = "$previewOrigin/?refresh=$refreshToken"
  if (-not $NoBrowser) {
    $browserPath = @(
      "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
      "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
      "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
      "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
      "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe"
    ) | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
    if ($browserPath) {
      # Only this exhibition profile permits autoplay; personal browser settings stay unchanged.
      $browserProfile = Join-Path $previewStateDir "exhibition-browser"
      Start-Process -FilePath $browserPath -ArgumentList @(
        "--user-data-dir=`"$browserProfile`"",
        "--autoplay-policy=no-user-gesture-required",
        "--no-first-run",
        "--no-default-browser-check",
        "--app=`"$previewUrl`""
      )
    }
    else {
      Write-Warning "Chrome/Edge not found. The default browser may require a first touch before music plays."
      Start-Process -FilePath $previewUrl
    }
  }

  Write-Host "Woven Wishes is open."
  Write-Host "Stable local URL: $previewOrigin/"
  Write-Host "Windows now keeps this preview available after Codex tasks and at the next sign-in."
}
finally {
  if ($previewMutexAcquired) {
    $previewMutex.ReleaseMutex()
  }
  $previewMutex.Dispose()
}
