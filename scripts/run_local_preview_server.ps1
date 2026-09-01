$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$previewStateDir = Join-Path $projectRoot ".local-preview"
$serverLog = Join-Path $previewStateDir "vite.log"
$serverErrorLog = Join-Path $previewStateDir "vite-error.log"
$serverPidFile = Join-Path $previewStateDir "server.pid"
$viteEntry = Join-Path $projectRoot "node_modules\vite\bin\vite.js"
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source

if (-not (Test-Path -LiteralPath $viteEntry -PathType Leaf)) {
  throw "Local dependencies are missing. Run npm ci in the project folder."
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

try {
  Wait-Process -Id $serverProcess.Id
}
finally {
  if (Test-Path -LiteralPath $serverPidFile -PathType Leaf) {
    $savedPidText = (Get-Content -LiteralPath $serverPidFile -Raw -ErrorAction SilentlyContinue).Trim()
    if ($savedPidText -eq [string]$serverProcess.Id) {
      Remove-Item -LiteralPath $serverPidFile -Force -ErrorAction SilentlyContinue
    }
  }
}
