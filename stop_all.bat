@echo off
echo Stopping any running MedInsight processes on ports 8000, 5000, and 5173...
powershell -Command "Get-NetTCPConnection -LocalPort 8000,5000,5173 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
echo All MedInsight services stopped.
pause
