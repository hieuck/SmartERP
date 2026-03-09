# 📋 Báo Cáo Phân Tích Cấu Trúc Thư Mục Toàn Diện

**Ngày**: 2026-03-07  
**Phạm vi**: Backend, Frontend, Mobile, Landing Page  
**Trạng thái**: Phân tích hoàn thành, đề xuất fix

---

## 🎯 Tổng Quan

| Component | Compliance | Vấn Đề Chính |
|-----------|-----------|--------------|
| Backend | ⚠️ 95% | Còn legacy `modules/production/` |
| Frontend | ❌ 80% | Landing page nằm sai vị trí |
| Mobile | ✅ 100% | Hoàn toàn chuẩn |
| Landing Page | ❌ 0% | Nằm sai vị trí hoàn toàn |

---

## 🔴 VẤN ĐỀ NGHIÊM TRỌNG: Landing Page

### Hiện Trạng
```
❌ SAI:
smart-erp/
└── src/
    └── frontend/              # React/Vite app
        └── landing-page/      # Next.js app (SAI VỊ TRÍ!)
            ├── next.config.js
            ├── package.json
            ├── src/
            └── node_modules/
```

### Vấn Đề
1. **Landing page là Next.js app riêng biệt** với:
   - `package.json` riêng
   - `node_modules/` riêng
   - `next.config.js` riêng
   - Build system riêng (Next.js vs Vite)

2. **Không nên nằm trong `src/frontend/`** vì:
   - Frontend là React/Vite app
   - Landing page là Next.js app
   - Hai tech stack khác nhau
   - Hai deployment pipeline khác nhau

3. **Gây khó khăn cho**:
   - CI/CD (phải build 2 apps trong 1 folder)
   - Docker (phải tách Dockerfile)
   - Deployment (confusing structure)
   - Maintenance (không rõ ràng)

### Giải Pháp
```
✅ ĐÚNG:
smart-erp/
└── src/
    ├── backend/               # NestJS app
    ├── frontend/              # React/Vite app (main app)
    ├── mobile/                # React Native app
    └── landing-page/          # Next.js app (marketing site)
```

---

## ⚠️ VẤN ĐỀ NHỎ: Backend

### Hiện Trạng
```
src/backend/
├── domains/                   ✅ Đúng
├── platform/                  ✅ Đúng
├── core/                      ✅ Đúng
├── common/                    ✅ Đúng
└── modules/                   ❌ Legacy
    └── production/            ❌ Nên chuyển sang domains/manufacturing/
```

### Giải Pháp
- Di chuyển `modules/production/` → `domains/manufacturing/production/`
- Hoặc merge vào `domains/manufacturing/` nếu trùng logic

---

## ✅ CHUẨN: Mobile

### Hiện Trạng
```
src/mobile/
├── App.tsx                    ✅ Entry point (chuẩn React Native/Expo)
├── src/
│   ├── components/            ✅
│   ├── screens/               ✅
│   ├── services/              ✅
│   ├── hooks/                 ✅
│   ├── navigation/            ✅
│   ├── store/                 ✅
│   └── theme/                 ✅
├── package.json               ✅
├── app.json                   ✅
└── babel.config.js            ✅
```

**Kết luận**: Hoàn toàn chuẩn React Native/Expo convention.

---

## ✅ CHUẨN: Frontend (trừ landing-page)

### Hiện Trạng
```
src/frontend/
├── src/
│   ├── components/            ✅
│   ├── pages/                 ✅
│   ├── services/              ✅
│   ├── hooks/                 ✅
│   ├── store/                 ✅
│   ├── theme/                 ✅
│   └── utils/                 ✅
├── e2e/                       ✅ E2E tests
├── public/                    ✅ Static assets
├── package.json               ✅
├── vite.config.ts             ✅
└── landing-page/              ❌ SAI VỊ TRÍ
```

**Kết luận**: Cấu trúc tốt, chỉ cần di chuyển landing-page ra ngoài.

---

## 📋 PLAN FIX

### Phase 1: Di Chuyển Landing Page (CRITICAL)
```bash
# 1. Di chuyển landing-page ra ngoài
mv src/frontend/landing-page src/landing-page

# 2. Update references trong:
# - docker-compose.yml
# - CI/CD configs
# - Documentation
```

### Phase 2: Cleanup Backend (LOW PRIORITY)
```bash
# Di chuyển modules/production
# (Có thể làm sau, không ảnh hưởng nhiều)
```

---

## 🎯 CẤU TRÚC MỤC TIÊU

```
smart-erp/
├── src/
│   ├── backend/               # NestJS API
│   │   ├── common/            # Shared utilities
│   │   ├── core/              # Core modules (auth, user, tenant)
│   │   ├── domains/           # Business domains
│   │   ├── platform/          # Platform features
│   │   ├── config/            # Configuration
│   │   └── migrations/        # Database migrations
│   │
│   ├── frontend/              # React/Vite main app
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── services/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   ├── theme/
│   │   │   └── utils/
│   │   ├── e2e/
│   │   ├── public/
│   │   └── package.json
│   │
│   ├── mobile/                # React Native app
│   │   ├── App.tsx
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── screens/
│   │   │   ├── services/
│   │   │   ├── hooks/
│   │   │   ├── navigation/
│   │   │   ├── store/
│   │   │   └── theme/
│   │   └── package.json
│   │
│   ├── landing-page/          # Next.js marketing site
│   │   ├── src/
│   │   │   ├── app/
│   │   │   └── components/
│   │   ├── public/
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   └── shared/                # Shared code across apps
│       ├── types/
│       ├── constants/
│       └── utils/
│
├── config/                    # Infrastructure configs
│   ├── docker/
│   ├── nginx/
│   ├── kubernetes/
│   └── monitoring/
│
├── scripts/                   # Build/deploy scripts
├── docs/                      # Documentation
└── .github/                   # CI/CD workflows
```

---

## 📊 IMPACT ANALYSIS

### Landing Page Move

**Files cần update**:
1. `docker-compose.yml` - Update landing-page service path
2. `.github/workflows/*.yml` - Update CI/CD paths
3. `README.md` - Update documentation
4. `docs/DEPLOYMENT.md` - Update deployment guide
5. Root `package.json` - Update workspace paths (nếu có)

**Breaking Changes**: ❌ KHÔNG
- Landing page là independent app
- Không có dependencies với frontend
- Chỉ cần update paths trong configs

**Downtime**: ❌ KHÔNG
- Chỉ di chuyển files
- Không ảnh hưởng runtime

---

## ✅ CHECKLIST

### Pre-Move
- [ ] Backup landing-page folder
- [ ] List tất cả files reference landing-page
- [ ] Test landing-page build locally

### Move
- [ ] Di chuyển `src/frontend/landing-page` → `src/landing-page`
- [ ] Update docker-compose.yml
- [ ] Update CI/CD workflows
- [ ] Update documentation

### Post-Move
- [ ] Test landing-page build
- [ ] Test landing-page dev server
- [ ] Test Docker build
- [ ] Update CHANGELOG.md

---

## 🚀 NEXT STEPS

1. **Immediate** (Today):
   - Di chuyển landing-page
   - Update configs
   - Test builds

2. **Short-term** (This week):
   - Update documentation
   - Cleanup backend modules/production

3. **Long-term** (Next sprint):
   - Review shared code opportunities
   - Optimize monorepo structure

---

**Prepared by**: Kiro AI  
**Date**: 2026-03-07  
**Status**: Ready for execution
