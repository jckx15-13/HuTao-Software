@echo off
echo Starting Silver Wolf Link...
echo.
echo [1/2] Checking dependencies...
python -c "import pyautogui" 2>NUL
if %errorlevel% neq 0 (
    echo PyAutoGUI not found. Installing...
    pip install pyautogui
)
echo.
echo [2/2] Launching Servers...
echo.
echo --- Launching Assistant Bridge (Hutao AI) on port 8000 ---
start /b python bridge/server.py
echo.
echo --- Launching App Connector (State Sync + Control) on port 8001 ---
start /b python bridge/connector.py
echo.
echo Servers are running in the background.
echo You can now use the Local Assistant and Agent Connector.
echo.
pause
