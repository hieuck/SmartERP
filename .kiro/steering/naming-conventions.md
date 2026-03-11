---
inclusion: auto
description: Quy tắc đặt tên file, component, function, variable cho dự án SmartERP - tránh tên generic, tên tạm thời, hoặc tên không có ý nghĩa
---

# Quy Tắc Đặt Tên - SmartERP

## ❌ KHÔNG ĐƯỢC PHÉP

Tuyệt đối không dùng những tên sau:

### Tên Generic/Tạm Thời

- ❌ `Simple*` (SimpleLanding, SimpleForm, SimpleComponent)
- ❌ `Temp*` (TempFile, TempComponent)
- ❌ `Test*` (TestPage, TestComponent)
- ❌ `Demo*` (DemoForm, DemoList)
- ❌ `New*` (NewComponent, NewPage)
- ❌ `Old*` (OldDashboard, OldLayout)
- ❌ `Backup*` (BackupFile, BackupComponent)

### Tên Version/Iteration

- ❌ `v1`, `v2`, `v3` (ComponentV1, FormV2)
- ❌ `V1`, `V2`, `V3` (ComponentV1.tsx)
- ❌ `*_v1`, `*_v2` (dashboard_v1.tsx)
- ❌ `*-v1`, `*-v2` (dashboard-v1.tsx)
- ❌ `*Final`, `*Final2` (ComponentFinal, ComponentFinal2)
- ❌ `*Latest` (LatestVersion, LatestComponent)

### Tên Fix/Patch

- ❌ `Fix*` (FixBug, FixedComponent)
- ❌ `*Fix` (ComponentFix, FormFix)
- ❌ `*Fixed` (DashboardFixed, ListFixed)
- ❌ `*Patch` (ComponentPatch)
- ❌ `*Hotfix` (HotfixForm)

### Tên Không Rõ Ràng

- ❌ `Blah*`, `Bla*` (BlahComponent, BlaForm)
- ❌ `Foo*`, `Bar*` (FooComponent, BarService)
- ❌ `Stuff*`, `Thing*` (StuffComponent, ThingService)
- ❌ `Helper*` (HelperComponent - quá generic)
- ❌ `Utils*` (UtilsComponent - quá generic)
- ❌ `Common*` (CommonComponent - quá generic)
- ❌ `Generic*` (GenericForm, GenericList)

### Tên Viết Tắt Không Rõ

- ❌ `Comp` (Comp.tsx)
- ❌ `Mgmt` (UserMgmt.tsx)
- ❌ `Ctrl` (UserCtrl.tsx)
- ❌ `Svc` (UserSvc.ts)
- ❌ `Util` (Util.ts)
- ❌ `Hlpr` (Hlpr.ts)

### Tên Không Có Ý Nghĩa

- ❌ `Aaa`, `Bbb`, `Ccc`
- ❌ `Test123`, `Abc123`
- ❌ `Xxx`, `Yyy`, `Zzz`
- ❌ `Asdf`, `Qwerty`

---

## ✅ ĐƯỢC PHÉP - Quy Tắc Đặt Tên Đúng

### 1. File Component

**Format**: `<Tên>Component.tsx` hoặc `<Tên>.tsx`

**Ví dụ đúng:**

```
✅ DashboardComponent.tsx
✅ ProductListComponent.tsx
✅ OrderFormComponent.tsx
✅ UserProfileComponent.tsx
✅ InventoryReportComponent.tsx
✅ PaymentGatewayComponent.tsx
```

**Ví dụ sai:**

```
❌ SimpleComponent.tsx
❌ ComponentV1.tsx
❌ DashboardFixed.tsx
❌ NewDashboard.tsx
```

### 2. File Service

**Format**: `<Tên>Service.ts`

**Ví dụ đúng:**

```
✅ ProductService.ts
✅ OrderService.ts
✅ AuthenticationService.ts
✅ PaymentProcessingService.ts
✅ InventoryManagementService.ts
```

**Ví dụ sai:**

```
❌ ProductSvc.ts
❌ ServiceV1.ts
❌ HelperService.ts
```

### 3. File Module/Controller

**Format**: `<Tên>Module.ts` hoặc `<Tên>Controller.ts`

**Ví dụ đúng:**

```
✅ ProductModule.ts
✅ OrderModule.ts
✅ UserController.ts
✅ InventoryController.ts
```

**Ví dụ sai:**

```
❌ ProductModuleV1.ts
❌ ControllerFix.ts
```

### 4. File Utility

**Format**: `<Tên>Utils.ts` hoặc `<Tên>Helper.ts` (chỉ khi cần thiết)

**Ví dụ đúng:**

```
✅ DateUtils.ts
✅ ValidationUtils.ts
✅ FormatUtils.ts
✅ CurrencyHelper.ts
✅ FileUploadHelper.ts
```

**Ví dụ sai:**

```
❌ Utils.ts (quá generic)
❌ Helper.ts (quá generic)
❌ UtilsV1.ts
```

### 5. Function/Method

**Format**: camelCase, động từ + danh từ

**Ví dụ đúng:**

```
✅ getUserData()
✅ fetchProductList()
✅ calculateTotalPrice()
✅ validateEmailFormat()
✅ processPaymentTransaction()
✅ generateInvoiceReport()
```

**Ví dụ sai:**

```
❌ getUser() - quá generic
❌ func1() - không rõ ý
❌ doSomething() - không rõ ý
❌ fix() - không rõ ý
```

### 6. Variable/Constant

**Format**: camelCase (variable), UPPER_SNAKE_CASE (constant)

**Ví dụ đúng:**

```
✅ const userData = {...}
✅ let isLoading = false
✅ const MAX_RETRY_COUNT = 3
✅ const API_BASE_URL = 'http://...'
✅ const PRODUCT_STATUS_ACTIVE = 'active'
```

**Ví dụ sai:**

```
❌ const data = {...} - quá generic
❌ const x = 5 - không rõ ý
❌ const temp = [] - tạm thời
```

### 7. Interface/Type

**Format**: PascalCase, bắt đầu với `I` (interface) hoặc `T` (type)

**Ví dụ đúng:**

```
✅ interface IUser { ... }
✅ interface IProduct { ... }
✅ type TOrderStatus = 'pending' | 'completed'
✅ interface IPaymentGateway { ... }
```

**Ví dụ sai:**

```
❌ interface User { ... } - không có prefix
❌ interface IUserV1 { ... } - có version
❌ interface IThing { ... } - quá generic
```

### 8. Class

**Format**: PascalCase, tên rõ ràng

**Ví dụ đúng:**

```
✅ class ProductRepository { ... }
✅ class OrderProcessor { ... }
✅ class PaymentGateway { ... }
✅ class InventoryManager { ... }
```

**Ví dụ sai:**

```
❌ class ProductV1 { ... }
❌ class Helper { ... }
❌ class Util { ... }
```

### 9. Folder/Directory

**Format**: kebab-case, tên rõ ràng

**Ví dụ đúng:**

```
✅ src/components/product-list/
✅ src/services/payment-processing/
✅ src/pages/order-management/
✅ src/utils/date-formatting/
```

**Ví dụ sai:**

```
❌ src/components/simple/
❌ src/services/service-v1/
❌ src/pages/temp/
```

---

## 📋 Checklist Trước Khi Commit

Trước khi commit code, kiểm tra:

- [ ] Tên file không chứa: Simple, Temp, Test, Demo, New, Old, Backup
- [ ] Tên file không chứa: v1, v2, v3, Final, Latest, Fix, Fixed, Patch
- [ ] Tên file không chứa: Blah, Foo, Bar, Stuff, Thing, Xxx, Yyy, Zzz
- [ ] Tên function rõ ràng, bắt đầu bằng động từ (get, fetch, calculate, validate, process)
- [ ] Tên variable rõ ràng, không dùng x, y, z, data, temp, stuff
- [ ] Tên constant viết hoa, UPPER_SNAKE_CASE
- [ ] Tên interface/type có prefix I hoặc T
- [ ] Tên class rõ ràng, PascalCase
- [ ] Tên folder rõ ràng, kebab-case

---

## 🎯 Nguyên Tắc Chung

### 1. Rõ Ràng Hơn Ngắn Gọn

```
✅ getUserProfileData() - rõ ràng
❌ getUser() - quá generic
❌ get() - không rõ ý
```

### 2. Tên Phải Tự Giải Thích

```
✅ calculateOrderTotalPrice()
❌ calc()
❌ doCalc()
```

### 3. Tên Phải Phản Ánh Mục Đích

```
✅ validateEmailFormat()
✅ isValidEmail()
❌ check()
❌ validate()
```

### 4. Tên Phải Nhất Quán Trong Project

```
✅ getUserData(), getProductData(), getOrderData()
❌ getUserData(), fetchProduct(), getOrder()
```

### 5. Tên Phải Theo Quy Ước Ngôn Ngữ

```
✅ isLoading, hasError, canDelete (boolean)
✅ getUserData(), fetchProductList() (function)
✅ MAX_RETRY_COUNT, API_BASE_URL (constant)
```

---

## 🚫 Lý Do Tại Sao Không Được Dùng Tên Generic

### 1. Khó Bảo Trì

```
❌ Khi thấy SimpleLanding.tsx, không biết nó làm gì
✅ Khi thấy LandingPage.tsx, rõ ràng là trang chủ
```

### 2. Khó Tìm Kiếm

```
❌ Tìm "Simple" sẽ có 100 kết quả
✅ Tìm "LandingPage" sẽ có 1-2 kết quả
```

### 3. Khó Hiểu Ý Định

```
❌ ComponentV1 - phiên bản nào là chính?
✅ ProductListComponent - rõ ràng là danh sách sản phẩm
```

### 4. Khó Hợp Tác Team

```
❌ Ai viết cái "Fix" này? Tại sao lại fix?
✅ Ai viết OrderProcessingService? Rõ ràng là xử lý đơn hàng
```

### 5. Khó Quản Lý Version

```
❌ ComponentV1, ComponentV2, ComponentV3 - nên dùng cái nào?
✅ Dùng Git history để quản lý version
```

---

## 📝 Ví Dụ Thực Tế

### ❌ SAI - Tên Generic

```
src/frontend/src/pages/public/SimpleLanding.tsx
src/frontend/src/components/FormV1.tsx
src/frontend/src/services/UtilsService.ts
src/frontend/src/utils/HelperFunctions.ts
```

### ✅ ĐÚNG - Tên Rõ Ràng

```
src/frontend/src/pages/public/LandingPage.tsx
src/frontend/src/components/ProductFormComponent.tsx
src/frontend/src/services/ProductService.ts
src/frontend/src/utils/DateFormatUtils.ts
```

---

## 🔄 Khi Cần Refactor

Nếu cần refactor code cũ:

1. **Không dùng tên version**: ❌ ComponentV2.tsx
2. **Dùng tên mô tả**: ✅ ProductListComponentRefactored.tsx (tạm thời)
3. **Sau khi test xong**: Đổi tên thành ✅ ProductListComponent.tsx
4. **Xóa file cũ**: Dùng Git history để lưu trữ

---

## 📌 Tóm Tắt

| Loại      | ❌ SAI            | ✅ ĐÚNG                 |
| --------- | ----------------- | ----------------------- |
| Component | SimpleLanding.tsx | LandingPage.tsx         |
| Service   | UtilsService.ts   | ProductService.ts       |
| Function  | doSomething()     | calculateOrderTotal()   |
| Variable  | data, temp, x     | userData, isLoading     |
| Constant  | MAX = 5           | MAX_RETRY_COUNT = 5     |
| Interface | interface User    | interface IUser         |
| Class     | class Helper      | class ProductRepository |
| Folder    | simple/, temp/    | product-list/, payment/ |

---

**Nhớ: Tên tốt = Code dễ hiểu = Team hạnh phúc = Project thành công! 🎉**
