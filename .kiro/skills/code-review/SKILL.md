---
name: code-review
description: Review code for correctness, security vulnerabilities, maintainability, and test coverage. Use when reviewing a file, function, diff, or preparing code for a pull request.
---

## Review checklist

When reviewing code:

1. Check for security issues — injection risks, exposed secrets, missing input validation
2. Verify edge cases and error states are handled
3. Confirm new behavior has appropriate tests
4. Ensure names are clear and consistent
5. Check for unnecessary complexity or duplication

## Feedback format

Group feedback by severity:

**Issues (must fix)**
- Line X: description of problem and suggested fix

**Suggestions (worth considering)**
- Line X: description of improvement

**Looks good**
- What was done well

## Common issues to flag

- Hardcoded credentials or API keys
- Missing input validation or sanitization
- Unhandled promise rejections or exceptions
- Debug/console.log statements left in code
- Functions doing more than one thing
