@echo off
echo Starting Silver Wolf Assistant Bridge...
echo Make sure you have the required packages installed:
echo pip install fastapi uvicorn transformers torch huggingface_hub accelerate
echo.
cd bridge
python server.py
pause
