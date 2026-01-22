@echo off
echo Starting FastAPI Server...
echo.
echo Make sure you have added your OPENAI_API_KEY to the .env file!
echo.
cd /d %~dp0
python -m uvicorn main:app --reload --port 8000 --host 0.0.0.0
pause

