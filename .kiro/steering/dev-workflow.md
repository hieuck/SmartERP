---
inclusion: always
---

# Dev Workflow

## Before Writing Code
- Understand the requirement fully before starting
- Check if similar patterns already exist in the codebase
- Prefer editing existing files over creating new ones when appropriate

## Code Review Mindset
- Every change should be reviewable and explainable
- Avoid large, sweeping changes — prefer small, focused commits
- Leave the codebase cleaner than you found it

## Debugging
- Read error messages carefully before guessing
- Reproduce the issue in isolation when possible
- Check logs, not just the UI

## Dependencies
- Prefer well-maintained, widely-used libraries
- Avoid adding a dependency for something trivially implementable
- Pin versions in production environments

## Security
- Never hardcode secrets, tokens, or credentials
- Validate and sanitize all user inputs
- Use environment variables for configuration
