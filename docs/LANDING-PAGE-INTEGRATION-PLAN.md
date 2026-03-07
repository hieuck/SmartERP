# 🔄 Kế Hoạch Tích Hợp Landing Page Vào Frontend

**Ngày**: 2026-03-07  
**Quyết định**: Tích hợp landing page từ Next.js vào React/Vite frontend  
**Lý do**: Đơn giản hóa, giảm cost, better UX, học từ Odoo/ERPNext

---

## 🎯 Mục Tiêu

Chuyển từ:
```
❌ Tách riêng:
src/landing-page/     # Next.js app
src/frontend/         # React/Vite app
```

Sang:
```
✅ Tích hợp:
src/frontend/
├── src/
│   ├── pages/
│   │   ├── public/       # Landing pages (NEW!)
│   │   └── app/          # Authenticated pages
│   └── ...
```

---

## 📋 Các Bước Thực Hiện

### Phase 1: Phân Tích Landing Page Hiện Tại

1. **Kiểm tra nội dung landing-page**
   - Xem có bao nhiêu pages
   - Xem dependencies gì
   - Xem có dùng Next.js specific features không

2. **Xác định components cần migrate**
   - Layout components
   - Marketing components
   - Form components

3. **Xác định routes cần migrate**
   - Home page
   - Pricing page
   - Features page
   - Contact page
   - etc.

### Phase 2: Chuẩn Bị Frontend

1. **Tạo cấu trúc mới trong frontend**
   ```
   src/frontend/src/
   ├── pages/
   │   ├── public/           # NEW: Landing pages
   │   │   ├── Home.tsx
   │   │   ├── Pricing.tsx
   │   │   ├── Features.tsx
   │   │   ├── Contact.tsx
   │   │   └── About.tsx
   │   │
   │   └── app/              # Authenticated pages
   │       ├── Dashboard.tsx
   │       └── ...
   │
   ├── components/
   │   ├── marketing/        # NEW: Marketing components
   │   │   ├── Hero.tsx
   │   │   ├── PricingCard.tsx
   │   │   ├── FeatureList.tsx
   │   │   └── ContactForm.tsx
   │   │
   │   └── app/              # App components
   │       └── ...
   │
   ├── layouts/
   │   ├── MarketingLayout.tsx  # NEW: For landing pages
   │   └── AppLayout.tsx         # For authenticated pages
   │
   └── routes/
       ├── PublicRoutes.tsx      # NEW: Public routes
       └── PrivateRoutes.tsx     # Private routes
   ```

2. **Setup routing**
   - Install react-router-dom (nếu chưa có)
   - Configure routes cho public và private pages

### Phase 3: Migration

1. **Copy components từ landing-page**
   - Copy từng component
   - Convert Next.js syntax sang React
   - Remove Next.js specific imports

2. **Copy pages từ landing-page**
   - Copy từng page
   - Convert Next.js routing sang React Router
   - Update imports

3. **Copy styles**
   - Copy Tailwind config (nếu có)
   - Copy CSS files
   - Merge với frontend styles

### Phase 4: Testing

1. **Test từng page**
   - Home page
   - Pricing page
   - Features page
   - Contact page

2. **Test routing**
   - Public routes
   - Private routes
   - Redirects

3. **Test responsive**
   - Mobile
   - Tablet
   - Desktop

### Phase 5: Cleanup

1. **Xóa landing-page folder**
   ```bash
   Remove-Item -Recurse -Force smart-erp/src/landing-page
   ```

2. **Update documentation**
   - Update README
   - Update CHANGELOG
   - Update architecture docs

3. **Update configs**
   - Remove landing-page từ docker-compose (nếu có)
   - Remove landing-page từ CI/CD (nếu có)

---

## ⚠️ Rủi Ro & Giải Pháp

### Rủi Ro 1: Next.js Specific Features

**Vấn đề**: Landing page dùng Next.js features như:
- `getStaticProps`
- `getServerSideProps`
- Image optimization
- etc.

**Giải pháp**:
- Convert sang React Query cho data fetching
- Dùng `react-lazy-load-image` cho image optimization
- Implement SSR với Vite SSR plugin (nếu cần)

### Rủi Ro 2: Styling Conflicts

**Vấn đề**: Landing page và frontend có styles khác nhau

**Giải pháp**:
- Namespace CSS classes
- Use CSS modules
- Merge Tailwind configs carefully

### Rủi Ro 3: Dependencies Conflicts

**Vấn đề**: Landing page và frontend có dependencies khác nhau

**Giải pháp**:
- Merge package.json carefully
- Resolve version conflicts
- Test thoroughly

---

## 📊 Checklist

### Pre-Migration
- [ ] Backup landing-page folder
- [ ] Analyze landing-page structure
- [ ] List all pages to migrate
- [ ] List all components to migrate
- [ ] List all dependencies

### Migration
- [ ] Create new folder structure in frontend
- [ ] Setup routing
- [ ] Migrate components
- [ ] Migrate pages
- [ ] Migrate styles
- [ ] Merge dependencies

### Testing
- [ ] Test all pages
- [ ] Test routing
- [ ] Test responsive
- [ ] Test forms
- [ ] Test API calls

### Cleanup
- [ ] Remove landing-page folder
- [ ] Update CHANGELOG
- [ ] Update README
- [ ] Update architecture docs

---

## 🚀 Timeline

- **Phase 1**: 30 phút (Phân tích)
- **Phase 2**: 1 giờ (Chuẩn bị)
- **Phase 3**: 2-3 giờ (Migration)
- **Phase 4**: 1 giờ (Testing)
- **Phase 5**: 30 phút (Cleanup)

**Tổng**: ~5-6 giờ

---

## 📝 Notes

- Làm từng bước, không rush
- Test kỹ sau mỗi bước
- Commit thường xuyên
- Có thể rollback nếu cần

---

**Status**: 📋 READY TO START  
**Next Step**: Phân tích landing-page hiện tại
