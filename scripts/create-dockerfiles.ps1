# Script to create Dockerfiles for all backend services

$services = @(
    "auth-service",
    "tenant-service",
    "product-service",
    "inventory-service",
    "order-service",
    "customer-service",
    "supplier-service",
    "production-service",
    "audit-service",
    "hr-service",
    "notification-service",
    "payment-gateway-service",
    "report-service"
)

$dockerfileContent = @"
# Multi-stage build for NestJS service
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache curl && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
"@

foreach ($service in $services) {
    $servicePath = "backend/$service"
    $dockerfilePath = "$servicePath/Dockerfile"
    
    if (Test-Path $servicePath) {
        Write-Host "Creating Dockerfile for $service..." -ForegroundColor Green
        $dockerfileContent | Out-File -FilePath $dockerfilePath -Encoding UTF8
    } else {
        Write-Host "Service $service not found, skipping..." -ForegroundColor Yellow
    }
}

Write-Host "`nDockerfiles created successfully!" -ForegroundColor Cyan
