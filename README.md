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
FRONTEND_URL='https://kinchan026.github.io' DATA_DIR='/data' npm run server
```

Trên Render, tạo `Persistent Disk` và mount vào đúng `/data`, sau đó đặt Environment Variable `DATA_DIR=/data`. Không dùng `/var/data` nếu chưa mount disk ở đường dẫn đó. Nếu `DATA_DIR` đã được khai báo nhưng disk không mount hoặc không ghi được, backend sẽ dừng ngay thay vì âm thầm lưu vào thư mục local và làm bạn tưởng dữ liệu vẫn an toàn.

File SQLite được lưu ngoài source code khi chạy trên Render (`/data/spa.sqlite`). Các file `data/`, `*.sqlite`, `*.db` và file WAL đều nằm trong `.gitignore`, nên `git push` hoặc build frontend không đưa database lên GitHub và không ghi đè Render Disk.

Để thao tác thủ công, dùng Render Shell hoặc công cụ backup của Render trên Persistent Disk. Không sửa trực tiếp file `spa.sqlite` khi server đang chạy; hãy dừng service hoặc tạo bản sao trước, đồng thời giữ cả `spa.sqlite-wal` và `spa.sqlite-shm` nếu chúng tồn tại.

Mở terminal thứ hai:

```bash
npm run dev
```

SQLite được lưu tại `data/spa.sqlite`. API chạy ở `http://localhost:3001`, frontend ở địa chỉ Vite hiển thị trong terminal.

Khi frontend chạy khác domain với backend, tạo biến môi trường `VITE_API_URL`, ví dụ `VITE_API_URL=https://api.example.com`. Chỉ URL bắt đầu bằng `http://` hoặc `https://` mới được chấp nhận; giá trị sai sẽ fallback tới `https://spa-payroll-tracker.onrender.com`. Local vẫn dùng Vite proxy.

Kiểm tra backend sau khi deploy bằng `https://TEN_BACKEND.onrender.com/api/health`; kết quả đúng là `{ "status": "ok" }`. `VITE_API_URL` chỉ chứa origin backend, không thêm `/api` ở cuối.

## Chức năng

- Lưu bảng công và chi tiết dịch vụ.
- Tổng hợp lượt dịch vụ và tiền theo tháng, theo nhân viên.
- Xuất Excel tại nút `Xuất Excel`, gồm bộ lọc, định dạng tiền và cố định dòng tiêu đề.

## Deploy GitHub Pages

1. Tạo repository GitHub tên `spa-payroll-tracker`.
2. Push branch `main` lên repository.
3. Vào `Settings > Pages`, chọn `GitHub Actions` ở phần Build and deployment.
4. Mỗi lần push lên `main`, workflow sẽ build và deploy tự động.

GitHub Pages chỉ deploy frontend. Để dùng SQLite khi deploy thật, cần deploy thêm thư mục `server` lên Render hoặc Railway, sau đó cấu hình URL API cho frontend.
