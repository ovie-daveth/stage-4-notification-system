# Docker Start Script Wrapper (PowerShell)
# This script calls the infra/docker-start.ps1 script

$ErrorActionPreference = "Stop"

# Get the script directory (handle both direct execution and script sourcing)
if ($MyInvocation.MyCommand.Path) {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
} else {
    $scriptDir = Get-Location
}

$infraScript = Join-Path $scriptDir "infra" "docker-start.ps1"

# Check if infra script exists
if (-not (Test-Path $infraScript)) {
    Write-Host "❌ Cannot find infra/docker-start.ps1 at: $infraScript" -ForegroundColor Red
    Write-Host "   Current directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "   Please run this script from the project root." -ForegroundColor Yellow
    exit 1
}

# Change to infra directory and execute the script
Push-Location (Split-Path $infraScript -Parent)
try {
    & $infraScript
} finally {
    Pop-Location
}

