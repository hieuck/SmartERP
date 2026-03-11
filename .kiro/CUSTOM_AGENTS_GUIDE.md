# Hướng Dẫn Sử Dụng Custom Agents - SmartERP

Dự án SmartERP có 5 custom agents chuyên biệt để xử lý các công việc khác nhau. Mỗi agent được thiết kế để hoàn thành công việc triệt để, không nửa vời, và báo cáo chi tiết bằng tiếng Việt.

## 5 Custom Agents

### 1. backend-engineer

**Mục đích**: Xử lý backend NestJS

**Trách nhiệm**:

- Debug/fix NestJS code, services, controllers, modules
- Xử lý database issues, migrations, seed data
- Fix API endpoints, validation, error handling
- Tối ưu performance, tuân theo best practices

**Khi nào dùng**:

- Có lỗi trong backend code
- API endpoints không hoạt động
- Database issues, migration problems
- Validation, error handling issues

**Ví dụ**:

```
Giao việc: "Fix registration endpoint - không thể tạo user mới"
Backend-engineer sẽ:
1. Kiểm tra registration endpoint
2. Kiểm tra validation logic
3. Kiểm tra database connection
4. Kiểm tra seed data
5. Fix tất cả vấn đề tìm được
6. Báo cáo chi tiết
```

---

### 2. frontend-engineer

**Mục đích**: Xử lý frontend React

**Trách nhiệm**:

- Debug/fix React components, hooks, state management
- Xử lý form validation, API integration
- Fix UI/UX issues, styling
- Tối ưu performance, tuân theo best practices

**Khi nào dùng**:

- Có lỗi trong React components
- Form validation không hoạt động
- UI/UX issues
- API integration problems

**Ví dụ**:

```
Giao việc: "Dashboard component không hiển thị dữ liệu"
Frontend-engineer sẽ:
1. Kiểm tra component logic
2. Kiểm tra state management
3. Kiểm tra API calls
4. Kiểm tra error handling
5. Fix tất cả vấn đề tìm được
6. Báo cáo chi tiết
```

---

### 3. database-specialist

**Mục đích**: Xử lý database

**Trách nhiệm**:

- Kiểm tra database connection, schema
- Tạo/chạy migrations, seed data
- Debug query issues, performance
- Verify data integrity

**Khi nào dùng**:

- Database connection issues
- Schema/migration problems
- Seed data issues
- Query performance problems

**Ví dụ**:

```
Giao việc: "Database connection failed"
Database-specialist sẽ:
1. Kiểm tra database connection
2. Kiểm tra configuration
3. Kiểm tra migrations
4. Kiểm tra seed data
5. Fix tất cả vấn đề tìm được
6. Báo cáo chi tiết
```

---

### 4. api-tester

**Mục đích**: Test API endpoints

**Trách nhiệm**:

- Test registration, login, CRUD endpoints
- Verify request/response payloads
- Check error handling, validation
- Verify CORS, authentication, authorization

**Khi nào dùng**:

- Cần test API endpoints
- Verify request/response format
- Check error handling
- Verify authentication/authorization

**Ví dụ**:

```
Giao việc: "Test registration API - verify payloads"
API-tester sẽ:
1. Test registration endpoint
2. Verify request/response format
3. Test error cases
4. Verify validation
5. Báo cáo chi tiết
```

---

### 5. integration-coordinator

**Mục đích**: Xử lý integration issues

**Trách nhiệm**:

- Kiểm tra backend-frontend integration
- Debug API communication issues
- Verify end-to-end flows
- Coordinate fixes giữa các components

**Khi nào dùng**:

- Backend-frontend integration issues
- API communication problems
- End-to-end flow problems
- Cần coordinate fixes

**Ví dụ**:

```
Giao việc: "Registration flow không hoạt động - từ frontend đến backend"
Integration-coordinator sẽ:
1. Kiểm tra frontend code
2. Kiểm tra backend code
3. Kiểm tra API communication
4. Verify end-to-end flow
5. Fix tất cả vấn đề tìm được
6. Báo cáo chi tiết
```

---

## Quy Tắc Làm Việc Chung

Tất cả agents tuân theo các quy tắc sau:

### 1. Hoàn Thành Triệt Để

- Tìm ra nguyên nhân gốc rễ của mỗi vấn đề
- Không dùng workaround, phải fix cơ bản
- Kiểm tra kỹ lưỡng sau khi fix
- Verify tất cả vấn đề đã giải quyết

### 2. Báo Cáo Chi Tiết

- Liệt kê tất cả vấn đề tìm được
- Giải thích nguyên nhân của từng vấn đề
- Nêu rõ các fix đã áp dụng
- Cung cấp hướng dẫn test để verify

### 3. Không Bỏ Sót

- Nếu tìm thấy vấn đề liên quan, phải fix luôn
- Tự tìm hiểu từ code/logs, không nói "cần xem logs"
- Xem logs, kiểm tra code, test - tất cả cần làm

### 4. Chất Lượng Code

- Tuân theo code-quality-standards.md
- Code phải chuyên nghiệp, production-ready
- Không dùng tên generic (Simple, Temp, Fix, v1, v2)
- Refactor toàn bộ nếu cần, không cắt ngắn

### 5. Giao Tiếp

- Báo cáo bằng tiếng Việt
- Rõ ràng, ngắn gọn, không dài dòng
- Nêu kết quả cuối cùng rõ ràng
- Tuân theo vietnamese-communication.md

---

## Format Báo Cáo Chuẩn

Tất cả agents báo cáo theo format này:

```
Tìm thấy [số] vấn đề:

1. [Tên vấn đề] ([file/component])
   - Nguyên nhân: [Giải thích]
   - Fix: [Mô tả fix]
   - Verify: [Cách test]

2. [Tên vấn đề] ([file/component])
   - Nguyên nhân: [Giải thích]
   - Fix: [Mô tả fix]
   - Verify: [Cách test]
```

---

## Cách Sử Dụng

### Bước 1: Xác Định Vấn Đề

Xác định vấn đề cần giải quyết:

- Backend issue → backend-engineer
- Frontend issue → frontend-engineer
- Database issue → database-specialist
- API testing → api-tester
- Integration issue → integration-coordinator

### Bước 2: Giao Việc

Giao việc cho agent phù hợp với mô tả rõ ràng:

- Vấn đề là gì
- Ở đâu (file, component, endpoint)
- Kỳ vọng kết quả

### Bước 3: Nhận Báo Cáo

Agent sẽ báo cáo chi tiết:

- Tất cả vấn đề tìm được
- Nguyên nhân của từng vấn đề
- Fix đã áp dụng
- Cách test để verify

### Bước 4: Verify Kết Quả

Verify rằng fix hoạt động:

- Chạy tests
- Test manually
- Kiểm tra logs

---

## Ví Dụ Thực Tế

### Ví dụ 1: Registration không hoạt động

**Giao việc cho**: integration-coordinator

**Mô tả**: "Registration flow không hoạt động - người dùng không thể đăng ký"

**Báo cáo nhận được**:

```
Tìm thấy 3 vấn đề:

1. CORS Configuration (src/backend/src/main.ts)
   - Nguyên nhân: enableCors với credentials: true nhưng origin: '*'
   - Fix: Thay origin thành 'http://localhost:5175'
   - Verify: Registration API giờ hoạt động

2. Database Seed Data (src/backend/src/database/seeds)
   - Nguyên nhân: Demo account chưa được tạo
   - Fix: Chạy POST /seed/demo để tạo admin@demo.com
   - Verify: Login thành công với admin@demo.com / admin123

3. RegisterPage API Payload (src/frontend/src/pages/RegisterPage.tsx)
   - Nguyên nhân: Frontend gửi firstName/lastName nhưng backend expect fullName
   - Fix: Cập nhật RegisterPage.tsx gửi đúng payload
   - Verify: Registration API trả về 200 OK
```

### Ví dụ 2: Dashboard không tải dữ liệu

**Giao việc cho**: frontend-engineer

**Mô tả**: "Dashboard component không hiển thị dữ liệu khi load"

**Báo cáo nhận được**:

```
Tìm thấy 2 vấn đề:

1. Missing Error Handling (src/frontend/src/pages/Dashboard.tsx)
   - Nguyên nhân: useEffect không có try-catch, API error không được xử lý
   - Fix: Thêm try-catch và error state
   - Verify: Dashboard hiển thị error message khi API fail

2. Dependency Array Issue (src/frontend/src/pages/Dashboard.tsx)
   - Nguyên nhân: useEffect dependency array rỗng, data không được refresh
   - Fix: Thêm dependencies vào array
   - Verify: Dashboard tự động refresh khi dependencies thay đổi
```

---

## Lưu Ý Quan Trọng

1. **Không để lại việc nửa vời**: Agents sẽ hoàn thành công việc triệt để
2. **Không dùng workaround**: Phải fix cơ bản, không tạm thời
3. **Phải test kỹ lưỡng**: Trước khi báo cáo, phải verify fix hoạt động
4. **Báo cáo chi tiết**: Nêu rõ nguyên nhân, fix, và cách test
5. **Tuân theo standards**: Code phải tuân theo code-quality-standards.md

---

## Steering Files

Các agents tuân theo các steering files sau:

- **code-quality-standards.md**: Tiêu chuẩn chất lượng code
- **vietnamese-communication.md**: Hướng dẫn giao tiếp tiếng Việt
- **subagent-work-standards.md**: Tiêu chuẩn làm việc cho sub-agents
- **naming-conventions.md**: Quy tắc đặt tên

---

## Tóm Tắt

| Agent                   | Mục Đích       | Khi Nào Dùng                         |
| ----------------------- | -------------- | ------------------------------------ |
| backend-engineer        | Backend NestJS | Backend issues, API endpoints        |
| frontend-engineer       | Frontend React | Frontend issues, components          |
| database-specialist     | Database       | Database issues, migrations          |
| api-tester              | API Testing    | Test endpoints, verify payloads      |
| integration-coordinator | Integration    | Integration issues, end-to-end flows |

---

**Nhớ**: Mỗi agent được thiết kế để hoàn thành công việc triệt để, không nửa vời. Giao việc rõ ràng, nhận báo cáo chi tiết, verify kết quả. 🎉
