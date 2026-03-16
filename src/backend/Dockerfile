# Multi-stage Dockerfile for NestJS Backend
# Follows Docker best practices: multi-stage build, specific versions, non-root user, security hardening

# Stage 1: Dependencies
FROM node:22.12-alpine3.20 AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci --production=false

# Stage 2: Build
FROM node:22.12-alpine3.20 AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build application
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# Stage 3: Production
FROM node:22.12-alpine3.20 AS production
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# Copy production dependencies
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/main.js"]

# Stage 4: Development (for docker-compose.dev.yml)
FROM node:22.12-alpine3.20 AS development
WORKDIR /app

# Install dumb-init
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Build application for production mode
RUN npm run build

# Create logs directory with proper permissions
RUN mkdir -p logs && chmod 777 logs

# Expose port
EXPOSE 3000

# Expose debug port
EXPOSE 9229

# Start in production mode (watch mode has issues in Docker)
CMD ["npm", "run", "start:prod"]
