@echo off
echo ========================================================
echo Starting MedInsight AI Platform
echo ========================================================

echo 1. Starting Python AI Service on port 8000...
start "MedInsight AI Service (Port 8000)" cmd /k "cd /d %~dp0ai-service && .\venv\Scripts\activate && python run.py"

echo 2. Starting Node.js Backend on port 5000...
start "MedInsight Backend (Port 5000)" cmd /k "cd /d %~dp0backend && node server.js"

echo 3. Starting React Frontend on port 5173...
start "MedInsight Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo ========================================================
echo Services launched in separate windows!
echo Opening browser at http://localhost:5173...
echo ========================================================
timeout /t 4 /nobreak >nul
start http://localhost:5173
