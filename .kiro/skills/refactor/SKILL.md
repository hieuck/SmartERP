---
name: refactor
description: Improve code structure, readability, and maintainability without changing behavior. Use when asked to refactor, clean up, simplify, or restructure existing code.
---

## Refactoring workflow

1. Ensure tests exist before refactoring — if not, write them first
2. Make one change at a time
3. Run tests after each change to confirm behavior is preserved
4. Commit working states frequently

## When to refactor

- Function is doing more than one thing
- Logic is duplicated in 2+ places
- Names are unclear or misleading
- Nesting is deeper than 3 levels
- File exceeds ~300 lines

## Common patterns

- Extract function: pull logic into a named function
- Rename: improve clarity of variable/function/class names
- Flatten conditionals: use early returns to reduce nesting
- Remove duplication: extract shared logic to a utility
- Split file: separate concerns into distinct modules

## What to avoid

- Refactoring and adding features at the same time
- Changing observable behavior while refactoring
- Over-engineering simple code
