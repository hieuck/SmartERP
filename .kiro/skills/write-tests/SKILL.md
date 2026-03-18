---
name: write-tests
description: Generate tests for existing code. Use when writing unit tests, integration tests, or when asked to add test coverage for a file or function.
---

## Test writing workflow

1. Read and understand the code under test
2. Identify all behaviors, edge cases, and error paths
3. Write tests using the AAA pattern (Arrange, Act, Assert)
4. Use descriptive names: `should <behavior> when <condition>`
5. Place test file as `<source>.test.<ext>` next to the source file

## What to cover

- Happy path — expected inputs produce expected outputs
- Edge cases — empty, null, zero, boundary values
- Error cases — invalid input, thrown exceptions, failed async calls

## What NOT to test

- Third-party library internals
- Trivial getters/setters with no logic
- Implementation details that may change

## Test structure

```
describe('<unit under test>', () => {
  it('should <expected behavior> when <condition>', () => {
    // Arrange
    // Act
    // Assert
  })
})
```

## Rules

- Mock external dependencies (network, DB, filesystem)
- Keep each test independent — no shared mutable state
- No magic values without explanation
