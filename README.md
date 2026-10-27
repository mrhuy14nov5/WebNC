# UniManage · WebNC

Ứng dụng quản lý học tập UniManage dùng React 18, Express, MySQL hoặc SQLite. Node.js 22.13 trở lên.

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

Backend Express khởi tạo schema, học phần mẫu và phiên đăng nhập khi chạy. Nếu không khai báo cấu hình MySQL, dữ liệu được lưu trong SQLite tại `.data/unimanage.sqlite` (được Git bỏ qua). Chạy backend:

```bash
npm run dev:server
```

Trong cửa sổ terminal khác, chạy giao diện bằng `npm run dev`. Vite chuyển tiếp `/api` tới backend tại `http://localhost:3000`. API health trả `database: "local-sqlite"` trong chế độ demo.

Để dùng MySQL thay cho SQLite, sao chép `.env.example` thành `.env` và điền thông tin thật. Khi bật `DB_SSL=true`, chứng chỉ máy chủ luôn được xác minh; `DB_SSL_CA` nhận nội dung CA PEM (có thể dùng `\\n` cho xuống dòng). Không commit `.env`.

Tạo quản trị viên ban đầu bằng cách đặt `ADMIN_EMAIL` và `ADMIN_PASSWORD` (tối thiểu 12 ký tự) trong `.env` trước lần khởi động. Tài khoản có email đó được cấp role `admin`; không có mật khẩu quản trị mặc định. Giữ bí mật thông tin này và đổi mật khẩu sau khi triển khai.

- Đăng ký tạo tài khoản sinh viên và hồ sơ trong MySQL.
- Đăng nhập sử dụng cookie phiên `httpOnly`; mật khẩu được băm bằng `scrypt`, không lưu dạng rõ.
- `/dashboard` hiển thị hồ sơ, vai trò và học phần đã đăng ký; `/admin/students` chỉ dành cho quản trị viên.
- API xác thực: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`.
- API quản lý sinh viên `/api/students` hỗ trợ cả SQLite và MySQL, yêu cầu role quản trị viên.
- API học phần `GET /api/courses`, `GET /api/courses/:id`, `GET /api/courses/mine`, `POST /api/courses/:id/register` và `DELETE /api/courses/:id/register` lưu dữ liệu trong cơ sở dữ liệu và kiểm tra số chỗ.
- API xác thực có CSRF double-submit token, giới hạn tốc độ đăng nhập/đăng ký, cookie phiên httpOnly, và job dọn session hết hạn mỗi giờ.

## Cấu trúc giao diện

- `react-node-app/src/components/`: các thành phần giao diện dùng lại.
- `react-node-app/src/pages/`: landing page và trang kết quả tìm kiếm mẫu.
- `react-node-app/src/data/mockData.js`: nội dung mẫu.
- `react-node-app/src/services/api.js`: Axios instance dùng chung.
- `react-node-app/src/styles/`: biến màu và CSS responsive.

Tài khoản tự đăng ký hiện chỉ có vai trò sinh viên. Tài khoản giảng viên/quản trị viên cần được cấp và phân quyền riêng; không cho phép người dùng tự chọn quyền quản trị khi đăng ký.

## Docker và production

`docker compose up --build` build giao diện Vite rồi chạy Express ở cổng 3000; SQLite được giữ trong volume `app_data`. `npm start` cũng build giao diện trước khi khởi động Express. Trong phát triển, chạy `npm run dev:server` và `npm run dev` ở hai terminal riêng; Vite chạy cổng 5173 và proxy `/api` tới Express cổng 3000.
