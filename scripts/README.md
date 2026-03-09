# Automation Scripts

Scripts để tăng velocity từ 6.5/10 lên 10/10.

## 🚀 Quick Start

```powershell
# 1. Fix security imports (dry run first)
.\scripts\fix-security-imports.ps1 -DryRun
.\scripts\fix-security-imports.ps1

# 2. Fix test parameters
.\scripts\fix-test-parameters.ps1 -DryRun
.\scripts\fix-test-parameters.ps1

# 3. Generate new CRUD service
.\scripts\generate-crud-service.ps1 -EntityName Product -Domain inventory

# 4. Track velocity
.\scripts\velocity-tracker.ps1 -Action log -Points 3 -Task "Fixed 10 security imports"
.\scripts\velocity-tracker.ps1 -Action report
```

## 📊 Expected Impact

| Script                | Time Saved | Usage   | Weekly Impact       |
| --------------------- | ---------- | ------- | ------------------- |
| fix-security-imports  | 2 hours    | 1x/week | 2 hours             |
| fix-test-parameters   | 1.5 hours  | 1x/week | 1.5 hours           |
| generate-crud-service | 1 hour     | 5x/week | 5 hours             |
| velocity-tracker      | 15 min     | Daily   | 1.25 hours          |
| **TOTAL**             |            |         | **9.75 hours/week** |

**Velocity Improvement:** 6.5/10 → 9/10 (target: 10/10 with practice)

## 📝 Templates

```powershell
# Use templates for new features
cp templates/service.template.ts src/domains/product/product.service.ts
cp templates/service.spec.template.ts src/domains/product/product.service.spec.ts
cp templates/controller.template.ts src/domains/product/product.controller.ts

# Replace placeholders
# {{EntityName}} → Product
# {{entity-name}} → product
```

## 🎯 Velocity Targets

- **Week 1:** 7/10 (learn scripts)
- **Week 2:** 8/10 (use templates)
- **Week 3:** 9/10 (optimize workflow)
- **Week 4:** 10/10 (full automation)
