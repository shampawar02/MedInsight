@echo off
echo ===================================================
echo   Starting MedInsight AI Platform Services
echo ===================================================

echo [1/3] Launching AI Microservice (Port 8000)...
start "MedInsight AI Service (Port 8000)" cmd /k "cd /d "%~dp0ai-service" && venv\Scripts\python.exe run.py"

timeout /t 2 /nobreak >nul

echo [2/3] Launching Node Backend (Port 5000)...
start "MedInsight Backend (Port 5000)" cmd /k "cd /d "%~dp0backend" && node server.js"

timeout /t 2 /nobreak >nul

echo [3/3] Launching Frontend (Port 5173)...
start "MedInsight Frontend (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo All services launched!
echo Access the application at: http://localhost:5173
echo.
pause
