# Test Monitoring Guide

**Date:** March 10, 2026  
**Status:** ✅ COMPLETE  
**Purpose:** Guide for monitoring and managing test execution in Smart-ERP

---

## 📋 Overview

This guide explains how to monitor test execution, track coverage, and manage test results in Smart-ERP.

---

## 🧪 Running Tests

### Backend Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

### Frontend Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

---

## 📊 Coverage Targets

### Backend

- **Overall:** 80%+
- **Services:** 90%+
- **Controllers:** 85%+
- **Repositories:** 80%+
- **Utilities:** 75%+

### Frontend

- **Overall:** 80%+
- **Components:** 85%+
- **Pages:** 80%+
- **Hooks:** 90%+
- **Services:** 85%+

---

## 🔍 Monitoring Test Results

### View Coverage Report

```bash
# Backend coverage
npm run test:cov

# Frontend coverage
npm run test:cov

# Open coverage report in browser
open coverage/index.html
```

### Check Test Status

```bash
# View test results
npm test -- --verbose

# Show test summary
npm test -- --summary

# List all tests
npm test -- --listTests
```

---

## 🚨 Handling Test Failures

### Identify Failures

```bash
# Run tests with detailed output
npm test -- --verbose

# Show failed tests only
npm test -- --testNamePattern="FAIL"

# Show test stack traces
npm test -- --verbose --no-coverage
```

### Debug Failing Tests

```bash
# Run single test
npm test -- src/domains/product/product.service.spec.ts

# Run test with debugging
node --inspect-brk node_modules/.bin/jest --runInBand

# Run test with console output
npm test -- --verbose --no-coverage
```

---

## 📈 Test Metrics

### Key Metrics to Track

- **Pass Rate:** % of tests passing
- **Coverage:** % of code covered by tests
- **Execution Time:** Total time to run all tests
- **Flaky Tests:** Tests that fail intermittently
- **Test Count:** Total number of tests

---

## 📋 Test Checklist

Before committing code:

- [ ] All tests passing (`npm test`)
- [ ] Coverage above target (`npm run test:cov`)
- [ ] No console errors/warnings
- [ ] No flaky tests
- [ ] E2E tests passing (`npm run test:e2e`)
- [ ] Linter passing (`npm run lint`)
- [ ] Build successful (`npm run build`)

---

**Last Updated:** March 10, 2026  
**Status:** ✅ COMPLETE
