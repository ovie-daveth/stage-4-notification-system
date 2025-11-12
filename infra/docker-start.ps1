# Docker Start Script for Notification Services (PowerShell)
# This script builds and starts all services

$ErrorActionPreference = "Stop"

Write-Host "🐳 Starting Notification Services with Docker Compose..." -ForegroundColor Cyan

# Check if docker-compose is available
try {
    docker-compose --version | Out-Null
} catch {
    Write-Host "❌ docker-compose not found. Please install Docker Compose." -ForegroundColor Red
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Ensure we're in the infra directory (should be called from wrapper or infra directory)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check if docker-compose.yml exists in current directory
if (Test-Path (Join-Path $scriptPath "docker-compose.yml")) {
    # Already in infra directory
    Set-Location $scriptPath
} else {
    Write-Host "❌ Cannot find docker-compose.yml in: $scriptPath" -ForegroundColor Red
    Write-Host "   Please ensure you're running from the infra directory." -ForegroundColor Yellow
    exit 1
}

# Build and start services
Write-Host "📦 Building images..." -ForegroundColor Yellow
docker-compose build

Write-Host "🚀 Starting services..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service status
Write-Host "📊 Service Status:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "✅ Services started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Service URLs:" -ForegroundColor Cyan
Write-Host "   - RabbitMQ Management: http://localhost:15672 (admin/admin123)"
Write-Host "   - MongoDB: mongodb://localhost:27017"
Write-Host "   - PostgreSQL: postgresql://localhost:5432"
Write-Host "   - User Service: http://localhost:4001"
Write-Host "   - Template Service: http://localhost:4003"
Write-Host "   - Template Swagger: http://localhost:4003/docs"
Write-Host "   - Email Service: http://localhost:4002"
Write-Host "   - Email Swagger: http://localhost:4002/docs"
Write-Host "   - Push Service: http://localhost:4004"
Write-Host "   - Push Swagger: http://localhost:4004/docs"
Write-Host ""
Write-Host "📋 View logs: docker-compose logs -f"
Write-Host "🛑 Stop services: docker-compose down"

