# Theme Fix Guide - Hướng dẫn sửa UI/UX Dark/Light Mode

## Vấn đề đã xác định

Giao diện có nhiều hardcoded colors không đồng bộ với dark/light mode:
- Chỗ trắng thì chữ trắng (không đọc được)
- Chỗ đen thì chữ đen (không đọc được)
- Background colors hardcoded không responsive với theme

## Giải pháp

Thay thế tất cả hardcoded colors bằng Ant Design theme tokens.

## Pattern cần áp dụng

### 1. Import useToken hook

```typescript
// Thêm vào imports
import { theme } from 'antd';

// Thêm destructure
const { useToken } = theme;

// Sử dụng trong component
const { token } = useToken();
```

### 2. Thay thế hardcoded colors

| Hardcoded Color | Theme Token | Mô tả |
|----------------|-------------|-------|
| `'white'` | `token.colorBgContainer` | Background container |
| `'#ffffff'` | `token.colorBgContainer` | Background container |
| `'#f0f2f5'` | `token.colorBgLayout` | Background layout |
| `'#fafafa'` | `token.colorBgElevated` | Background elevated |
| `'#f5f5f5'` | `token.colorBgElevated` | Background elevated |
| `'#f6f8fa'` | `token.colorBgElevated` | Background elevated |
| `'#f0f7ff'` | `token.colorPrimaryBg` | Primary background (unread) |
| `'#f0f5ff'` | `token.colorPrimaryBg` | Primary background (unread) |
| `'#1890ff'` | `token.colorPrimary` | Primary color |
| `'#d9d9d9'` | `token.colorBorder` | Border color |
| `'#f0f0f0'` | `token.colorBorderSecondary` | Border secondary |
| `'#434343'` | `token.colorBorder` | Border (dark mode) |

### 3. Ví dụ cụ thể

#### Before (❌ Sai):
```typescript
<Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
  <Header style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
    <div style={{ background: '#1890ff' }}>
      Logo
    </div>
  </Header>
</Layout>
```

#### After (✅ Đúng):
```typescript
import { theme } from 'antd';
const { useToken } = theme;

function MyComponent() {
  const { token } = useToken();
  
  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      <Header style={{ 
        background: token.colorBgContainer, 
        boxShadow: token.boxShadowTertiary 
      }}>
        <div style={{ background: token.colorPrimary }}>
          Logo
        </div>
      </Header>
    </Layout>
  );
}
```

## Files đã fix ✅

1. ✅ `src/components/notifications/NotificationBell.tsx`
2. ✅ `src/pages/notifications/NotificationListPage.tsx`
3. ✅ `src/pages/notifications/NotificationCenter.tsx`

## Files cần fix ⏳

### 4. LoginPage.tsx
**Vị trí:** `src/pages/auth/LoginPage.tsx`

**Cần thay thế:**
```typescript
// Line ~164
<Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
// → background: token.colorBgLayout

// Line ~166
<Header style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '0 24px' }}>
// → background: token.colorBgContainer, boxShadow: token.boxShadowTertiary

// Line ~174
background: '#1890ff',
// → background: token.colorPrimary

// Line ~323
<Card style={{ marginTop: 24, borderRadius: 16, background: '#f6f8fa' }}>
// → background: token.colorBgElevated
```

### 5. RegisterPage.tsx
**Vị trí:** `src/pages/public/RegisterPage.tsx`

**Cần thay thế:** (Giống LoginPage)
```typescript
// Line ~98
<Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
// → background: token.colorBgLayout

// Line ~100
<Header style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: '0 24px' }}>
// → background: token.colorBgContainer, boxShadow: token.boxShadowTertiary

// Line ~108
background: '#1890ff',
// → background: token.colorPrimary

// Line ~305
<Card style={{ marginTop: 24, borderRadius: 16, background: '#f6f8fa' }}>
// → background: token.colorBgElevated
```

### 6. LandingPage.tsx
**Vị trí:** `src/pages/public/LandingPage.tsx`

**Cần thay thế:**
```typescript
// Line ~227
background: COLORS.DARK_BG,
color: COLORS.WHITE,
// → background: token.colorBgContainer, color: token.colorText

// Line ~234, 242, 258
<Title level={4} style={{ color: COLORS.WHITE }}>
// → color: token.colorText
```

**Lưu ý:** LandingPage có thể cần giữ dark footer, nhưng text color phải dùng token.

### 7. SalesOrderForm.tsx
**Vị trí:** `src/pages/orders/SalesOrderForm.tsx`

**Cần thay thế:**
```typescript
// Line ~588
background: '#f5f5f5',
// → background: token.colorBgElevated
```

### 8. PurchaseOrderForm.tsx
**Vị trí:** `src/pages/orders/PurchaseOrderForm.tsx`

**Cần thay thế:**
```typescript
// Line ~564
background: '#f5f5f5',
// → background: token.colorBgElevated
```

### 9. StockReceiptForm.tsx
**Vị trí:** `src/pages/inventory/StockReceiptForm.tsx`

**Cần thay thế:**
```typescript
// Line ~284
background: '#f5f5f5',
// → background: token.colorBgElevated

// Line ~295
<Card size="small" style={{ marginTop: 12, background: '#fafafa' }}>
// → background: token.colorBgElevated
```

## Cách test

1. Mở ứng dụng
2. Click vào ThemeToggle button (icon mặt trời/mặt trăng) ở header
3. Kiểm tra:
   - ✅ Chế độ sáng: Background trắng, text đen
   - ✅ Chế độ tối: Background đen, text trắng
   - ✅ Không có chỗ nào text cùng màu với background

## Checklist hoàn thành

- [x] NotificationBell.tsx
- [x] NotificationListPage.tsx
- [x] NotificationCenter.tsx
- [ ] LoginPage.tsx
- [ ] RegisterPage.tsx
- [ ] LandingPage.tsx
- [ ] SalesOrderForm.tsx
- [ ] PurchaseOrderForm.tsx
- [ ] StockReceiptForm.tsx

## Lưu ý quan trọng

1. **Luôn import useToken:**
   ```typescript
   import { theme } from 'antd';
   const { useToken } = theme;
   ```

2. **Luôn destructure token trong component:**
   ```typescript
   const { token } = useToken();
   ```

3. **Không hardcode colors:**
   - ❌ `background: 'white'`
   - ❌ `color: '#000000'`
   - ✅ `background: token.colorBgContainer`
   - ✅ `color: token.colorText`

4. **Test cả 2 chế độ:**
   - Light mode
   - Dark mode

## Tài liệu tham khảo

- [Ant Design Theme Tokens](https://ant.design/docs/react/customize-theme#theme)
- [useToken Hook](https://ant.design/components/theme#usetoken)
- Theme config: `src/frontend/src/theme/index.ts`
- useTheme hook: `src/frontend/src/hooks/useTheme.ts`
