Write-Host "Starting FastAPI Server..." -ForegroundColor Green
Write-Host ""
Write-Host "Make sure you have added your OPENAI_API_KEY to the .env file!" -ForegroundColor Yellow
Write-Host ""
Set-Location $PSScriptRoot
python -m uvicorn main:app --reload --port 8000 --host 0.0.0.0

