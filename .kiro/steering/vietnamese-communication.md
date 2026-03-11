---
inclusion: auto
description: Hướng dẫn giao tiếp tiếng Việt cho dự án SmartERP, bao gồm quy tắc ngôn ngữ, phong cách mô tả vấn đề, thuật ngữ kỹ thuật, và ví dụ thực tế
---

# Hướng Dẫn Giao Tiếp Tiếng Việt - SmartERP

## Quy Tắc Giao Tiếp

Khi làm việc với dự án SmartERP, hãy tuân theo các quy tắc sau:

### 1. Ngôn Ngữ Chính

- **Giao tiếp chính**: Tiếng Việt
- **Code comments**: Tiếng Anh (chuẩn quốc tế)
- **Documentation**: Tiếng Anh (cho tài liệu kỹ thuật)
- **Commit messages**: Tiếng Anh (theo chuẩn Git)

### 2. Phong Cách Giao Tiếp

- Ngắn gọn, rõ ràng, trực tiếp
- Tránh lặp lại thông tin
- Tập trung vào hành động cần làm
- Không dùng markdown headers trừ khi cần thiết
- Không bold text, không dùng bullet points dài dòng

### 3. Cách Mô Tả Vấn Đề

Khi báo cáo lỗi hoặc vấn đề, cung cấp:

- **Vấn đề là gì**: Mô tả ngắn gọn
- **Ở đâu**: File, module, hoặc component nào
- **Kỳ vọng**: Kết quả mong muốn
- **Thực tế**: Kết quả hiện tại

Ví dụ:

```
Lỗi: Component Dashboard không hiển thị dữ liệu
Vị trí: src/frontend/src/components/Dashboard.tsx
Kỳ vọng: Hiển thị 4 KPI cards
Thực tế: Chỉ hiển thị 2 cards, 2 cards bị lỗi
```

### 4. Yêu Cầu Tính Năng

Khi yêu cầu tính năng mới:

- Mô tả tính năng cần làm
- Nơi cần thêm (backend/frontend/mobile)
- Kết quả mong muốn
- Ưu tiên (cao/trung bình/thấp)

Ví dụ:

```
Tính năng: Thêm bộ lọc theo ngày cho báo cáo bán hàng
Vị trí: Frontend - trang Reports
Kỳ vọng: Người dùng có thể chọn khoảng ngày tùy chỉnh
Ưu tiên: Cao
```

### 5. Các Thuật Ngữ Kỹ Thuật

Sử dụng các thuật ngữ tiếng Anh cho khái niệm kỹ thuật:

| Tiếng Anh | Tiếng Việt    | Ghi chú                           |
| --------- | ------------- | --------------------------------- |
| Backend   | Backend       | Phía máy chủ                      |
| Frontend  | Frontend      | Phía giao diện                    |
| Database  | Cơ sở dữ liệu | Hoặc dùng "DB"                    |
| API       | API           | Application Programming Interface |
| Component | Component     | Thành phần UI                     |
| Service   | Service       | Dịch vụ                           |
| Module    | Module        | Mô-đun                            |
| Migration | Migration     | Thay đổi schema DB                |
| Hook      | Hook          | Hàm React Hook                    |
| State     | State         | Trạng thái                        |
| Props     | Props         | Tham số component                 |
| Redux     | Redux         | Quản lý state                     |
| TypeORM   | TypeORM       | ORM cho TypeScript                |
| NestJS    | NestJS        | Framework backend                 |
| Vite      | Vite          | Build tool                        |
| Docker    | Docker        | Container                         |

### 6. Các Lệnh Phổ Biến

Khi yêu cầu chạy lệnh, dùng format:

```
Chạy: npm run start:dev
Ở: src/backend
Mục đích: Khởi động backend ở chế độ development
```

### 7. Cấu Trúc Dự Án

Khi tham chiếu đến file/folder:

- Dùng đường dẫn tương đối từ root: `src/backend/src/domains/sales`
- Hoặc từ folder hiện tại: `./components/Dashboard.tsx`
- Không dùng đường dẫn tuyệt đối

### 8. Báo Cáo Tiến Độ

Khi báo cáo công việc hoàn thành:

- Mô tả ngắn gọn những gì đã làm
- Liệt kê file/component đã thay đổi
- Ghi chú bất kỳ vấn đề hoặc cảnh báo
- Không cần bullet points dài dòng

Ví dụ:

```
Hoàn thành: Thêm bộ lọc ngày cho báo cáo bán hàng
File thay đổi: src/frontend/src/pages/Reports.tsx, src/frontend/src/components/DateFilter.tsx
Lưu ý: Cần test với dữ liệu lớn để kiểm tra performance
```

### 9. Yêu Cầu Kiểm Tra

Khi cần review code:

```
Kiểm tra: Thêm validation cho form đăng nhập
File: src/frontend/src/components/LoginForm.tsx
Điểm cần chú ý: Xử lý lỗi, UX khi nhập sai
```

### 10. Các Cụm Từ Thường Dùng

| Tiếng Việt      | Ý Nghĩa                 |
| --------------- | ----------------------- |
| Chạy được       | Hoạt động bình thường   |
| Chạy không được | Có lỗi, không hoạt động |
| Khởi động       | Start, initialize       |
| Dừng            | Stop, terminate         |
| Xây dựng        | Build, compile          |
| Kiểm tra        | Test, verify            |
| Triển khai      | Deploy                  |
| Sửa lỗi         | Fix bug                 |
| Tối ưu          | Optimize                |
| Cấu hình        | Configure               |
| Cài đặt         | Install, setup          |
| Xóa             | Delete, remove          |
| Thêm            | Add, create             |
| Sửa             | Edit, modify, update    |
| Kiểm tra lại    | Review, verify again    |

## Ví Dụ Giao Tiếp Thực Tế

### Ví dụ 1: Yêu cầu sửa lỗi

```
Lỗi: Trang Dashboard không tải dữ liệu khi refresh
Vị trí: src/frontend/src/pages/Dashboard.tsx
Nguyên nhân: API call không có error handling
Cần làm: Thêm try-catch và hiển thị error message cho người dùng
```

### Ví dụ 2: Yêu cầu tính năng

```
Tính năng: Export báo cáo ra Excel
Vị trí: Backend - endpoint mới, Frontend - button export
Kỳ vọng: Người dùng click button, tải file Excel
Ưu tiên: Trung bình
```

### Ví dụ 3: Báo cáo hoàn thành

```
Hoàn thành: Thêm pagination cho danh sách sản phẩm
File: src/frontend/src/pages/Products.tsx, src/frontend/src/components/Pagination.tsx
Kiểm tra: Đã test với 1000+ sản phẩm, hoạt động mượt
```

### Ví dụ 4: Yêu cầu kiểm tra

```
Kiểm tra: Thêm validation email cho form đăng ký
File: src/frontend/src/components/RegisterForm.tsx
Điểm cần chú ý: Regex email, UX khi lỗi, accessibility
```

## Quy Tắc Đặt Tên

### Tên File

- Dùng camelCase hoặc kebab-case
- Ví dụ: `Dashboard.tsx`, `user-service.ts`, `auth.module.ts`

### Tên Biến/Hàm

- Dùng camelCase
- Ví dụ: `getUserData()`, `isLoading`, `handleSubmit()`

### Tên Class/Interface

- Dùng PascalCase
- Ví dụ: `UserService`, `IAuthProvider`, `DashboardComponent`

### Tên Constant

- Dùng UPPER_SNAKE_CASE
- Ví dụ: `API_BASE_URL`, `MAX_RETRY_COUNT`

## Khi Nào Dùng Tiếng Anh

1. **Code comments**: Luôn dùng tiếng Anh
2. **Commit messages**: Luôn dùng tiếng Anh
3. **Documentation**: Luôn dùng tiếng Anh
4. **Issue/PR titles**: Có thể dùng tiếng Việt hoặc Anh
5. **Giao tiếp với team**: Tiếng Việt (theo steering này)

## Tóm Tắt

- 🇻🇳 **Giao tiếp**: Tiếng Việt
- 🇬🇧 **Code**: Tiếng Anh
- 📝 **Ngắn gọn**: Tránh dài dòng
- 🎯 **Rõ ràng**: Mô tả cụ thể vấn đề
- ✅ **Chuyên nghiệp**: Dùng thuật ngữ kỹ thuật đúng

---

**Lưu ý**: Steering này giúp đảm bảo giao tiếp hiệu quả và nhất quán trong team. Hãy tuân theo để dự án chạy suôn sẻ.
