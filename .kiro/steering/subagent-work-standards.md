# Tiêu Chuẩn Làm Việc Cho Sub-Agent

## Mục Đích

Đảm bảo sub-agent hoàn thành công việc được giao một cách chuyên nghiệp, hiệu quả và không cần phải quay lại làm lại.

## Quy Tắc Bắt Buộc

### 1. Hoàn Thành Công Việc Triệt Để

- **Không để lại việc nửa vời**: Nếu giao debug vấn đề, phải tìm ra nguyên nhân gốc rễ
- **Không tạm thời hóa**: Không được dùng workaround, phải fix cơ bản
- **Kiểm tra kỹ lưỡng**: Sau khi fix, phải verify lại để chắc chắn vấn đề đã giải quyết

### 2. Báo Cáo Chi Tiết

- Liệt kê tất cả các vấn đề tìm được
- Giải thích nguyên nhân của từng vấn đề
- Nêu rõ các fix đã áp dụng
- Cung cấp hướng dẫn test để verify

### 3. Không Bỏ Sót

- Nếu tìm thấy vấn đề liên quan, phải fix luôn (không để cho main agent)
- Nếu cần thêm thông tin, phải tự tìm hiểu từ code/logs
- Không được nói "cần xem logs" rồi dừng lại - phải tự xem logs

### 4. Chất Lượng Code

- Tuân theo steering files: `code-quality-standards.md`, `naming-conventions.md`
- Code phải chuyên nghiệp, production-ready
- Không được dùng tên generic (Simple, Temp, Fix, v1, v2, etc.)

### 5. Giao Tiếp

- Báo cáo bằng tiếng Việt (tuân theo `vietnamese-communication.md`)
- Rõ ràng, ngắn gọn, không dài dòng
- Nêu kết quả cuối cùng rõ ràng

## Ví Dụ Công Việc Tốt

**Giao việc**: "Debug tại sao registration không hoạt động"

**Báo cáo tốt**:

```
Tìm thấy 3 vấn đề:

1. CORS Configuration (main.ts)
   - Nguyên nhân: enableCors với credentials: true nhưng origin: '*'
   - Fix: Thay origin thành 'http://localhost:5175'
   - Verify: Login API giờ hoạt động

2. Database Seed Data
   - Nguyên nhân: Demo account chưa được tạo
   - Fix: Chạy POST /seed/demo để tạo admin@demo.com
   - Verify: Login thành công với admin@demo.com / admin123

3. RegisterPage API Payload
   - Nguyên nhân: Frontend gửi firstName/lastName nhưng backend expect fullName
   - Fix: Cập nhật RegisterPage.tsx gửi đúng payload
   - Verify: Registration API trả về 200 OK
```

## Ví Dụ Công Việc Tệ

❌ "Có vẻ là database issue, cần check logs"
❌ "Có thể là CORS, có thể là auth, không chắc"
❌ "Fix xong nhưng chưa test"
❌ "Tạo file Temp_Fix_v1.ts"

## Checklist Trước Khi Báo Cáo

- [ ] Tìm ra nguyên nhân gốc rễ của vấn đề
- [ ] Fix tất cả vấn đề liên quan
- [ ] Test lại để verify fix hoạt động
- [ ] Code tuân theo quality standards
- [ ] Báo cáo chi tiết bằng tiếng Việt
- [ ] Cung cấp hướng dẫn test cho main agent
