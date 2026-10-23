# UniManage · WebNC

Landing page React 18 cho hệ thống quản lý học tập UniManage, đồ án môn Web nâng cao - Đại học Phenikaa. Dữ liệu môn học, số liệu và thông báo trên landing page hiện là dữ liệu mẫu giả lập.

## Chạy giao diện

Yêu cầu Node.js 22 trở lên.

```bash
npm install
npm run dev
```

Vite sẽ in địa chỉ local sau khi khởi động (mặc định `http://localhost:5173`). Tạo file `.env` từ `.env.example` nếu cần cấu hình API:

```env
VITE_API_URL=/api
```

Build giao diện:

```bash
npm run build
```

## Backend và đăng nhập

Backend Express khởi tạo bảng tài khoản và phiên đăng nhập khi chạy. Cần Node.js 22.13 trở lên. Để dùng ngay cho demo, không cần cấu hình database: backend tự lưu dữ liệu bền vững trong `.data/unimanage.sqlite` (được Git bỏ qua). Chạy backend:

```bash
npm run dev:server
```

Trong cửa sổ terminal khác, chạy giao diện bằng `npm run dev`. Vite chuyển tiếp `/api` tới backend tại `http://localhost:3000`. API health trả `database: "local-sqlite"` trong chế độ demo.

Để dùng MySQL thay cho SQLite, sao chép `.env.example` thành `.env`, điền thông tin MySQL thật rồi khởi động lại backend. Không commit `.env`.

- Đăng ký tạo tài khoản sinh viên và hồ sơ trong MySQL.
- Đăng nhập sử dụng cookie phiên `httpOnly`; mật khẩu được băm bằng `scrypt`, không lưu dạng rõ.
- `/dashboard` hiển thị hồ sơ sinh viên lấy từ backend; có thể đăng xuất từ thanh điều hướng.
- API xác thực: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`.
- Endpoint quản lý sinh viên hiện có: `/api/students` (yêu cầu tài khoản được cấp vai trò quản trị viên).
- API quản lý sinh viên và endpoint đăng ký học phần hiện chưa có triển khai đầy đủ trong chế độ SQLite demo.
- Danh mục, tìm kiếm và đăng ký học phần trên giao diện vẫn đang dùng dữ liệu mẫu; backend chưa có schema/API cho các nghiệp vụ học phần.

## Cấu trúc giao diện

- `react-node-app/src/components/`: các thành phần giao diện dùng lại.
- `react-node-app/src/pages/`: landing page và trang kết quả tìm kiếm mẫu.
- `react-node-app/src/data/mockData.js`: nội dung mẫu.
- `react-node-app/src/services/api.js`: Axios instance dùng chung.
- `react-node-app/src/styles/`: biến màu và CSS responsive.

Tài khoản tự đăng ký hiện chỉ có vai trò sinh viên. Tài khoản giảng viên/quản trị viên cần được cấp và phân quyền riêng; không cho phép người dùng tự chọn quyền quản trị khi đăng ký.
