---
name: 'git-best-practices'
displayName: 'Git Best Practices'
description: 'Comprehensive guide for Git workflows, commit conventions, branching strategies, and collaboration best practices for modern development teams'
keywords: ['git', 'version control', 'commit', 'branch', 'workflow', 'collaboration']
author: 'SmartERP Team'
---

# Git Best Practices

## Overview

This power provides comprehensive guidance on Git best practices for modern development teams. It covers commit conventions, branching strategies, code review workflows, and collaboration patterns that help maintain clean, traceable, and professional version control history.

Whether you're working solo or in a team, following these practices will improve code quality, make debugging easier, and streamline collaboration. The guide is based on industry-standard conventions including Conventional Commits, Git Flow, and trunk-based development patterns.

## Core Principles

### 1. Atomic Commits

Make small, focused commits that do one thing well. Each commit should represent a single logical change.

**Why it matters:**

- Easier to review and understand
- Simpler to revert if needed
- Better for git bisect debugging
- Clearer project history

### 2. Meaningful Commit Messages

Write clear, descriptive commit messages that explain the "why" behind changes, not just the "what".

**Why it matters:**

- Future developers (including you) understand the context
- Easier to generate changelogs
- Better for code archaeology
- Professional project history

### 3. Branch Hygiene

Keep branches short-lived, focused, and up-to-date with the main branch.

**Why it matters:**

- Reduces merge conflicts
- Faster integration cycles
- Easier code reviews
- Less technical debt

## Commit Message Convention

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type       | Description                     | Example                                   |
| ---------- | ------------------------------- | ----------------------------------------- |
| `feat`     | New feature                     | `feat(auth): add OAuth2 login`            |
| `fix`      | Bug fix                         | `fix(api): handle null user response`     |
| `docs`     | Documentation only              | `docs(readme): update installation steps` |
| `style`    | Code style changes (formatting) | `style(components): fix indentation`      |
| `refactor` | Code refactoring                | `refactor(utils): simplify date parsing`  |
| `perf`     | Performance improvements        | `perf(db): add index on user_id`          |
| `test`     | Adding or updating tests        | `test(auth): add login flow tests`        |
| `chore`    | Maintenance tasks               | `chore(deps): update dependencies`        |
| `ci`       | CI/CD changes                   | `ci(github): add automated tests`         |

### Examples

**Good commit messages:**

```
feat(orders): add bulk order export functionality

Implement CSV and Excel export for orders with filters.
Includes pagination support for large datasets.

Closes #234
```

```
fix(payment): prevent duplicate charge on retry

Add idempotency key to payment requests to prevent
charging customers multiple times when they retry
failed payments.

Fixes #456
```

**Bad commit messages:**

```
update stuff
fixed bug
WIP
asdfasdf
```

## Branching Strategies

### Git Flow (Recommended for Release-Based Projects)

```
main (production)
  ├── develop (integration)
  │   ├── feature/user-authentication
  │   ├── feature/payment-integration
  │   └── feature/dashboard-redesign
  ├── release/v1.2.0
  └── hotfix/critical-security-patch
```

**Branch types:**

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `release/*` - Release preparation
- `hotfix/*` - Critical production fixes

**Workflow:**

1. Create feature branch from `develop`
2. Work on feature with atomic commits
3. Create PR to merge into `develop`
4. When ready for release, create `release/*` branch
5. After testing, merge to `main` and tag version
6. Merge back to `develop`

### Trunk-Based Development (Recommended for Continuous Deployment)

```
main (always deployable)
  ├── feature/short-lived-feature-1
  └── feature/short-lived-feature-2
```

**Key principles:**

- All work happens in short-lived feature branches (< 2 days)
- Frequent merges to main (multiple times per day)
- Feature flags for incomplete features
- Main branch is always deployable

**Workflow:**

1. Create short-lived feature branch from `main`
2. Work with frequent commits
3. Create PR and merge quickly (same day)
4. Use feature flags for work-in-progress features
5. Deploy main frequently

## Branch Naming Conventions

### Format

```
<type>/<ticket-id>-<short-description>
```

### Examples

```
feature/AUTH-123-oauth2-login
fix/BUG-456-payment-retry-issue
refactor/TECH-789-simplify-user-service
docs/DOC-101-api-documentation
hotfix/CRIT-999-security-patch
```

### Rules

- Use lowercase with hyphens
- Include ticket/issue ID when available
- Keep description short but meaningful
- Use type prefix (feature, fix, refactor, etc.)

## Code Review Best Practices

### For Authors

**Before creating PR:**

- [ ] Self-review your changes
- [ ] Run tests locally
- [ ] Update documentation
- [ ] Write clear PR description
- [ ] Link related issues
- [ ] Keep PR small (< 400 lines if possible)

**PR Description Template:**

```markdown
## What

Brief description of changes

## Why

Reason for changes, problem being solved

## How

Technical approach taken

## Testing

How to test these changes

## Screenshots (if UI changes)

Before/After screenshots

## Checklist

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### For Reviewers

**Review checklist:**

- [ ] Code follows project conventions
- [ ] Logic is sound and efficient
- [ ] Edge cases are handled
- [ ] Tests are adequate
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed

**Review etiquette:**

- Be constructive and respectful
- Explain the "why" behind suggestions
- Distinguish between blocking issues and suggestions
- Approve when ready, don't nitpick

## Common Workflows

### Starting New Feature

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/AUTH-123-oauth2-login

# Work on feature with atomic commits
git add src/auth/oauth.ts
git commit -m "feat(auth): add OAuth2 provider configuration"

git add src/auth/oauth.test.ts
git commit -m "test(auth): add OAuth2 provider tests"

# Push to remote
git push -u origin feature/AUTH-123-oauth2-login
```

### Keeping Branch Updated

```bash
# Fetch latest changes
git fetch origin

# Rebase on main (preferred for clean history)
git rebase origin/main

# Or merge (if rebase is too complex)
git merge origin/main

# Push updated branch (force push if rebased)
git push --force-with-lease
```

### Fixing Mistakes

**Amend last commit:**

```bash
# Fix the files
git add .
git commit --amend --no-edit

# Or change commit message
git commit --amend -m "feat(auth): add OAuth2 login (updated)"
```

**Undo last commit (keep changes):**

```bash
git reset --soft HEAD~1
```

**Undo last commit (discard changes):**

```bash
git reset --hard HEAD~1
```

**Interactive rebase (clean up history):**

```bash
# Rebase last 3 commits
git rebase -i HEAD~3

# Options: pick, reword, edit, squash, fixup, drop
```

## Troubleshooting

### Merge Conflicts

**Problem:** Conflicts when merging or rebasing

**Solution:**

```bash
# 1. Identify conflicted files
git status

# 2. Open files and resolve conflicts
# Look for <<<<<<< HEAD markers

# 3. After resolving, stage files
git add resolved-file.ts

# 4. Continue rebase or merge
git rebase --continue
# or
git merge --continue

# 5. If stuck, abort and try again
git rebase --abort
# or
git merge --abort
```

### Accidentally Committed to Wrong Branch

**Problem:** Made commits on main instead of feature branch

**Solution:**

```bash
# 1. Create new branch with current changes
git branch feature/my-feature

# 2. Reset main to remote state
git checkout main
git reset --hard origin/main

# 3. Switch to feature branch
git checkout feature/my-feature
```

### Need to Undo Pushed Commits

**Problem:** Pushed commits that need to be removed

**Solution (if no one else pulled):**

```bash
# Reset to previous commit
git reset --hard HEAD~1

# Force push (dangerous!)
git push --force-with-lease
```

**Solution (if others pulled - safer):**

```bash
# Create revert commit
git revert HEAD

# Push revert
git push origin main
```

### Large Files Accidentally Committed

**Problem:** Committed large files that shouldn't be in repo

**Solution:**

```bash
# Remove from history (use BFG Repo-Cleaner)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Remove files larger than 100MB
java -jar bfg.jar --strip-blobs-bigger-than 100M

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push --force-with-lease
```

## Best Practices Summary

### Do's ✅

- Write atomic, focused commits
- Use conventional commit messages
- Keep branches short-lived
- Rebase to keep history clean
- Review your own code before PR
- Write meaningful PR descriptions
- Respond to review comments promptly
- Keep main/develop always deployable
- Use .gitignore properly
- Tag releases with semantic versioning

### Don'ts ❌

- Don't commit directly to main/develop
- Don't force push to shared branches (without --force-with-lease)
- Don't commit sensitive data (API keys, passwords)
- Don't commit large binary files
- Don't use vague commit messages ("fix", "update")
- Don't leave branches stale for weeks
- Don't merge without review (except hotfixes)
- Don't rebase public/shared branches
- Don't commit commented-out code
- Don't ignore merge conflicts

## Git Configuration

### Recommended Git Config

```bash
# Set your identity
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set default branch name
git config --global init.defaultBranch main

# Enable color output
git config --global color.ui auto

# Set default editor
git config --global core.editor "code --wait"

# Enable rebase by default for pull
git config --global pull.rebase true

# Enable auto-stash for rebase
git config --global rebase.autoStash true

# Set up aliases
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual 'log --oneline --graph --decorate --all'
```

### Useful Git Aliases

Add to `~/.gitconfig`:

```ini
[alias]
    # Short status
    s = status -s

    # Pretty log
    lg = log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit

    # Show branches
    branches = branch -a

    # Undo last commit
    undo = reset --soft HEAD~1

    # Amend without editing message
    amend = commit --amend --no-edit

    # Clean up merged branches
    cleanup = "!git branch --merged | grep -v '\\*\\|main\\|develop' | xargs -n 1 git branch -d"
```

## Additional Resources

- **Official Git Documentation**: https://git-scm.com/doc
- **Conventional Commits**: https://www.conventionalcommits.org/
- **Git Flow**: https://nvie.com/posts/a-successful-git-branching-model/
- **Trunk-Based Development**: https://trunkbaseddevelopment.com/
- **Pro Git Book**: https://git-scm.com/book/en/v2
- **GitHub Flow**: https://guides.github.com/introduction/flow/

---

**Tool:** Git CLI  
**Type:** Knowledge Base Power  
**Last Updated:** 2026-03-09
