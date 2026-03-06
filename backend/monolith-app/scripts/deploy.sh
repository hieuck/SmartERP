#!/bin/bash

# Plaster ERP Deployment Script
# Usage: ./scripts/deploy.sh [dev|prod]

set -e

ENV=${1:-dev}
COMPOSE_FILE="docker-compose.yml"

if [ "$ENV" = "prod" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    ENV_FILE=".env.prod"
else
    ENV_FILE=".env"
fi

echo "🚀 Deploying Plaster ERP ($ENV environment)..."

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE not found!"
    echo "Please create $ENV_FILE from .env.example"
    exit 1
fi

# Load environment variables
export $(cat $ENV_FILE | grep -v '^#' | xargs)

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    exit 1
fi

# Pull latest images
echo "📦 Pulling latest images..."
docker-compose -f $COMPOSE_FILE pull

# Build application
echo "🔨 Building application..."
docker-compose -f $COMPOSE_FILE build --no-cache app

# Stop old containers
echo "🛑 Stopping old containers..."
docker-compose -f $COMPOSE_FILE down

# Start new containers
echo "▶️  Starting new containers..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
echo "🏥 Checking health..."
for i in {1..30}; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Application is healthy!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Health check failed after 30 attempts"
        docker-compose -f $COMPOSE_FILE logs app
        exit 1
    fi
    echo "Attempt $i/30..."
    sleep 2
done

# Run migrations
echo "🗄️  Running database migrations..."
docker-compose -f $COMPOSE_FILE exec -T app npm run migration:run || true

# Show status
echo "📊 Container status:"
docker-compose -f $COMPOSE_FILE ps

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📝 Useful commands:"
echo "  View logs:    docker-compose -f $COMPOSE_FILE logs -f app"
echo "  Stop:         docker-compose -f $COMPOSE_FILE down"
echo "  Restart:      docker-compose -f $COMPOSE_FILE restart app"
echo "  Shell:        docker-compose -f $COMPOSE_FILE exec app sh"
echo ""
echo "🌐 Application URLs:"
echo "  API:          http://localhost:3000"
echo "  Health:       http://localhost:3000/api/health"
echo "  Swagger:      http://localhost:3000/api/docs"
