---
name: frontend-module-i18n-refactor
description: Workflow command scaffold for frontend-module-i18n-refactor in SmartERP.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /frontend-module-i18n-refactor

Use this workflow when working on **frontend-module-i18n-refactor** in `SmartERP`.

## Goal

Adds internationalization (i18n) support to a frontend module by creating translation files (en/vi) and refactoring React component(s) to use translation keys instead of hardcoded text.

## Common Files

- `src/frontend/src/i18n/locales/en/*.json`
- `src/frontend/src/i18n/locales/vi/*.json`
- `src/frontend/src/pages/*/*.tsx`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create or update translation files for the module in src/frontend/src/i18n/locales/en/{module}.json and src/frontend/src/i18n/locales/vi/{module}.json
- Add or update translation keys as needed for all UI text in the module
- Refactor the relevant React component(s) (e.g., pages/{module}/*.tsx) to replace hardcoded text with translation keys using the useTranslation hook
- Ensure all UI labels, messages, buttons, and statuses use i18n
- Test that both English and Vietnamese are fully supported and there are 0 TypeScript errors

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.