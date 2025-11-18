#!/usr/bin/env pwsh
# Script to run api-app and web-app concurrently

Write-Host "Starting all applications..." -ForegroundColor Green
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Function to check and install npm dependencies
function Install-NpmDependencies {
    param(
        [string]$Path,
        [string]$Name
    )
    
    if (!(Test-Path (Join-Path $Path "node_modules"))) {
        Write-Host "Installing dependencies for $Name..." -ForegroundColor Yellow
        Push-Location $Path
        npm install
        Pop-Location
        Write-Host "$Name dependencies installed!" -ForegroundColor Green
    } else {
        Write-Host "$Name dependencies already installed." -ForegroundColor Gray
    }
}

# Function to check Python dependencies
function Install-PythonDependencies {
    param(
        [string]$Path,
        [string]$Name
    )
    
    Write-Host "Checking Python dependencies for $Name..." -ForegroundColor Gray
    Push-Location $Path
    python -m pip install -r requirements.txt --quiet
    Pop-Location
    Write-Host "$Name dependencies checked!" -ForegroundColor Green
}

# Function to start a process in a new window
function Start-AppInNewWindow {
    param(
        [string]$Title,
        [string]$WorkingDirectory,
        [string]$Command,
        [string]$Arguments
    )
    
    Write-Host "Starting $Title..." -ForegroundColor Cyan
    Start-Process -FilePath $Command -ArgumentList $Arguments -WorkingDirectory $WorkingDirectory -WindowStyle Normal
}

# Check and install dependencies
Write-Host "Checking dependencies..." -ForegroundColor Yellow
Write-Host ""

$apiPath = Join-Path $scriptDir "api-app"
Install-PythonDependencies -Path $apiPath -Name "API App"

$webAppPath = Join-Path $scriptDir "web-app"
Install-NpmDependencies -Path $webAppPath -Name "Web App"

Write-Host ""
Write-Host "All dependencies ready!" -ForegroundColor Green
Write-Host ""

# Start API App (Python FastAPI)
Start-AppInNewWindow -Title "API App" -WorkingDirectory $apiPath -Command "pwsh" -Arguments "-NoExit", "-Command", "python main.py"

# Wait a bit for the API to start
Start-Sleep -Seconds 2

# Start Web App (Vite React)
Start-AppInNewWindow -Title "Web App" -WorkingDirectory $webAppPath -Command "pwsh" -Arguments "-NoExit", "-Command", "npm run dev"

Write-Host ""
Write-Host "All applications started!" -ForegroundColor Green
Write-Host ""
Write-Host "Typical ports:" -ForegroundColor Yellow
Write-Host "  - API App: http://localhost:8000" -ForegroundColor White
Write-Host "  - Web App: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "To stop all applications, close the terminal windows." -ForegroundColor Yellow
