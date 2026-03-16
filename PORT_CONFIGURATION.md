# Port Configuration Guide

## Overview

This document explains the port configuration strategy for the Smart ERP system to avoid conflicts between development, production, and portable modes.

---

## Port Strategy

### Development Mode (Default)

**Frontend**: `5173` (Vite default)
**Backend**: `3000`
**Database**: `5432`
**Redis**: `6379`

```bash
# Start development mode
npm run dev

# Or with Docker
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

**Access**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api/docs

---

### Portable Mode (Separate Environment)

**Frontend**: `5175` (to avoid conflict with dev)
**Backend**: `3000`
**Database**: `5432`
**Redis**: `6379`

```bash
# Use .env.portable
cp .env.portable .env

# Start services
npm run dev
```

**Access**:
- Frontend: http://localhost:5175
- Backend API: http://localhost:3000

**Use case**: Run both dev and portable simultaneously for testing or comparison.

---

### Production Mode

**Frontend**: `80` (Nginx standard)
**Backend**: `3000`
**Database**: `5432`
**Redis**: `6379`

```bash
# Start production mode
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**Access**:
- Frontend: http://localhost (port 80)
- Backend API: http://localhost:3000

---

## Environment Variables

### `.env` (Development)

```env
NODE_ENV=development
FRONTEND_PORT=5173
VITE_PORT=5173
CORS_ORIGIN=http://localhost:5173
```

### `.env.portable` (Portable)

```env
NODE_ENV=development
FRONTEND_PORT=5175
VITE_PORT=5175
CORS_ORIGIN=http://localhost:5175
```

### `.env.production` (Production)

```env
NODE_ENV=production
FRONTEND_PORT=80
# CORS_ORIGIN should be your production domain
CORS_ORIGIN=https://app.plaster-erp.com
```

---

## Vite Configuration

The `vite.config.ts` now reads port from environment variables:

```typescript
server: {
  host: '0.0.0.0',
  port: parseInt(process.env.VITE_PORT || process.env.PORT || '5173'),
  // ...
}
```

**Priority**:
1. `VITE_PORT` environment variable
2. `PORT` environment variable
3. Default: `5173`

---

## Docker Compose Configuration

### Development (`docker-compose.dev.yml`)

```yaml
frontend:
  environment:
    VITE_PORT: ${VITE_PORT:-5173}
    PORT: ${VITE_PORT:-5173}
  ports:
    - '${FRONTEND_PORT:-5173}:${VITE_PORT:-5173}'
```

**Explanation**:
- Container internal port: `${VITE_PORT:-5173}` (default 5173)
- Host port: `${FRONTEND_PORT:-5173}` (default 5173)
- Can be overridden via `.env` file

### Production (`docker-compose.prod.yml`)

```yaml
frontend:
  ports:
    - '${FRONTEND_PORT:-80}:80'
```

**Explanation**:
- Container runs Nginx on port 80
- Host port: `${FRONTEND_PORT:-80}` (default 80)

---

## Troubleshooting

### Port Already in Use

**Error**: `Port 5173 already in use`

**Solution**:

```bash
# Find process using port 5173
lsof -i :5173  # macOS/Linux
netstat -ano | findstr :5173  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### CORS Errors

**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution**: Ensure `CORS_ORIGIN` in backend `.env` matches frontend URL:

```env
# Backend .env
CORS_ORIGIN=http://localhost:5173  # Must match frontend port
```

### Docker Port Conflicts

**Error**: `Bind for 0.0.0.0:5173 failed: port is already allocated`

**Solution**:

```bash
# Stop all containers
docker compose down

# Check if port is still in use
lsof -i :5173

# Start with different port
FRONTEND_PORT=5175 docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

---

## Best Practices

1. **Development**: Always use port `5173` (Vite default)
2. **Portable**: Use port `5175` to avoid conflicts
3. **Production**: Use port `80` (standard HTTP)
4. **CORS**: Always sync `CORS_ORIGIN` with frontend port
5. **Environment Variables**: Use `.env` files, never hardcode ports
6. **Docker**: Use environment variables for port mapping

---

## Quick Reference

| Mode | Frontend Port | Backend Port | CORS Origin |
|------|--------------|--------------|-------------|
| Development | 5173 | 3000 | http://localhost:5173 |
| Portable | 5175 | 3000 | http://localhost:5175 |
| Production | 80 | 3000 | https://app.plaster-erp.com |

---

## Summary

✅ **Fixed Issues**:
1. Port conflicts between 5173 and 5175 resolved
2. Vite config now reads from environment variables
3. Docker dev/prod modes clearly separated
4. CORS configuration synchronized
5. Documentation updated and consistent

✅ **Configuration Files Updated**:
- `.env` → 5173 (dev)
- `.env.portable` → 5175 (portable)
- `vite.config.ts` → reads from env
- `docker-compose.dev.yml` → uses env variables
- `README.md` → updated
- All scripts → updated

🎯 **Result**: No more port conflicts, clear separation between dev/prod/portable modes.
