# 🍽️ Dabana – Nền tảng đặt bàn nhà hàng

Dự án tốt nghiệp KLHK3252601 – ReactJS (Frontend) + Spring Boot (Backend)

---

## Kiến trúc tổng thể

```
dabana/
├── backend/          ← Spring Boot 3.3 + Java 21 + MySQL
│   src/main/java/com/dabana/backend/
│   ├── config/           ← CORS, JPA Auditing, Security, WebSocket
│   ├── security/         ← JwtService, JwtFilter, UserDetailsService
│   ├── exception/        ← GlobalExceptionHandler, BusinessException
│   ├── common/           ← BaseEntity (id, createdAt, @Version)
│   └── modules/
│       ├── auth/         ← User, UserRole, AccountStatus, AuthService (B02)
│       ├── restaurant/   ← Restaurant (B03)
│       ├── branch/       ← Branch, BranchSearch (B04 + B01-step1)
│       ├── table_layout/ ← Zone, RestaurantTable, TableStatus (B07/B08)
│       ├── menu/         ← MenuItem, MenuItemStatus (B06)
│       ├── policy/       ← DepositPolicy, snapshot logic (B05)
│       ├── booking/      ← Booking, BookingItem, BookingService (B01)
│       │                   BookingScheduledTasks (EF04 expire)
│       ├── waitlist/     ← WaitlistEntry, WaitlistService (B10)
│       ├── notification/ ← Notification, NotificationService (B09)
│       ├── review/       ← Review, ReviewController (B13)
│       └── admin/        ← AdminController (B02/B03/B04 approve, B15)
│
└── frontend/         ← React 18 + Vite + React Router 6
    src/
    ├── api/index.js      ← axios client + JWT interceptor + tất cả API calls
    ├── context/          ← AuthContext (login/logout/isRole)
    ├── components/       ← Navbar
    ├── styles/           ← global.css (design tokens)
    └── pages/
        ├── auth/         ← LoginPage, RegisterPage (B02)
        ├── customer/     ← HomePage (B01-1), BranchDetail (B01-2),
        │                    BookingFlow (B01 full wizard), MyBookings (B14)
        ├── partner/      ← PartnerDashboard, TableLayout (B07/B08),
        │                    ManageBookings (B11/B12), MenuManager (B06)
        └── admin/        ← AdminDashboard (B15), ApprovalPanel (B02/B03/B04)
```

---

## Yêu cầu môi trường

| Công cụ      | Phiên bản tối thiểu |
|--------------|---------------------|
| Java (JDK)   | 21                  |
| Maven        | 3.9+                |
| MySQL        | 8.0+                |
| Node.js      | 18+                 |
| npm          | 9+                  |

---

## 1. Cài đặt Database

```sql
-- Tạo database (Spring Boot tự tạo bảng khi khởi động với ddl-auto=update)
CREATE DATABASE dabana CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dabana_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON dabana.* TO 'dabana_user'@'localhost';
FLUSH PRIVILEGES;
```

---

## 2. Chạy Backend

```bash
cd backend

# Cấu hình (hoặc đặt biến môi trường)
# Sửa src/main/resources/application.yml:
#   spring.datasource.username / password

# Build và chạy
mvn spring-boot:run

# Hoặc với biến môi trường:
DB_USERNAME=dabana_user DB_PASSWORD=your_password mvn spring-boot:run
```

Backend khởi động tại: `http://localhost:8080`

---

## 3. Chạy Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend tại: `http://localhost:5173`

> Vite proxy `/api → localhost:8080` và `/ws → ws://localhost:8080`

---

## 4. API Endpoints tham khảo

### Auth (B02)
| Method | URL | Mô tả |
|--------|-----|-------|
| POST | `/api/auth/register` | Đăng ký (CUSTOMER tự kích hoạt; RESTAURANT_PARTNER cần OTP + admin duyệt) |
| POST | `/api/auth/verify-otp` | Xác thực OTP (B02 bước 3) |
| POST | `/api/auth/login` | Đăng nhập → trả về accessToken + refreshToken |
| POST | `/api/auth/refresh` | Làm mới access token |

### Booking – B01 (wizard 4 bước)
| Method | URL | Mô tả |
|--------|-----|-------|
| POST | `/api/bookings/hold` | Bước 3: Giữ bàn 15 phút |
| PATCH | `/api/bookings/{id}/contact-info` | Bước 4: Cập nhật thông tin liên hệ |
| POST | `/api/bookings/{id}/pre-order` | Bước 5 (tùy chọn): Đặt món trước |
| POST | `/api/bookings/{id}/payment-result` | Bước 8: Nhận kết quả từ cổng thanh toán |
| POST | `/api/bookings/{id}/confirm-without-deposit` | AF03: Xác nhận không cần cọc |
| POST | `/api/bookings/{id}/check-in` | B12: Check-in |
| POST | `/api/bookings/{id}/check-out` | B12: Check-out & hoàn tất |

### Table Layout (B07/B08)
| Method | URL | Mô tả |
|--------|-----|-------|
| GET | `/api/zones/branch/{branchId}` | Lấy danh sách khu vực |
| POST | `/api/zones` | Tạo khu vực mới |
| GET | `/api/tables/zone/{zoneId}` | Lấy bàn theo khu vực |
| POST | `/api/tables/manage` | Thêm bàn mới |
| PATCH | `/api/tables/{id}/status` | Cập nhật trạng thái bàn (B08) |

### WebSocket (B08 real-time)
```
ws://localhost:8080/ws  (SockJS endpoint)
Subscribe: /topic/table-status/{branchId}
Publish:   /app/table-status/{branchId}
```

---

## 5. Luồng đặt bàn B01 – Thứ tự API calls

```
1. GET  /api/branches/{id}                → Thông tin chi nhánh
2. GET  /api/zones/branch/{id}            → Sơ đồ khu vực
3. GET  /api/tables/zone/{zoneId}         → Bàn + trạng thái
4. GET  /api/menu-items/branch/{id}       → Thực đơn
5. POST /api/bookings/hold                → Giữ bàn (15 phút - BR03)
6. PATCH /api/bookings/{id}/contact-info  → Thông tin liên hệ
7. POST /api/bookings/{id}/pre-order      → Đặt món trước (tùy chọn - AF02)
8. POST /api/bookings/{id}/payment-result → Kết quả thanh toán cọc
   hoặc
   POST /api/bookings/{id}/confirm-without-deposit → Không cần cọc (AF03)
```

---

## 6. Phân quyền RBAC

| Role | Token claim | Quyền chính |
|------|------------|-------------|
| `CUSTOMER` | `ROLE_CUSTOMER` | Đặt bàn, xem lịch sử, đánh giá |
| `RESTAURANT_PARTNER` | `ROLE_RESTAURANT_PARTNER` | Quản lý chi nhánh, bàn, thực đơn, check-in/out |
| `ADMIN` | `ROLE_ADMIN` | Phê duyệt hồ sơ, xem thống kê toàn nền tảng |

---

## 7. Business Rules quan trọng đã triển khai

| BR | Mô tả | Nơi triển khai |
|----|-------|----------------|
| B01-BR01 | Một bàn không có 2 đơn trùng giờ | `@UniqueConstraint(table_id, reservation_time)` |
| B01-BR02 | Sức chứa ≥ số khách | `BookingService.createHold()` |
| B01-BR03 | Giữ bàn tối đa 15 phút | `holdExpiresAt`, `BookingScheduledTasks` |
| B01-BR06 | Snapshot chính sách tại bước 7 | `applyDepositSnapshot()` |
| B01-BR09 | Snapshot giá món tại bước 5 | `BookingItem.snapshotPrice` |
| B05-EF01 | Từ chối mức cọc âm/vượt 100% | `@DecimalMin/@DecimalMax` trên `DepositPolicy` |
| B06-BR03 | Không xóa cứng món đã đặt | `MenuItemStatus.DISCONTINUED` thay vì `DELETE` |
| B08-BR05 | Chỉ B08 được đổi trạng thái bàn sau B07 | `TableLayoutController.updateStatus()` |
| B09-BR01 | Xác nhận đặt bàn gửi tức thì | `NotificationService.sendImmediate()` |
| B09-BR02 | Retry tối đa 3 lần | `retryCount < 3` trong scheduler |
| B10-BR01 | Hàng chờ FIFO theo timestamp | `ORDER BY createdAt ASC` |
| B10-BR02 | Hạn phản hồi lời mời 10 phút | `inviteExpiresAt`, job mỗi 30 giây |
| B13-BR01 | Chỉ đơn COMPLETED mới được đánh giá | `ReviewController.createReview()` |

---

## 8. TODO – Tích hợp thêm trong production

- [ ] **Cổng thanh toán**: tích hợp VNPay / MoMo vào `POST /api/bookings/{id}/payment-result`
- [ ] **Email thật**: thay `System.out.println` bằng SendGrid trong `OtpService` và `NotificationService`
- [ ] **SMS thật**: tích hợp Twilio / eSMS.vn cho OTP và nhắc lịch
- [ ] **Redis**: thay OTP in-memory store bằng Redis để scale horizontal
- [ ] **WebSocket broker**: thay in-memory broker bằng RabbitMQ/ActiveMQ cho multi-instance
- [ ] **File upload**: tích hợp S3/Cloudinary cho ảnh nhà hàng, ảnh món ăn
- [ ] **Pagination**: thêm `Pageable` cho danh sách booking, thực đơn dài
- [ ] **Unit tests**: viết test cho `BookingService`, `WaitlistService`
