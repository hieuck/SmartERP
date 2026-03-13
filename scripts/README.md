# Automation Scripts

Production-ready automation scripts for Smart-ERP development.

## 🚀 Quick Start

```powershell
# 1. Generate new CRUD module
.\scripts\generate-crud-module.ps1 -EntityName Product -Domain inventory

# 2. Generate new CRUD service
.\scripts\generate-crud-service.ps1 -EntityName Product -Domain inventory

# 3. Track velocity
.\scripts\velocity-tracker.ps1 -Action log -Points 3 -Task "Implemented Product module"
.\scripts\velocity-tracker.ps1 -Action report
```

## 📊 Available Scripts

| Script                | Purpose                          | Usage   |
| --------------------- | -------------------------------- | ------- |
| generate-crud-module  | Generate complete CRUD module    | As needed |
| generate-crud-service | Generate CRUD service only       | As needed |
| velocity-tracker      | Track development velocity       | Daily   |
| backup-automation     | Automated backup (.ps1 & .sh)    | Scheduled |
| deploy-production     | Production deployment (.ps1 & .sh) | Release |
| start-all             | Start all services (.ps1 & .sh)  | Development |

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
