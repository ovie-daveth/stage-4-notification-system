#!/bin/bash

# Docker Start Script for Notification Services
# This script builds and starts all services

set -e

echo "🐳 Starting Notification Services with Docker Compose..."

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install Docker Compose."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Navigate to infra directory
cd "$(dirname "$0")"

# Build and start services
echo "📦 Building images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service status
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ Services started successfully!"
echo ""
echo "📝 Service URLs:"
echo "   - RabbitMQ Management: http://localhost:15672 (admin/admin123)"
echo "   - MongoDB: mongodb://localhost:27017"
echo "   - PostgreSQL: postgresql://localhost:5432"
echo "   - User Service: http://localhost:4001"
echo "   - Template Service: http://localhost:4003"
echo "   - Template Swagger: http://localhost:4003/docs"
echo "   - Email Service: http://localhost:4002"
echo "   - Email Swagger: http://localhost:4002/docs"
echo "   - Push Service: http://localhost:4004"
echo "   - Push Swagger: http://localhost:4004/docs"
echo ""
echo "📋 View logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"

