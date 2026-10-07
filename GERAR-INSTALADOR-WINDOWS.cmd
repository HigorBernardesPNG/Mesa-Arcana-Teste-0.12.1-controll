@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\gerar-instalador-windows.ps1"
if errorlevel 1 (
  echo.
  echo Falha ao gerar o instalador da Mesa Arcana.
  pause
  exit /b 1
)
echo.
echo Processo concluido.
pause
