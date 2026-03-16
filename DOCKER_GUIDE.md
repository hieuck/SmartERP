# Docker Guide - Smart ERP

Hướng dẫn sử dụng Docker cho dự án Smart ERP.

## 🚀 Quick Start

### Development
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```
- Backend: http://localhost:3000
- Frontend: http://localhost:5173
- Hot reload enabled

### Production
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```
- Backend: http://localhost:3000
- Frontend: http://localhost:80

### Testing
```bash
docker compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📋 Cấu trúc

```
docker-compose.yml       # Base (PostgreSQL + Redis)
docker-compose.dev.yml   # Development
docker-compose.prod.yml  # Production
docker-compose.test.yml  # Testing
```

## 🔧 Environment Variables

### Development (.env)
```bash
POSTGRES_DB=erp_production
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
JWT_SECRET=dev-secret-key
CORS_ORIGIN=http://localhost:5173
```

### Production (.env.production)
```bash
POSTGRES_PASSWORD=<strong-password>
JWT_SECRET=<strong-random-secret-min-32-chars>
CORS_ORIGIN=https://yourdomain.com
```

## 🛠️ Common Commands

### Build
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml build
docker compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache
```

### Logs
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f backend
```

### Shell
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend sh
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres psql -U postgres
```

### Database
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run migration:run
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run migration:create -- MigrationName
```

### Clean Up
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v  # Remove volumes
```

## 🐛 Troubleshooting

### Port already in use
```bash
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows
```

### Container won't start
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs backend
docker compose -f docker-compose.yml -f docker-compose.dev.yml build --no-cache backend
```

### Database connection failed
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps postgres
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec postgres pg_isready -U postgres
```

## 📚 Best Practices

- ✅ Non-root users
- ✅ Specific version tags
- ✅ Multi-stage builds
- ✅ Health checks
- ✅ Resource limits (production)
- ✅ Layer caching optimized
- ✅ .dockerignore configured

## 📖 References

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
