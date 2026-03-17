# Smart ERP - Project-Specific Rules

## Tech Stack

### Backend
- Framework: NestJS 10
- Language: TypeScript 5
- Database: PostgreSQL 15 + TypeORM 0.3
- Cache: Redis 7
- API: REST + Swagger/OpenAPI

### Frontend
- Framework: React 18
- Language: TypeScript 5
- Build: Vite 5
- UI: Ant Design 5
- State: Redux Toolkit
- Offline: Dexie.js (IndexedDB)

## Architecture Patterns

### Offline-First Architecture
- All data operations go through IndexedDB first
- Background sync when online
- Conflict resolution strategy: last-write-wins with timestamp
- Service Worker handles background sync

### Backend Structure
```
src/backend/
  ├── modules/          # Feature modules (accounting, inventory, sales, etc.)
  ├── shared/           # Shared utilities, guards, interceptors
  ├── config/           # Configuration files
  └── database/         # Migrations, seeds
```

### Frontend Structure
```
src/frontend/
  ├── components/       # Reusable UI components
  ├── pages/            # Page components
  ├── store/            # Redux store slices
  ├── services/         # API services
  ├── db/               # IndexedDB (Dexie) setup
  └── workers/          # Service workers
```

## Coding Standards

### NestJS Backend
- Use dependency injection for all services
- DTOs for all request/response validation
- Guards for authentication/authorization
- Interceptors for logging and transformation
- Exception filters for error handling
- Swagger decorators on all endpoints

### React Frontend
- Functional components with hooks only
- Redux Toolkit for state management
- Ant Design components (no custom CSS unless necessary)
- TypeScript strict mode enabled
- Offline-first: IndexedDB → API pattern

### Database
- TypeORM entities with decorators
- Migrations for all schema changes (never modify entities directly in production)
- Indexes on foreign keys and frequently queried fields
- Soft deletes (deletedAt) instead of hard deletes

## Testing Requirements

### Backend Tests
- Unit tests: Services, utilities
- Integration tests: Controllers, database operations
- E2E tests: Critical API flows
- Minimum coverage: 80%

### Frontend Tests
- Unit tests: Components, utilities
- Integration tests: Redux slices, API services
- E2E tests: Playwright for critical user flows
- Minimum coverage: 80%

### E2E Testing (Playwright)
- Test offline-first functionality
- Test sync conflicts
- Test critical business flows (order creation, payment, inventory)

## Security Requirements

### Backend
- Helmet.js for security headers
- CORS properly configured
- Rate limiting on all endpoints
- JWT authentication
- Role-based authorization
- Input validation with class-validator
- SQL injection prevention (TypeORM parameterized queries)

### Frontend
- XSS prevention (React auto-escapes)
- CSRF tokens for state-changing operations
- Secure storage (IndexedDB for data, not secrets)
- HTTPS only in production

## Development Workflow

### Before Starting Feature
1. Use planner agent for complex features
2. Check existing patterns in codebase
3. Write tests first (TDD)

### During Development
1. Follow offline-first pattern if applicable
2. Add Swagger docs for new endpoints
3. Update TypeORM migrations if schema changes
4. Keep components small (<200 lines)

### After Development
1. Run code-reviewer agent
2. Run security-reviewer for sensitive code
3. Verify tests pass (80%+ coverage)
4. Update documentation if needed

### Before Commit
1. Run linter: `npm run lint`
2. Run tests: `npm test`
3. Check build: `npm run build`
4. Conventional commit format

## Offline-First Guidelines

### When to Make Entity Offline-First
- Frequently accessed data (products, customers)
- Data needed in field/mobile scenarios
- Data that changes frequently

### How to Implement
1. Add Dexie table definition
2. Create sync service
3. Add conflict resolution logic
4. Update UI to use IndexedDB first
5. Add background sync worker

### Current Offline Entities (17%)
- Products, Customers, Suppliers, Users
- Orders, Payments, Invoices, Warehouses
- Stock, Stock Receipts, Notifications, Attendance

## Performance Guidelines

### Backend
- Use Redis caching for frequently accessed data
- Pagination for all list endpoints (default: 10 items)
- Database indexes on foreign keys
- Lazy loading for relations

### Frontend
- Code splitting with React.lazy
- Virtualized lists for large datasets (Ant Design Table)
- Debounce search inputs
- Optimize re-renders with React.memo

## Error Handling

### Backend
- Use NestJS exception filters
- Return consistent error format:
  ```json
  {
    "statusCode": 400,
    "message": "Validation failed",
    "errors": ["field1: error message"]
  }
  ```

### Frontend
- Show user-friendly error messages (Ant Design notification)
- Log detailed errors to console (dev) or Sentry (prod)
- Handle offline errors gracefully

## Documentation

### Code Documentation
- JSDoc for complex functions
- README in each module folder
- Swagger docs for all API endpoints

### Project Documentation
- Architecture decisions in docs/architecture/
- Deployment guides in docs/deployment/
- User guides in docs/guides/

## Git Workflow

### Branch Strategy
- main: Production
- develop: Development
- feature/*: New features
- fix/*: Bug fixes

### Commit Format
- feat: New feature
- fix: Bug fix
- refactor: Code refactoring
- docs: Documentation
- test: Tests
- chore: Maintenance

### PR Requirements
- All tests pass
- Code reviewed by agent
- No security vulnerabilities
- Documentation updated

## MVP Priorities

**Current Phase:** Day 2-3 Manual Testing (75% complete)

**Focus Areas:**
1. Manual testing of existing features
2. Bug fixes from testing
3. Offline-first expansion (17% → 50%)
4. Production deployment preparation

**Post-MVP:**
1. Increase test coverage to 80%+
2. Fix dev dependency vulnerabilities
3. Expand offline-first to more entities
4. Performance optimization
