@echo off
chcp 65001 >nul
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start_local_preview.ps1"
if errorlevel 1 (
  echo.
  echo 启动失败。请把上面的错误文字截图发给 Codex。
  pause
)
