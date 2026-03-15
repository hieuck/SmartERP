# Contributing to SmartERP

Thank you for your interest in contributing to SmartERP!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/smart-erp.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature`

## Development Workflow

### 1. Before Starting

- Read [CODE_QUALITY_STANDARDS.md](docs/CODE_QUALITY_STANDARDS.md)
- Read [TESTING_GUIDE.md](docs/TESTING_GUIDE.md)
- Check existing issues and PRs

### 2. Making Changes

- Write tests first (TDD)
- Follow code quality standards
- Run linting: `npm run lint`
- Run type checking: `npm run type-check`
- Run tests: `npm test`

### 3. Commit Messages

Follow conventional commits:

```
feat: add user authentication
fix: resolve login bug
docs: update API documentation
test: add unit tests for auth service
refactor: improve user service performance
```

### 4. Pull Request Process

- Ensure all tests pass
- Update documentation
- Request review from maintainers
- Address review feedback

## Code Quality Requirements

- Test coverage ≥80%
- No linting errors
- No type errors
- All tests passing
- Documentation updated

## Questions?

Open an issue or contact the maintainers.

---

**Read more:**
- [Code Quality Standards](docs/CODE_QUALITY_STANDARDS.md)
- [Testing Guide](docs/TESTING_GUIDE.md)
- [Architecture](docs/architecture/ARCHITECTURE.md)
