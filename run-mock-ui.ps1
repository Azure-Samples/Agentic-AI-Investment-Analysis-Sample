#!/usr/bin/env pwsh
# Script to run mock-ui only

Write-Host "Starting mock-ui..." -ForegroundColor Green
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

# Install mock-ui dependencies
$mockUiPath = Join-Path $scriptDir "mock-ui"
Install-NpmDependencies -Path $mockUiPath -Name "mock-ui"

Write-Host ""
Write-Host "Starting mock-ui on http://localhost:5173..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Run mock-ui
Push-Location $mockUiPath
npm run dev
Pop-Location
