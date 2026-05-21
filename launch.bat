@echo off
title Silver Wolf VI Launcher
cd /d "%~dp0"

echo =============================================================
echo   SILVER WOLF VI - AUTOMATED LAUNCHER
echo =============================================================

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your system's PATH.
    echo Please install Node.js from https://nodejs.org/ and try again.
    pause
    exit /b 1
)

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Python is not found in your system's PATH.
    echo The local AI Assistant Bridge will not be available, but the
    echo frontend workspace and 3D globe will still run.
)

echo Starting launcher process...
node launch.js
pause
