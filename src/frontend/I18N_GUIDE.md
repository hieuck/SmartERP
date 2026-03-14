# i18n Implementation Guide

## Overview

Frontend đã được refactor để hỗ trợ đa ngôn ngữ (i18n) sử dụng `react-i18next`. Hiện tại hỗ trợ 2 ngôn ngữ:
- Tiếng Anh (en)
- Tiếng Việt (vi)

## Architecture

### Dependencies
- `i18next`: Core i18n framework
- `react-i18next`: React bindings for i18next
- `i18next-browser-languagedetector`: Auto-detect user language

### Folder Structure
```
src/frontend/src/
├── i18n/
│   ├── config.ts                 # i18n configuration
│   └── locales/
│       ├── en/                   # English translations
│       │   ├── common.json
│       │   ├── auth.json
│       │   ├── dashboard.json
│       │   ├── products.json
│       │   ├── orders.json
│       │   ├── customers.json
│       │   └── inventory.json
│       └── vi/                   # Vietnamese translations
│           ├── common.json
│           ├── auth.json
│           ├── dashboard.json
│           ├── products.json
│           ├── orders.json
│           ├── customers.json
│           └── inventory.json
```

## Translation Files

### Namespaces
- `common`: Buttons, labels, messages, validation, pagination
- `auth`: Login, register, logout
- `dashboard`: Dashboard KPIs, charts, tables
- `products`: Product management
- `orders`: Order management
- `customers`: Customer management
- `inventory`: Inventory management

### Translation Key Structure
```json
{
  "buttons": {
    "create": "Create",
    "edit": "Edit",
    "delete": "Delete"
  },
  "labels": {
    "name": "Name",
    "status": "Status"
  },
  "messages": {
    "success": "Operation successful",
    "error": "An error occurred"
  }
}
```

## Usage

### 1. Import useTranslation Hook
```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation(['common', 'products']);
  
  return (
    <div>
      <h1>{t('products:title')}</h1>
      <Button>{t('common:buttons.create')}</Button>
    </div>
  );
}
```

### 2. Translation with Namespace
```tsx
// Single namespace
const { t } = useTranslation('common');
<Button>{t('buttons.create')}</Button>

// Multiple namespaces
const { t } = useTranslation(['common', 'products']);
<Button>{t('common:buttons.create')}</Button>
<h1>{t('products:title')}</h1>
```

### 3. Translation with Interpolation
```tsx
// Translation file
{
  "welcome": "Welcome, {{name}}!"
}

// Component
<Text>{t('welcome', { name: user.name })}</Text>
```

### 4. Translation with Pluralization
```tsx
// Translation file
{
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}

// Component
<Text>{t('items', { count: 5 })}</Text>
```

## Language Switcher

Component `LanguageSwitcher` đã được tạo sẵn:

```tsx
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

function Header() {
  return (
    <div>
      <LanguageSwitcher />
    </div>
  );
}
```

## Ant Design Locale

Ant Design locale được sync tự động với i18n language:

```tsx
// main.tsx
import viVN from 'antd/locale/vi_VN';
import enUS from 'antd/locale/en_US';

<ConfigProvider locale={i18n.language === 'vi' ? viVN : enUS}>
  <App />
</ConfigProvider>
```

## Best Practices

### 1. Naming Convention
- Use descriptive keys: `products.createProduct` instead of `products.create`
- Group related keys: `buttons.*`, `labels.*`, `messages.*`
- Use camelCase for keys

### 2. Avoid Hardcoded Text
❌ Bad:
```tsx
<Button>Create Product</Button>
```

✅ Good:
```tsx
<Button>{t('products:createProduct')}</Button>
```

### 3. Keep Translations Consistent
- Use same terminology across all pages
- Reuse common translations from `common` namespace
- Don't duplicate translations

### 4. Add New Translations
When adding new features:
1. Add keys to both `en` and `vi` translation files
2. Use descriptive key names
3. Group related keys together

Example:
```json
// en/products.json
{
  "filters": {
    "all": "All Products",
    "active": "Active",
    "inactive": "Inactive"
  }
}

// vi/products.json
{
  "filters": {
    "all": "Tất cả sản phẩm",
    "active": "Đang hoạt động",
    "inactive": "Không hoạt động"
  }
}
```

## Testing

### Manual Testing
1. Start dev server: `npm run dev`
2. Open browser: `http://localhost:5173`
3. Click language switcher (top right)
4. Verify all text changes language

### Automated Testing
```tsx
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/config';

test('renders translated text', () => {
  render(
    <I18nextProvider i18n={i18n}>
      <MyComponent />
    </I18nextProvider>
  );
  
  expect(screen.getByText(/create/i)).toBeInTheDocument();
});
```

## Migration Status

### ✅ Completed
- i18n infrastructure setup
- Translation files created (common, auth, dashboard, products, orders, customers, inventory)
- LanguageSwitcher component
- LoginPage refactored with i18n

### ⏳ Pending
- RegisterPage
- Dashboard
- Product pages
- Order pages
- Customer pages
- Inventory pages
- Other modules

## Adding New Modules

When creating new modules:

1. Create translation files:
```bash
src/i18n/locales/en/mymodule.json
src/i18n/locales/vi/mymodule.json
```

2. Import in `i18n/config.ts`:
```tsx
import enMyModule from './locales/en/mymodule.json';
import viMyModule from './locales/vi/mymodule.json';

const resources = {
  en: {
    // ...
    mymodule: enMyModule,
  },
  vi: {
    // ...
    mymodule: viMyModule,
  },
};
```

3. Add namespace to config:
```tsx
i18n.init({
  // ...
  ns: ['common', 'auth', 'dashboard', 'mymodule'],
});
```

4. Use in components:
```tsx
const { t } = useTranslation('mymodule');
```

## Troubleshooting

### Translation not showing
- Check if namespace is imported in `i18n/config.ts`
- Check if key exists in translation file
- Check console for i18n errors

### Language not switching
- Check if `LanguageSwitcher` is imported correctly
- Check if `i18n/config.ts` is imported in `main.tsx`
- Clear localStorage and reload

### Ant Design not changing language
- Check if `ConfigProvider` locale is synced with i18n
- Import correct Ant Design locale (`viVN` or `enUS`)

## Resources

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Ant Design Internationalization](https://ant.design/docs/react/i18n)
