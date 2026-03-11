---
inclusion: auto
description: Tiêu chuẩn chất lượng code cho dự án SmartERP - code phải chuyên nghiệp, nếu cần refactor phải refactor toàn bộ, không cắt ngắn hay tạm thời
---

# Tiêu Chuẩn Chất Lượng Code - SmartERP

## 🎯 Nguyên Tắc Cơ Bản

### 1. Code Phải Chuyên Nghiệp

- ✅ Code phải sạch, rõ ràng, dễ bảo trì
- ✅ Tuân theo best practices của ngôn ngữ/framework
- ✅ Có documentation đầy đủ
- ✅ Có test coverage tốt
- ❌ Không dùng code tạm thời, hack, workaround
- ❌ Không dùng console.log, debugger trong production code
- ❌ Không dùng magic numbers, hardcoded values

### 2. Nếu Cần Refactor - Phải Refactor Toàn Bộ

- ✅ Khi phát hiện vấn đề, refactor toàn bộ component/module
- ✅ Không refactor một phần, để lại phần khác lộn xộn
- ✅ Đảm bảo consistency trong toàn bộ codebase
- ❌ Không tạo file mới để "fix" mà bỏ file cũ
- ❌ Không để code cũ và code mới cùng tồn tại
- ❌ Không refactor một component mà bỏ qua các component liên quan

### 3. Không Cắt Ngắn Hay Tạm Thời

- ✅ Hoàn thành công việc một cách đầy đủ
- ✅ Nếu không thể hoàn thành, báo cáo rõ ràng
- ❌ Không tạo component đơn giản để "test" rồi bỏ lại
- ❌ Không dùng placeholder components
- ❌ Không để TODO comments mà không xử lý

---

## 📋 Checklist Trước Khi Commit

### Code Quality

- [ ] Code tuân theo naming conventions
- [ ] Không có console.log, debugger
- [ ] Không có magic numbers, hardcoded values
- [ ] Có comments cho logic phức tạp
- [ ] Không có dead code, unused imports
- [ ] Không có TODO comments chưa xử lý

### Architecture

- [ ] Component/Module có trách nhiệm rõ ràng
- [ ] Không có circular dependencies
- [ ] Imports được organize đúng cách
- [ ] Không có code duplication
- [ ] Tuân theo project structure

### Testing

- [ ] Có unit tests cho business logic
- [ ] Có integration tests nếu cần
- [ ] Tests pass trước khi commit
- [ ] Test coverage >= 80% cho critical code

### Documentation

- [ ] Có JSDoc/comments cho functions
- [ ] Có README nếu là module mới
- [ ] Có examples nếu là utility/helper
- [ ] Có type definitions đầy đủ

### Performance

- [ ] Không có N+1 queries
- [ ] Không có memory leaks
- [ ] Không có unnecessary re-renders (React)
- [ ] Lazy loading được áp dụng đúng

---

## ❌ KHÔNG ĐƯỢC PHÉP

### 1. Cắt Ngắn Code

```typescript
// ❌ SAI - Cắt ngắn, không hoàn chỉnh
export default function LandingPage() {
  return (
    <div>
      <h1>Welcome</h1>
      {/* TODO: Add features section later */}
      {/* TODO: Add pricing section later */}
    </div>
  );
}

// ✅ ĐÚNG - Hoàn chỉnh, có tất cả sections
export default function LandingPage() {
  return (
    <Layout>
      <Hero />
      <Features />
      <Pricing />
      <Testimonials />
      <FAQ />
      <Contact />
      <CTA />
    </Layout>
  );
}
```

### 2. Tạo Component Tạm Thời

```typescript
// ❌ SAI - Component tạm thời
export default function TempDashboard() {
  return <div>Dashboard placeholder</div>;
}

// ✅ ĐÚNG - Component hoàn chỉnh
export default function Dashboard() {
  return (
    <Layout>
      <KPICards />
      <SalesChart />
      <TopProducts />
      <RecentOrders />
    </Layout>
  );
}
```

### 3. Refactor Một Phần

```typescript
// ❌ SAI - Refactor một phần, để lại phần khác
// File cũ: OldUserService.ts (còn được dùng)
// File mới: UserService.ts (refactored)
// Kết quả: Code lộn xộn, có 2 cách làm khác nhau

// ✅ ĐÚNG - Refactor toàn bộ
// 1. Refactor UserService.ts hoàn chỉnh
// 2. Update tất cả imports từ OldUserService sang UserService
// 3. Xóa OldUserService.ts
// 4. Verify tất cả tests pass
```

### 4. Hardcoded Values

```typescript
// ❌ SAI - Hardcoded values
const MAX_ITEMS = 10;
const API_URL = 'http://localhost:3000';
const COLORS = { primary: '#1890ff', secondary: '#52c41a' };

// ✅ ĐÚNG - Constants trong file riêng
// constants/config.ts
export const MAX_ITEMS = 10;
export const API_URL = process.env.VITE_API_URL;
export const COLORS = { primary: '#1890ff', secondary: '#52c41a' };
```

### 5. Console.log trong Production Code

```typescript
// ❌ SAI - Console.log trong code
function fetchData() {
  console.log('Fetching data...');
  return api.get('/data');
}

// ✅ ĐÚNG - Dùng logger hoặc xóa
function fetchData() {
  logger.debug('Fetching data...');
  return api.get('/data');
}
```

### 6. Magic Numbers

```typescript
// ❌ SAI - Magic numbers
if (user.age > 18 && user.status === 1) {
  // ...
}

// ✅ ĐÚNG - Named constants
const ADULT_AGE = 18;
const USER_STATUS_ACTIVE = 1;

if (user.age > ADULT_AGE && user.status === USER_STATUS_ACTIVE) {
  // ...
}
```

### 7. Dead Code

```typescript
// ❌ SAI - Dead code, unused imports
import { unusedFunction } from './utils';
import { Component1, Component2, Component3 } from './components';

export default function App() {
  return <Component1 />;
  // Component2, Component3 không dùng
}

// ✅ ĐÚNG - Chỉ import cần thiết
import { Component1 } from './components';

export default function App() {
  return <Component1 />;
}
```

---

## ✅ ĐƯỢC PHÉP - Best Practices

### 1. Hoàn Chỉnh Từ Đầu

```typescript
// ✅ Component hoàn chỉnh, có tất cả tính năng
export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spin />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <Table
      columns={columns}
      dataSource={products}
      pagination={{ pageSize: 20 }}
    />
  );
}
```

### 2. Refactor Toàn Bộ

```typescript
// ✅ Khi refactor:
// 1. Tạo version mới hoàn chỉnh
// 2. Update tất cả references
// 3. Xóa version cũ
// 4. Verify tests pass
// 5. Commit một lần

// Trước:
// - UserService.ts (cũ, lộn xộn)
// - UserController.ts (dùng UserService cũ)
// - UserPage.tsx (dùng UserService cũ)

// Sau:
// - UserService.ts (refactored, sạch)
// - UserController.ts (updated, dùng UserService mới)
// - UserPage.tsx (updated, dùng UserService mới)
```

### 3. Constants Tập Trung

```typescript
// ✅ constants/index.ts
export const API_CONFIG = {
  BASE_URL: process.env.VITE_API_URL,
  TIMEOUT: 30000,
  RETRY_COUNT: 3,
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
};

export const COLORS = {
  PRIMARY: '#1890ff',
  SUCCESS: '#52c41a',
  ERROR: '#ff4d4f',
};
```

### 4. Proper Error Handling

```typescript
// ✅ Error handling đầy đủ
async function fetchData() {
  try {
    const response = await api.get('/data');
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new NotFoundError('Data not found');
    }
    if (error.response?.status === 401) {
      throw new UnauthorizedError('Please login again');
    }
    throw new APIError('Failed to fetch data');
  }
}
```

### 5. Type Safety

```typescript
// ✅ Full type safety
interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

interface UserService {
  getUser(id: string): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
}

class UserServiceImpl implements UserService {
  async getUser(id: string): Promise<User> {
    // Implementation
  }
  // ...
}
```

---

## 🔄 Quy Trình Refactoring Đúng Cách

### Khi Phát Hiện Vấn Đề

**Bước 1: Đánh Giá Phạm Vi**

- Xác định component/module nào cần refactor
- Xác định tất cả dependencies
- Xác định tất cả tests cần update

**Bước 2: Refactor Toàn Bộ**

- Refactor component/module hoàn chỉnh
- Update tất cả dependencies
- Update tất cả tests
- Thêm documentation nếu cần

**Bước 3: Verify**

- Chạy tất cả tests
- Kiểm tra linting
- Kiểm tra type checking
- Manual testing nếu cần

**Bước 4: Commit**

- Commit một lần với message rõ ràng
- Không commit từng phần

### Ví Dụ Thực Tế

```
❌ SAI:
Commit 1: "Fix LandingPage - create simple version"
Commit 2: "Add Hero component"
Commit 3: "Add Features component"
Commit 4: "Add Pricing component"
Commit 5: "Update LandingPage to use components"
Commit 6: "Delete old LandingPage"

✅ ĐÚNG:
Commit 1: "Refactor: Restructure LandingPage with Hero, Features, Pricing, Testimonials, FAQ, Contact sections"
- Tất cả components được tạo
- LandingPage được update
- Tất cả imports được fix
- Tất cả tests pass
- Một commit duy nhất
```

---

## 📊 Code Review Checklist

Khi review code, kiểm tra:

- [ ] Code có hoàn chỉnh không? Hay chỉ là tạm thời?
- [ ] Có cắt ngắn hay hack không?
- [ ] Naming conventions được tuân theo không?
- [ ] Có console.log, debugger không?
- [ ] Có magic numbers không?
- [ ] Có dead code không?
- [ ] Tests có pass không?
- [ ] Documentation có đầy đủ không?
- [ ] Performance có tốt không?
- [ ] Security có đảm bảo không?

---

## 🚫 Red Flags

Nếu thấy những điều này, yêu cầu refactor:

- ❌ "TODO: Fix later"
- ❌ "Temporary solution"
- ❌ "Quick fix"
- ❌ "Will refactor later"
- ❌ Component/file có tên "Simple", "Temp", "Test", "Demo"
- ❌ Code có console.log, debugger
- ❌ Có 2 cách làm khác nhau cho cùng một việc
- ❌ Component quá lớn (>500 lines)
- ❌ Function quá dài (>50 lines)
- ❌ Quá nhiều nested ternary operators
- ❌ Quá nhiều if-else statements

---

## 💡 Tóm Tắt

| Tiêu Chí   | ❌ SAI                        | ✅ ĐÚNG             |
| ---------- | ----------------------------- | ------------------- |
| Hoàn chỉnh | Cắt ngắn, tạm thời            | Hoàn chỉnh từ đầu   |
| Refactor   | Một phần                      | Toàn bộ             |
| Naming     | Simple, Temp, v1              | Rõ ràng, mô tả      |
| Code       | Có console.log, magic numbers | Sạch, constants     |
| Tests      | Không có hoặc fail            | Đầy đủ, pass        |
| Docs       | Không có                      | Đầy đủ              |
| Commit     | Nhiều lần, từng phần          | Một lần, hoàn chỉnh |

---

**Nhớ: Code chuyên nghiệp = Dễ bảo trì = Team hạnh phúc = Project thành công! 🎉**
