---
inclusion: always
---

# Kiro System Conventions

## Hooks

- Hook files MUST have the extension `.kiro.hook`
- Location: `.kiro/hooks/<name>.kiro.hook`
- Format: JSON with required fields `name`, `version`, `when`, `then`

Example:
```json
{
  "name": "My Hook",
  "version": "1.0.0",
  "when": {
    "type": "fileEdited",
    "patterns": ["**/*.ts"]
  },
  "then": {
    "type": "askAgent",
    "prompt": "..."
  }
}
```

## Skills

- Each skill is a **folder** inside `.kiro/skills/`
- The folder MUST contain a file named exactly `SKILL.md` (uppercase)
- `SKILL.md` starts with YAML frontmatter with `name` and `description` fields

Structure:
```
.kiro/skills/
└── my-skill/
    └── SKILL.md
```

`SKILL.md` format:
```markdown
---
name: my-skill
description: When to activate this skill. Use when...
---

## Instructions
...
```

- Do NOT create skills as flat `.md` files directly in `.kiro/skills/`
- Do NOT name the file anything other than `SKILL.md`
