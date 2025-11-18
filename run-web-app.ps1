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

    $nodeModulesPath = Join-Path $Path "node_modules"
    $lockFilePath = Join-Path $Path "package-lock.json"
    $manifestPath = Join-Path $Path "package.json"
    $hashFilePath = Join-Path $Path ".npm-deps.sha256"

    if (!(Test-Path $lockFilePath) -and !(Test-Path $manifestPath)) {
        Write-Host "Skipping dependency check for $Name (no package manifest)." -ForegroundColor Yellow
        return
    }

    $hashSource = if (Test-Path $lockFilePath) { $lockFilePath } else { $manifestPath }
    $currentHash = (Get-FileHash $hashSource -Algorithm SHA256).Hash

    $needsInstall = $false
    if (!(Test-Path $nodeModulesPath)) {
        $needsInstall = $true
    } elseif (!(Test-Path $hashFilePath)) {
        $needsInstall = $true
    } else {
        $previousHash = (Get-Content $hashFilePath -Raw).Trim()
        if ($previousHash -ne $currentHash) {
            $needsInstall = $true
        }
    }

    if ($needsInstall) {
        Write-Host "Installing dependencies for $Name..." -ForegroundColor Yellow
        Push-Location $Path
        npm install
        Pop-Location
        Set-Content -Path $hashFilePath -Value $currentHash
        Write-Host "$Name dependencies installed!" -ForegroundColor Green
    } else {
        Write-Host "$Name dependencies up to date." -ForegroundColor Gray
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
