# 🚀 SmartERP Development Setup Guide

**Version**: 1.0.0  
**Last Updated**: 2026-03-08  
**For**: Developers setting up local development environment

---

## 📋 Quick Start

### Windows Users

1. **Start development environment**:
   ```bash
   start-dev.bat
   ```

2. **Stop development environment**:
   ```bash
   stop-dev.bat
   ```

That's it! The scripts handle everything automatically.

---

## 🔧 Prerequisites

Before running the development environment, ensure you have:

### Required Software

1. **Docker Desktop** (v20.10+)
   - Download: https://www.docker.com/products/docker-desktop
   - Must be running before starting dev environment
   - Used for PostgreSQL and Redis services

2. **Node.js** (v18+)
   - Download: https://nodejs.org/
   - LTS version recommended
   - Includes npm package manager

3. **Git** (v2.30+)
   - Download: https://git-scm.com/
   - For version control

### Optional Software

- **VS Code** - Recommended IDE
- **Postman** - For API testing
- **pgAdmin** - For database management

---

## 🎯 What Gets Started

### Docker Services (via docker-compose.dev.yml)

1. **PostgreSQL Database**
   - Port: `5432`
   - Database: `smarterp_dev`
   - Username: `postgres`
   - Password: `postgres123`
   - Container: `smarterp-postgres-dev`

2. **Redis Cache**
   - Port: `6379`
   - Container: `smarterp-redis-dev`

### Backend Development Server

- **NestJS Application**
  - Port: `3000`
  - Hot reload enabled
  - API Documentation: http://localhost:3000/api/docs

---

## 📂 Project Structure

```
smart-erp/
├── config/
│   └── docker/
│       └── docker-compose.dev.yml    # Docker services configuration
├── src/
│   ├── backend/                      # NestJS backend application
│   ├── frontend/                     # React frontend (future)
│   └── mobile/                       # React Native mobile (future)
├── start-dev.bat                     # Start development environment
├── stop-dev.bat                      # Stop development environment
└── DEV-SETUP.md                      # This file
```

---

## 🔄 Development Workflow

### Daily Workflow

1. **Morning**: Start development environment
   ```bash
   start-dev.bat
   ```

2. **During Development**:
   - Backend auto-reloads on file changes
   - Check logs in terminal for errors
   - Access API docs at http://localhost:3000/api/docs

3. **Evening**: Stop development environment
   ```bash
   stop-dev.bat
   ```
   Or press `Ctrl+C` in terminal and choose to stop Docker

### Making Changes

1. **Backend Code**: Edit files in `src/backend/`
   - Server auto-reloads (hot reload)
   - Check terminal for compilation errors

2. **Database Changes**: Create migrations
   ```bash
   cd src/backend
   npm run migration:generate -- src/migrations/YourMigrationName
   npm run migration:run
   ```

3. **Running Tests**:
   ```bash
   cd src/backend
   npm run test              # Run all tests
   npm run test:watch        # Watch mode
   npm run test:cov          # With coverage
   ```

---

## 🌐 Access Points

### Development URLs

| Service | URL | Description |
|---------|-----|-------------|
| Backend API | http://localhost:3000 | Main API endpoint |
| API Documentation | http://localhost:3000/api/docs | Swagger UI |
| Health Check | http://localhost:3000/health | Server health status |

### Database Access

**Using psql (command line)**:
```bash
docker exec -it smarterp-postgres-dev psql -U postgres -d smarterp_dev
```

**Using pgAdmin**:
- Host: `localhost`
- Port: `5432`
- Database: `smarterp_dev`
- Username: `postgres`
- Password: `postgres123`

### Redis Access

**Using redis-cli**:
```bash
docker exec -it smarterp-redis-dev redis-cli
```

---

## 🔐 Environment Variables

### Backend (.env file location: src/backend/.env)

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres123
DATABASE_NAME=smarterp_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=1d

# Application
NODE_ENV=development
PORT=3000
```

**Important**: Never commit `.env` file to Git! It's in `.gitignore`.

---

## 🐛 Troubleshooting

### Docker Issues

**Problem**: "Docker is not running"
```
Solution:
1. Open Docker Desktop
2. Wait for it to fully start (whale icon in system tray)
3. Run start-dev.bat again
```

**Problem**: Port 5432 or 6379 already in use
```
Solution:
1. Stop other PostgreSQL/Redis instances
2. Or change ports in docker-compose.dev.yml
3. Update .env file with new ports
```

**Problem**: Docker containers won't start
```
Solution:
1. Check Docker Desktop logs
2. Try: docker-compose -f config/docker/docker-compose.dev.yml down
3. Try: docker system prune (removes unused containers)
4. Run start-dev.bat again
```

### Backend Issues

**Problem**: "Cannot find module" errors
```
Solution:
1. Delete node_modules folder
2. Delete package-lock.json
3. Run: npm install
4. Run start-dev.bat again
```

**Problem**: Database connection errors
```
Solution:
1. Check if PostgreSQL container is running: docker ps
2. Check .env file has correct credentials
3. Wait 10-15 seconds after starting Docker
4. Check logs: docker logs smarterp-postgres-dev
```

**Problem**: Port 3000 already in use
```
Solution:
1. Find process using port: netstat -ano | findstr :3000
2. Kill process: taskkill /PID <process-id> /F
3. Or change PORT in .env file
```

### Migration Issues

**Problem**: Migration fails to run
```
Solution:
1. Check database connection
2. Check migration file syntax
3. Try: npm run migration:revert (reverts last migration)
4. Fix migration and run again
```

---

## 📊 Monitoring & Logs

### View Docker Logs

**PostgreSQL logs**:
```bash
docker logs smarterp-postgres-dev
docker logs -f smarterp-postgres-dev  # Follow mode
```

**Redis logs**:
```bash
docker logs smarterp-redis-dev
docker logs -f smarterp-redis-dev  # Follow mode
```

### View Backend Logs

Logs appear in the terminal where you ran `start-dev.bat`.

**Log levels**:
- `[LOG]` - General information
- `[WARN]` - Warnings
- `[ERROR]` - Errors
- `[DEBUG]` - Debug information

---

## 🧪 Testing

### Run Tests

```bash
cd src/backend

# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run specific test file
npm run test -- hr.service.spec.ts
```

### Test Coverage

Current target: **80%+ coverage**

View coverage report:
```bash
npm run test:cov
# Open: coverage/lcov-report/index.html
```

---

## 🔄 Common Commands

### Docker Commands

```bash
# Start services
cd config/docker
docker-compose -f docker-compose.dev.yml up -d

# Stop services
docker-compose -f docker-compose.dev.yml down

# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# Remove all stopped containers
docker container prune

# View logs
docker logs <container-name>
```

### Backend Commands

```bash
cd src/backend

# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debugger

# Build
npm run build              # Build for production

# Testing
npm run test               # Run tests
npm run test:watch         # Watch mode
npm run test:cov           # With coverage
npm run test:e2e           # E2E tests

# Database
npm run migration:generate # Generate migration
npm run migration:run      # Run migrations
npm run migration:revert   # Revert last migration

# Linting
npm run lint               # Check code style
npm run format             # Format code
```

---

## 📚 Additional Resources

### Documentation

- [ROADMAP.md](./ROADMAP.md) - Development roadmap
- [CHANGELOG.md](./CHANGELOG.md) - Version history
- [API Documentation](http://localhost:3000/api/docs) - Swagger UI (when server running)

### Steering Files (Best Practices)

Located in `.kiro/steering/`:
- `project-standards.md` - Project conventions
- `nestjs-best-practices.md` - NestJS patterns
- `backend-testing-patterns.md` - Testing guidelines
- `database-patterns.md` - Database best practices

### External Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Docker Documentation](https://docs.docker.com/)

---

## 🎓 Tips for New Developers

1. **Read steering files first** - They contain project standards and best practices

2. **Follow the roadmap** - Check ROADMAP.md to see current phase and tasks

3. **Write tests first** - We follow TDD (Test-Driven Development)

4. **Use API docs** - Swagger UI at http://localhost:3000/api/docs is your friend

5. **Check logs** - When something breaks, logs usually tell you why

6. **Ask for help** - If stuck for >30 minutes, ask the team

7. **Commit often** - Small, focused commits are better than large ones

8. **Run tests before committing** - Ensure all tests pass

---

## 🚀 Next Steps

After setting up your development environment:

1. **Explore the codebase**:
   - Start with `src/backend/app.module.ts`
   - Check domain modules in `src/backend/domains/`

2. **Try the API**:
   - Open http://localhost:3000/api/docs
   - Test some endpoints

3. **Run tests**:
   - `cd src/backend && npm run test`
   - Check test coverage

4. **Read documentation**:
   - ROADMAP.md for current tasks
   - Steering files for best practices

5. **Start coding**:
   - Pick a task from ROADMAP.md
   - Write tests first
   - Implement feature
   - Verify tests pass

---

## 📞 Support

If you encounter issues not covered in this guide:

1. Check troubleshooting section above
2. Search existing GitHub issues
3. Ask in team chat
4. Create a new GitHub issue with:
   - Error message
   - Steps to reproduce
   - Your environment (OS, Node version, Docker version)

---

**Happy Coding! 🎉**

---

**Last Updated**: 2026-03-08  
**Maintained By**: SmartERP Development Team
