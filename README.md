# Babylon Spa

MVP quản lý chấm công và tính tiền dịch vụ cho spa.

## Chạy local

```bash
npm install
npm run server
```

Mật khẩu admin mặc định ở môi trường local là `admin123`. Khi deploy, nên đổi bằng biến môi trường:

```bash
ADMIN_PASSWORD='mat-khau-cua-ban' npm run server
```

Khi backend chạy khác domain frontend, đặt thêm CORS và thư mục SQLite persistent:

```bash
FRONTEND_URL='https://TEN_GITHUB.github.io' DATA_DIR='/var/data' npm run server
```

Mở terminal thứ hai:

```bash
npm run dev
```

SQLite được lưu tại `data/spa.sqlite`. API chạy ở `http://localhost:3001`, frontend ở địa chỉ Vite hiển thị trong terminal.

Khi frontend chạy khác domain với backend, tạo biến môi trường `VITE_API_URL`, ví dụ `VITE_API_URL=https://api.example.com`. Vite sẽ dùng biến này cho toàn bộ API và xuất Excel.

## Chức năng

- Lưu bảng công và chi tiết dịch vụ vào SQLite.
- Tổng hợp lượt dịch vụ và tiền theo tháng, theo nhân viên.
- Xuất Excel tại nút `Xuất Excel`, gồm bộ lọc, định dạng tiền và cố định dòng tiêu đề.

## Deploy GitHub Pages

1. Tạo repository GitHub tên `spa-payroll-tracker`.
2. Push branch `main` lên repository.
3. Vào `Settings > Pages`, chọn `GitHub Actions` ở phần Build and deployment.
4. Mỗi lần push lên `main`, workflow sẽ build và deploy tự động.

GitHub Pages chỉ deploy frontend. Để dùng SQLite khi deploy thật, cần deploy thêm thư mục `server` lên Render hoặc Railway, sau đó cấu hình URL API cho frontend.
