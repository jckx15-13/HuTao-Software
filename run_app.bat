@echo off
echo ==================================================
echo SILVER WOLF VI - TOTAL INITIALIZATION
echo ==================================================
echo.
echo Starting Assistant Bridge (Port 8001)...
start cmd /k "cd bridge && python server.py"
echo Starting Frontend Development Server (Port 3000)...
npm run dev
pause
