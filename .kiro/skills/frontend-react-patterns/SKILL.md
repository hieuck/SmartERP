---
name: frontend-react-patterns
description: Best practices for React + Vite + Ant Design + React Query development in SmartERP frontend. Use when building React components, implementing forms, data fetching, or writing frontend tests.
---

# Frontend React Patterns

## When to Use This Skill

Use this skill when working on:

- ✅ React components in `src/frontend/`
- ✅ Ant Design UI implementation
- ✅ React Query data fetching
- ✅ Redux Toolkit state management
- ✅ Frontend testing with Vitest + Testing Library
- ✅ Vite configuration and optimization

## Tech Stack Overview

```json
{
  "framework": "React 18.2",
  "bundler": "Vite 5.0",
  "ui": "Ant Design 5.12",
  "state": "Redux Toolkit 2.0 + React Query 5.90",
  "routing": "React Router 6.21",
  "forms": "React Hook Form 7.49 + Zod 3.22",
  "testing": "Vitest 4.0 + Testing Library 16.3",
  "charts": "Recharts 2.10"
}
```

## Project Structure

```
src/frontend/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components (routes)
│   ├── features/         # Feature-based modules
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API services (axios)
│   ├── store/            # Redux store
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript types
│   └── __tests__/        # Test files
├── public/               # Static assets
└── vite.config.ts        # Vite configuration
```

## Core Patterns

### 1. Component Structure (Ant Design)

**✅ CORRECT: Functional Component with TypeScript**

```typescript
import React from 'react';
import { Card, Button, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface ProductListProps {
  tenantId: string;
  onAddProduct: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({ tenantId, onAddProduct }) => {
  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Title level={3}>Products</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={onAddProduct}>
            Add Product
          </Button>
        </Space>
        {/* Content */}
      </Space>
    </Card>
  );
};
```

**Key Points:**

- Use functional components with TypeScript interfaces
- Import Ant Design components individually
- Use Ant Design icons from `@ant-design/icons`
- Export named components (not default)

### 2. Data Fetching (React Query)

**✅ CORRECT: React Query Hook**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import { message } from 'antd';

// Query hook
export const useProducts = (tenantId: string) => {
  return useQuery({
    queryKey: ['products', tenantId],
    queryFn: () => productService.getAll(tenantId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation hook
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      message.success('Product created successfully');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Failed to create product');
    },
  });
};

// Usage in component
const ProductPage: React.FC = () => {
  const { data: products, isLoading, error } = useProducts('tenant-1');
  const createProduct = useCreateProduct();

  if (isLoading) return <Spin />;
  if (error) return <Alert type="error" message="Failed to load products" />;

  return <ProductList products={products} onCreate={createProduct.mutate} />;
};
```

**Key Points:**

- Create custom hooks for queries and mutations
- Use `queryKey` for caching and invalidation
- Handle loading, error, and success states
- Invalidate queries after mutations
- Show user feedback with Ant Design `message`

### 3. Forms (React Hook Form + Zod)

**✅ CORRECT: Form with Validation**

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, Input, Button, InputNumber } from 'antd';

// Zod schema
const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  price: z.number().min(0, 'Price must be positive'),
  description: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => void;
  initialValues?: Partial<ProductFormData>;
}

export const ProductForm: React.FC<ProductFormProps> = ({ onSubmit, initialValues }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialValues,
  });

  return (
    <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
      <Form.Item
        label="Product Name"
        validateStatus={errors.name ? 'error' : ''}
        help={errors.name?.message}
      >
        <Controller
          name="name"
          control={control}
          render={({ field }) => <Input {...field} placeholder="Enter product name" />}
        />
      </Form.Item>

      <Form.Item
        label="Price"
        validateStatus={errors.price ? 'error' : ''}
        help={errors.price?.message}
      >
        <Controller
          name="price"
          control={control}
          render={({ field }) => <InputNumber {...field} style={{ width: '100%' }} min={0} />}
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
};
```

**Key Points:**

- Use Zod for schema validation
- Use React Hook Form with `zodResolver`
- Wrap Ant Design inputs with `Controller`
- Show validation errors with `validateStatus` and `help`

### 4. State Management (Redux Toolkit)

**✅ CORRECT: Redux Slice**

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

// Usage in component
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';

const Header: React.FC = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
  };

  return <Button onClick={handleLogout}>Logout</Button>;
};
```

**Key Points:**

- Use Redux Toolkit for global state (auth, theme, etc.)
- Use React Query for server state (API data)
- Keep Redux slices simple and focused
- Use TypeScript for type safety

### 5. Routing (React Router)

**✅ CORRECT: Protected Routes**

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <ProductsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
```

## Testing Patterns (Vitest + Testing Library)

### 1. Component Testing

**✅ CORRECT: Test Component with User Interactions**

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ProductForm } from './ProductForm';

describe('ProductForm', () => {
  it('should submit form with valid data', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<ProductForm onSubmit={onSubmit} />);

    // Fill form
    await user.type(screen.getByLabelText(/product name/i), 'Test Product');
    await user.type(screen.getByLabelText(/price/i), '99.99');

    // Submit
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Assert
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Test Product',
        price: 99.99,
      });
    });
  });

  it('should show validation errors', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<ProductForm onSubmit={onSubmit} />);

    // Submit without filling
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Assert errors shown
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

### 2. Hook Testing (React Query)

**✅ CORRECT: Test Custom Hook**

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { useProducts } from './useProducts';
import * as productService from '@/services/product.service';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useProducts', () => {
  it('should fetch products successfully', async () => {
    const mockProducts = [{ id: '1', name: 'Product 1' }];
    vi.spyOn(productService, 'getAll').mockResolvedValue(mockProducts);

    const { result } = renderHook(() => useProducts('tenant-1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProducts);
  });
});
```

### 3. Integration Testing

**✅ CORRECT: Test Full Page Flow**

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { ProductsPage } from './ProductsPage';
import * as productService from '@/services/product.service';

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(<QueryClientProvider client={queryClient}>{component}</QueryClientProvider>);
};

describe('ProductsPage', () => {
  it('should display products and create new product', async () => {
    const mockProducts = [{ id: '1', name: 'Product 1' }];
    vi.spyOn(productService, 'getAll').mockResolvedValue(mockProducts);
    vi.spyOn(productService, 'create').mockResolvedValue({ id: '2', name: 'New Product' });

    const user = userEvent.setup();
    renderWithProviders(<ProductsPage />);

    // Wait for products to load
    expect(await screen.findByText('Product 1')).toBeInTheDocument();

    // Click add button
    await user.click(screen.getByRole('button', { name: /add product/i }));

    // Fill form
    await user.type(screen.getByLabelText(/name/i), 'New Product');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/created successfully/i)).toBeInTheDocument();
    });
  });
});
```

## Performance Optimization

### 1. Code Splitting

```typescript
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';

// Lazy load pages
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<Spin size="large" />}>
      <Routes>
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/orders" element={<OrdersPage />} />
      </Routes>
    </Suspense>
  );
};
```

### 2. Memoization

```typescript
import { useMemo, useCallback } from 'react';

const ProductList: React.FC<{ products: Product[] }> = ({ products }) => {
  // Memoize expensive calculations
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // Memoize callbacks
  const handleDelete = useCallback(
    (id: string) => {
      // Delete logic
    },
    [], // Dependencies
  );

  return <>{/* Render */}</>;
};
```

### 3. Vite Optimization

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          antd: ['antd', '@ant-design/icons'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
```

## Accessibility (a11y)

```typescript
import { Button, Input, Form } from 'antd';

// ✅ Use semantic HTML and ARIA labels
const AccessibleForm: React.FC = () => {
  return (
    <Form layout="vertical">
      <Form.Item label="Email" required>
        <Input
          type="email"
          aria-label="Email address"
          aria-required="true"
          placeholder="Enter your email"
        />
      </Form.Item>

      <Button type="primary" htmlType="submit" aria-label="Submit form">
        Submit
      </Button>
    </Form>
  );
};
```

## Common Pitfalls

### ❌ Anti-Pattern 1: Prop Drilling

```typescript
// BAD
<Parent>
  <Child1 user={user}>
    <Child2 user={user}>
      <Child3 user={user} />
    </Child2>
  </Child1>
</Parent>

// GOOD: Use Context or Redux
const UserContext = createContext<User | null>(null);

<UserContext.Provider value={user}>
  <Parent>
    <Child1>
      <Child2>
        <Child3 />
      </Child2>
    </Child1>
  </Parent>
</UserContext.Provider>
```

### ❌ Anti-Pattern 2: Fetching in useEffect

```typescript
// BAD
useEffect(() => {
  fetch('/api/products').then((res) => setProducts(res.data));
}, []);

// GOOD: Use React Query
const { data: products } = useQuery({
  queryKey: ['products'],
  queryFn: () => productService.getAll(),
});
```

### ❌ Anti-Pattern 3: Not Handling Loading/Error States

```typescript
// BAD
const { data } = useQuery({ queryKey: ['products'], queryFn: getProducts });
return <div>{data.map(...)}</div>; // Crashes if data is undefined

// GOOD
const { data, isLoading, error } = useQuery({ queryKey: ['products'], queryFn: getProducts });

if (isLoading) return <Spin />;
if (error) return <Alert type="error" message="Failed to load" />;
return <div>{data.map(...)}</div>;
```

## Checklist

Before submitting frontend code, verify:

- [ ] ✅ TypeScript types defined for all props and data
- [ ] ✅ Ant Design components used consistently
- [ ] ✅ React Query for data fetching (not useEffect)
- [ ] ✅ React Hook Form + Zod for forms
- [ ] ✅ Loading and error states handled
- [ ] ✅ User feedback with `message` or `notification`
- [ ] ✅ Tests written with Testing Library
- [ ] ✅ Accessibility attributes added
- [ ] ✅ Code split for large pages
- [ ] ✅ No prop drilling (use Context/Redux)

## Related Documentation

- [Ant Design Documentation](https://ant.design/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
