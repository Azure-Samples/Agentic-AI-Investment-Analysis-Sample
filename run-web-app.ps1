#!/usr/bin/env pwsh
# Script to run web-app only

Write-Host "Starting web-app..." -ForegroundColor Green
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

# Install web-app dependencies
$webAppPath = Join-Path $scriptDir "web-app"
Install-NpmDependencies -Path $webAppPath -Name "web-app"

Write-Host ""
Write-Host "Starting web-app on http://localhost:5174..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Run web-app
Push-Location $webAppPath
npm run dev
Pop-Location
