---
name: code-quality-standards
description: Code quality standards including ESLint rules, Prettier config, code review checklist, and best practices. Use when setting up linting, reviewing code, or establishing coding standards.
---

# Code Quality Standards

## 1. ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    'no-console': 'warn',
  },
};
```

## 2. Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

## 3. Code Review Checklist

### Security

- [ ] ✅ Uses SecureRepository
- [ ] ✅ Tenant isolation
- [ ] ✅ Permission checks
- [ ] ✅ Input validation

### Quality

- [ ] ✅ No code duplication
- [ ] ✅ Clear naming
- [ ] ✅ Proper error handling
- [ ] ✅ Tests included

### Performance

- [ ] ✅ No N+1 queries
- [ ] ✅ Caching where appropriate
- [ ] ✅ Pagination implemented

## 4. Naming Conventions

```typescript
// Classes: PascalCase
class ProductService {}

// Methods: camelCase
async findAllProducts() {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// Interfaces: PascalCase with I prefix
interface IProduct {}
```

## 5. Best Practices

- Keep functions small (< 50 lines)
- Single responsibility principle
- DRY (Don't Repeat Yourself)
- SOLID principles
- Write self-documenting code
