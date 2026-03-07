# Rollback to Correct Folder Structure

**Date**: 2026-03-07  
**Decision**: ROLLBACK from `backend/monolith-app/src/` to `src/backend/`  
**Reason**: Follow document-driven development (FOLDER-STRUCTURE-ANALYSIS.md)

---

## 🎯 Why Rollback?

### ❌ Problems with `backend/monolith-app/src/`

1. **Vi phạm Document-Driven Development**
   - Document FOLDER-STRUCTURE-ANALYSIS.md đề xuất `src/backend/`
   - Implementation làm `backend/monolith-app/src/`
   - Mất niềm tin vào document

2. **Structure không tối ưu**
   - Path dài: `backend/monolith-app/src/domains/`
   - Nested 3 levels không cần thiết
   - Tên "monolith-app" không rõ ràng

3. **Khó mở rộng**
   - Không rõ shared code ở đâu
   - Không consistent với frontend/mobile
   - Khó thêm microservices sau này

### ✅ Benefits of `src/backend/`

1. **Rõ ràng**: `src/` = source code
2. **Path ngắn**: `src/backend/domains/` vs `backend/monolith-app/src/domains/`
3. **Consistent**: `src/backend/`, `src/frontend/`, `src/mobile/`
4. **Dễ scale**: Thêm `src/shared/`, `src/libs/` sau này

---

## ✅ Completed Steps

### Step 1: Create New Structure ✅ (2026-03-07)

Created folders:
- `smart-erp/src/`
- `smart-erp/src/backend/`

### Step 2: Copy All Files ✅ (2026-03-07)

Copied all files from `backend/monolith-app/src/` to `src/backend/`:
- `core/` (5 modules: auth, user, tenant, permission, settings)
- `domains/` (6 domains: accounting, sales, inventory, purchasing, manufacturing, hr)
- `platform/` (8 modules: workflow, notification, email, document, report, dashboard, audit, search)
- `integrations/` (3 modules: payment-gateway, shipping, integration)
- `utilities/` (3 modules: import-export, scheduled-jobs, health)
- `extensions/` (empty, ready for future)
- `shared/` (shared code)
- `common/` (common utilities)
- `config/` (configuration)
- `migrations/` (database migrations)
- `modules/production/` (old module to be moved to domains/manufacturing/)
- `app.module.ts`, `main.ts`

### Step 3: Copy Config Files ✅ (2026-03-07)

Copied:
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `nest-cli.json`
- `jest.config.js`
- `.env`, `.env.example`
- `.gitignore`
- `README.md`

---

## 📋 Next Steps (TODO)

### Step 4: Update Imports

Need to update imports in all files that reference old paths.

### Step 5: Update package.json Scripts

Update paths in scripts:
- `start:dev` → Point to `src/backend/main.ts`
- `start:prod` → Point to `dist/main.js`
- `build` → Output to `dist/`
- `test` → Run tests from `src/backend/`
- `migration:*` → Point to new migrations folder

### Step 6: Install Dependencies

```bash
cd smart-erp/src/backend
npm install
```

### Step 7: Verify Build

```bash
cd smart-erp/src/backend
npm run build
```

### Step 8: Verify Tests

```bash
cd smart-erp/src/backend
npm test
```

### Step 9: Remove Old Folder

```bash
rm -rf smart-erp/backend/monolith-app/
```

### Step 10: Update CI/CD

Update GitHub Actions, Docker files, etc.

---

## 🎯 Final Structure

```
smart-erp/
├── src/                            # ✅ Source code
│   └── backend/                    # ✅ Backend app (NEW LOCATION)
│       ├── core/                   # Core modules
│       ├── domains/                # Business domains
│       ├── platform/               # Platform features
│       ├── integrations/           # Integrations
│       ├── utilities/              # Utilities
│       ├── extensions/             # Extensions
│       ├── shared/                 # Shared code
│       ├── common/                 # Common utilities
│       ├── config/                 # Configuration
│       ├── migrations/             # Database migrations
│       ├── app.module.ts
│       ├── main.ts
│       ├── package.json
│       └── tsconfig.json
├── backend/                        # ❌ Old location (to be removed)
│   └── monolith-app/               # ❌ To be deleted
├── frontend/                       # To be moved to src/ later
├── mobile/                         # To be moved to src/ later
├── infrastructure/
├── docs/
├── scripts/
└── ...
```

---

## ✅ Progress Checklist

- [x] Create `src/backend/` folder
- [x] Copy all files from `backend/monolith-app/src/`
- [x] Copy config files
- [x] Update ROADMAP.md
- [x] Update CHANGELOG.md
- [x] Create migration documentation
- [ ] Update imports in all modules
- [ ] Update `app.module.ts`
- [ ] Update `package.json` scripts
- [ ] Run `npm install` in new location
- [ ] Run `npm run build` to verify
- [ ] Run `npm test` to verify
- [ ] Remove old `backend/monolith-app/` folder
- [ ] Update CI/CD configs
- [ ] Update root README.md

---

## 📊 Impact

- **Files moved**: ~500+ files
- **Modules migrated**: 29 modules
- **Time to complete**: ~4-6 hours total
- **Time spent so far**: ~1 hour (structure creation)
- **Breaking changes**: Yes (all imports need update)
- **Rollback possible**: Yes (old folder still exists until verified)

---

## 🎓 Lessons Learned

1. **Always follow document-driven development**
   - Write document first
   - Implement exactly as documented
   - Don't deviate without updating document

2. **Think before implementing**
   - Analyze structure carefully
   - Consider long-term scalability
   - Don't rush into implementation

3. **Rollback early if wrong**
   - Don't fall into sunk cost fallacy
   - Fix mistakes early
   - Technical debt compounds over time

4. **User feedback is valuable**
   - User asked to "phản biện lại" → Think critically
   - Challenge your own decisions
   - Be willing to admit mistakes and fix them

---

**Status**: ✅ Structure created (Step 1-3 complete)  
**Next**: Update imports and package.json (Step 4-5)  
**Estimated time remaining**: 3-5 hours
