# Docker Quick Reference

**Quick commands for Smart-ERP Docker operations**

---

## 🚀 Start/Stop

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Restart services
docker-compose restart
```

---

## 📊 Status & Logs

```bash
# Check service status
docker-compose ps

# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100
```

---

## 🔨 Build & Rebuild

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend

# Build without cache
docker-compose build --no-cache

# Build and start
docker-compose up --build
```

---

## 🧪 Testing

```bash
# Run backend tests
docker-compose exec backend npm test

# Run backend tests with coverage
docker-compose exec backend npm run test:cov

# Run frontend tests
docker-compose exec frontend npm test

# Run e2e tests
docker-compose exec backend npm run test:e2e
```

---

## 🗄️ Database

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d erp_production

# Run migrations
docker-compose exec backend npm run migration:run

# Generate migration
docker-compose exec backend npm run migration:generate

# Seed test data
docker-compose exec backend npm run seed:test-users
```

---

## 🔍 Troubleshooting

```bash
# Check backend health
curl http://localhost:3000/health

# Check frontend health
curl http://localhost/health

# View backend logs
docker-compose logs backend

# Rebuild backend
docker-compose build --no-cache backend

# Restart backend
docker-compose restart backend
```

---

## 📁 Access Services

- **Frontend:** http://localhost
- **Backend API:** http://localhost:3000
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

---

**Last Updated:** March 10, 2026
