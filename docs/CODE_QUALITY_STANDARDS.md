# Code Quality Standards

**Version:** 1.0  
**Last Updated:** 2026-03-15  
**Owner:** Engineering Team

---

## Purpose

Ensure code is professional, production-ready, and follows best practices for maintainability, testability, and performance across backend (NestJS), frontend (React), and mobile (React Native).

---

## Core Principles

### 1. Professional Code

- ✅ Clean, clear, maintainable code
- ✅ Follow language/framework best practices
- ✅ Full documentation (JSDoc, README)
- ✅ Test coverage ≥80%
- ❌ No temporary code, hacks, workarounds
- ❌ No console.log, debugger in production
- ❌ No magic numbers, hardcoded values
- ❌ No TODO comments without GitHub issue

### 2. Complete Refactoring

- ✅ Refactor entire component/module when needed
- ✅ Don't refactor partially
- ✅ Ensure consistency across codebase
- ❌ Don't create new files to "fix" old ones
- ❌ Don't mix old and new code
- ❌ Don't skip related components

### 3. No Shortcuts

- ✅ Complete work fully
- ✅ Report clearly if unable to complete
- ❌ No placeholder components
- ❌ No TODO comments without action
- ❌ No temporary solutions

---

## Naming Conventions

### Files

**Backend (NestJS):**
- Controllers: `*.controller.ts` (e.g., `user.controller.ts`)
- Services: `*.service.ts` (e.g., `user.service.ts`)
- Entities: `*.entity.ts` (e.g., `user.entity.ts`)
- DTOs: `*.dto.ts` (e.g., `create-user.dto.ts`)
- Modules: `*.module.ts` (e.g., `user.module.ts`)
- Tests: `*.spec.ts` (e.g., `user.service.spec.ts`)

**Frontend (React):**
- Components: `PascalCase.tsx` (e.g., `UserList.tsx`)
- Pages: `PascalCase.tsx` (e.g., `Dashboard.tsx`)
- Hooks: `use*.ts` (e.g., `useAuth.ts`)
- Services: `*.service.ts` (e.g., `api.service.ts`)
- Utils: `camelCase.ts` (e.g., `formatDate.ts`)
- Tests: `*.test.tsx` (e.g., `UserList.test.tsx`)

**Mobile (React Native):**
- Screens: `*Screen.tsx` (e.g., `HomeScreen.tsx`)
- Components: `PascalCase.tsx` (e.g., `Button.tsx`)
- Services: `*.service.ts` (e.g., `auth.service.ts`)
- Tests: `*.test.tsx` (e.g., `Button.test.tsx`)

### Variables & Functions

**JavaScript/TypeScript:**
```typescript
// Variables: camelCase
const userName = 'John';
const isActive = true;
const userList = [];

// Functions: camelCase, verb prefix
function getUserData() {}
function handleSubmit() {}
function validateEmail() {}

// Classes: PascalCase
class UserService {}
class AuthController {}

// Interfaces: PascalCase with 'I' prefix (optional)
interface IUser {}
interface UserData {}

// Types: PascalCase
type UserRole = 'admin' | 'user';

// Enums: PascalCase
enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_COUNT = 3;
```

---

## Code Style

### TypeScript

**Use strict typing:**
```typescript
// ❌ WRONG: any type
function processData(data: any) {
  return data.value;
}

// ✅ CORRECT: specific type
interface DataInput {
  value: string;
}

function processData(data: DataInput): string {
  return data.value;
}
```

**Use type inference when obvious:**
```typescript
// ✅ CORRECT: type inference
const count = 5; // TypeScript infers number
const name = 'John'; // TypeScript infers string

// ✅ CORRECT: explicit when not obvious
const users: User[] = await fetchUsers();
```

**Avoid non-null assertions:**
```typescript
// ❌ WRONG: non-null assertion
const user = users.find(u => u.id === id)!;

// ✅ CORRECT: handle null case
const user = users.find(u => u.id === id);
if (!user) {
  throw new Error('User not found');
}
```

### React/React Native

**Functional components with hooks:**
```typescript
// ✅ CORRECT: functional component
interface UserListProps {
  users: User[];
  onSelect: (user: User) => void;
}

export const UserList: React.FC<UserListProps> = ({ users, onSelect }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleClick = (user: User) => {
    setSelectedId(user.id);
    onSelect(user);
  };

  return (
    <div>
      {users.map(user => (
        <UserCard
          key={user.id}
          user={user}
          selected={user.id === selectedId}
          onClick={() => handleClick(user)}
        />
      ))}
    </div>
  );
};
```

**Custom hooks for reusable logic:**
```typescript
// ✅ CORRECT: custom hook
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return { user, loading };
};
```

### NestJS

**Dependency injection:**
```typescript
// ✅ CORRECT: dependency injection
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly cacheService: CacheService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(UserService.name);
  }

  async findById(id: string): Promise<User> {
    const cacheKey = `user:${id}`;
    const cached = await this.cacheService.get<User>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.cacheService.set(cacheKey, user, 3600);
    return user;
  }
}
```

---

## Error Handling

### Backend (NestJS)

**Use built-in exceptions:**
```typescript
// ✅ CORRECT: NestJS exceptions
import { NotFoundException, BadRequestException } from '@nestjs/common';

async findUser(id: string): Promise<User> {
  const user = await this.userRepository.findOne({ where: { id } });
  
  if (!user) {
    throw new NotFoundException(`User with ID ${id} not found`);
  }
  
  return user;
}

async createUser(dto: CreateUserDto): Promise<User> {
  if (!dto.email) {
    throw new BadRequestException('Email is required');
  }
  
  // Create user logic
}
```

**Global exception filter:**
```typescript
// Already implemented in src/backend/src/common/filters/http-exception.filter.ts
// Use it in main.ts:
app.useGlobalFilters(new HttpExceptionFilter());
```

### Frontend (React)

**Error boundaries:**
```typescript
// Already implemented in src/frontend/src/components/error/ErrorBoundary.tsx
// Wrap app with ErrorBoundary in main.tsx
```

**Try-catch in async functions:**
```typescript
// ✅ CORRECT: error handling
const handleSubmit = async (data: FormData) => {
  try {
    setLoading(true);
    await api.createUser(data);
    message.success('User created successfully');
    navigate('/users');
  } catch (error) {
    if (error instanceof ApiError) {
      message.error(error.message);
    } else {
      message.error('An unexpected error occurred');
    }
  } finally {
    setLoading(false);
  }
};
```

---

## Performance Best Practices

### Backend

**Database queries:**
```typescript
// ❌ WRONG: N+1 query problem
const users = await this.userRepository.find();
for (const user of users) {
  user.orders = await this.orderRepository.find({ where: { userId: user.id } });
}

// ✅ CORRECT: use relations
const users = await this.userRepository.find({
  relations: ['orders'],
});
```

**Caching:**
```typescript
// ✅ CORRECT: cache expensive operations
async getStatistics(): Promise<Statistics> {
  const cacheKey = 'statistics:daily';
  const cached = await this.cacheService.get<Statistics>(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const stats = await this.calculateStatistics();
  await this.cacheService.set(cacheKey, stats, 3600); // 1 hour
  
  return stats;
}
```

### Frontend

**Memoization:**
```typescript
// ✅ CORRECT: useMemo for expensive calculations
const sortedUsers = useMemo(() => {
  return users.sort((a, b) => a.name.localeCompare(b.name));
}, [users]);

// ✅ CORRECT: useCallback for event handlers
const handleClick = useCallback((id: string) => {
  onSelect(id);
}, [onSelect]);
```

**Code splitting:**
```typescript
// ✅ CORRECT: lazy loading
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserList = lazy(() => import('./pages/users/UserList'));

// In routes:
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/users" element={<UserList />} />
  </Routes>
</Suspense>
```

---

## Security Best Practices

### Never Hardcode Secrets

```typescript
// ❌ WRONG: hardcoded secrets
const API_KEY = 'sk_live_1234567890';
const DB_PASSWORD = 'mypassword123';

// ✅ CORRECT: environment variables
const API_KEY = process.env.API_KEY;
const DB_PASSWORD = process.env.DB_PASSWORD;
```

### Input Validation

```typescript
// ✅ CORRECT: use class-validator (NestJS)
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

// ✅ CORRECT: use zod (Frontend)
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

### Sanitize User Input

```typescript
// ✅ CORRECT: sanitize HTML (Frontend)
import DOMPurify from 'dompurify';

const sanitizedHtml = DOMPurify.sanitize(userInput);
```

---

## Testing Standards

### Unit Tests

**Backend (Jest):**
```typescript
describe('UserService', () => {
  let service: UserService;
  let repository: MockType<Repository<User>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useFactory: repositoryMockFactory,
        },
      ],
    }).compile();

    service = module.get(UserService);
    repository = module.get(getRepositoryToken(User));
  });

  it('should find user by id', async () => {
    const user = { id: '1', email: 'test@example.com' };
    repository.findOne.mockResolvedValue(user);

    const result = await service.findById('1');

    expect(result).toEqual(user);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
  });
});
```

**Frontend (Vitest + React Testing Library):**
```typescript
describe('UserList', () => {
  it('renders users', () => {
    const users = [
      { id: '1', name: 'John' },
      { id: '2', name: 'Jane' },
    ];

    render(<UserList users={users} onSelect={jest.fn()} />);

    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });

  it('calls onSelect when user clicked', () => {
    const onSelect = jest.fn();
    const users = [{ id: '1', name: 'John' }];

    render(<UserList users={users} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('John'));

    expect(onSelect).toHaveBeenCalledWith(users[0]);
  });
});
```

### Coverage Requirements

- **Minimum:** 80% (branches, functions, lines, statements)
- **Services:** 90%+ coverage
- **Utilities:** 95%+ coverage
- **Controllers:** 70%+ coverage (integration tests preferred)

---

## Documentation Standards

### JSDoc Comments

```typescript
/**
 * Retrieves a user by their unique identifier
 * 
 * @param id - The unique identifier of the user
 * @returns Promise resolving to the user object
 * @throws {NotFoundException} When user is not found
 * 
 * @example
 * ```typescript
 * const user = await userService.findById('123');
 * console.log(user.email);
 * ```
 */
async findById(id: string): Promise<User> {
  // Implementation
}
```

### README Files

Every module/feature should have a README:

```markdown
# User Management Module

## Overview
Handles user authentication, authorization, and profile management.

## Features
- User registration
- Email verification
- Password reset
- Profile updates

## API Endpoints
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Testing
\`\`\`bash
npm test src/core/user
\`\`\`

## Dependencies
- TypeORM
- Passport.js
- bcrypt
```

---

## Pre-Commit Checklist

### Code Quality

- [ ] No console.log, debugger statements
- [ ] No magic numbers (use named constants)
- [ ] No hardcoded secrets
- [ ] No TODO comments without GitHub issue
- [ ] No dead code or unused imports
- [ ] Follows naming conventions
- [ ] JSDoc comments for public functions

### Architecture

- [ ] Single responsibility principle
- [ ] No circular dependencies
- [ ] Proper separation of concerns
- [ ] No business logic in controllers
- [ ] Services use dependency injection

### Testing

- [ ] Unit tests for new code
- [ ] All tests pass
- [ ] Coverage ≥80%
- [ ] No skipped/disabled tests

### Performance

- [ ] No N+1 queries
- [ ] Expensive operations cached
- [ ] Large lists paginated
- [ ] Images optimized

### Security

- [ ] Input validation
- [ ] Output sanitization
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities

---

## Common Mistakes

### ❌ WRONG

```typescript
// Magic numbers
if (user.age > 18) {}

// No error handling
const data = await api.fetchData();

// Any type
function process(data: any) {}

// console.log in production
console.log('User data:', user);

// Hardcoded values
const API_URL = 'http://localhost:3000';

// No tests
// (no test file exists)
```

### ✅ CORRECT

```typescript
// Named constants
const ADULT_AGE = 18;
if (user.age > ADULT_AGE) {}

// Error handling
try {
  const data = await api.fetchData();
} catch (error) {
  logger.error('Failed to fetch data', error);
  throw new Error('Data fetch failed');
}

// Specific types
interface DataInput {
  value: string;
}
function process(data: DataInput): string {}

// Logger instead of console.log
logger.info('User data loaded', { userId: user.id });

// Environment variables
const API_URL = process.env.VITE_API_URL;

// Tests exist
// user.service.spec.ts with 90%+ coverage
```

---

## Tools & Automation

### Linting

**ESLint configured:**
- Backend: `src/backend/.eslintrc.js`
- Frontend: `src/frontend/.eslintrc.js`

**Run linting:**
```bash
npm run lint
npm run lint -- --fix  # Auto-fix
```

### Type Checking

```bash
npm run type-check
```

### Testing

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

### Pre-commit Hooks

**Husky configured** (`.husky/pre-commit`):
- Runs linting
- Runs type checking
- Runs tests
- Checks for debug code

---

## References

- [NestJS Best Practices](https://docs.nestjs.com/)
- [React Best Practices](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Clean Code](https://www.oreilly.com/library/view/clean-code-a/9780136083238/)
- [Testing Guide](./TESTING_GUIDE.md)

---

**Last Updated:** 2026-03-15  
**Maintained By:** Engineering Team
