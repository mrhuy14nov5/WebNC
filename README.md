# UniManage · WebNC

Ứng dụng quản lý học tập UniManage cho nhóm 2 sinh viên, xây dựng bằng **NestJS 11 + TypeORM 0.3**, React 18, React-Bootstrap; hỗ trợ SQLite (mặc định, qua sql.js) và MySQL. Yêu cầu Node.js 22.13 trở lên.

## Chạy dự án

```bash
npm ci
cp .env.example .env        # Windows: Copy-Item .env.example .env
npm run dev:server          # NestJS API tại http://localhost:3000
# Terminal khác
npm run dev                 # Vite UI tại http://localhost:5173
```

`npm start` build cả frontend và backend rồi chạy một tiến trình tại cổng 3000. `npm run build` chỉ build; `npm test` chạy 25 unit/integration test trên SQLite in-memory.

Tạo quản trị viên ban đầu bằng `ADMIN_EMAIL` và `ADMIN_PASSWORD` (12–128 ký tự) trong `.env`: seeder tạo tài khoản admin nếu email chưa tồn tại (hoặc nâng cấp tài khoản cùng email lên admin), nhưng không ghi đè mật khẩu của admin đã có. `SESSION_SECRET` phải dài tối thiểu 32 ký tự khi production. Không commit `.env`; không có mật khẩu quản trị mặc định trong mã nguồn.

## Cấu hình

| Biến | Ý nghĩa |
|---|---|
| `PORT` | Cổng API, mặc định 3000 |
| `SESSION_SECRET` | Khóa ký JWT HS256 (≥32 ký tự) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Tài khoản quản trị được seed/cập nhật khi khởi động |
| `CORS_ORIGINS` | Allowlist origin, phân tách bằng dấu phẩy |
| `UNIMANAGE_SQLITE_PATH` | Đường dẫn SQLite, mặc định `.data/unimanage.sqlite`; `:memory:` cho test |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Bật MySQL khi cấu hình đủ; hỗ trợ `DB_SSL`, `DB_SSL_CA` |
| `DISABLE_RATE_LIMIT` | Chỉ dùng trong test (`true`) |

## Kiến trúc

- `backend/src/auth/`: đăng ký, đăng nhập, `/me`, logout; JWT trong cookie `httpOnly`, session hash trong DB, guard theo role.
- `backend/src/students/`, `backend/src/lecturers/`, `backend/src/courses/`: module nghiệp vụ dùng TypeORM repository/transaction.
- `backend/src/database/`: entity, schema SQLite/MySQL, migration nhỏ và seeder.
- `backend/src/common/`: validator, CSRF, xử lý lỗi, cookie.
- `backend/src/application.ts`: middleware bảo mật, Swagger, phục vụ SPA build.
- `server.js`: shim khởi động NestJS, export `createServer()` cho test.
- `react-node-app/src/`: React pages/components/services; `react-node-app/test/api.test.cjs`: 25 test.
- `react-node-app/PROJECT_REPORT.md`: báo cáo đồ án (user stories, UML, API, kiểm thử, đạo đức).

## API và tài liệu

Swagger UI: **http://localhost:3000/api/docs** (JSON tại `/api/docs-json`). Cookie phiên là `unimanage_session`; mọi mutation cần CSRF cookie/header double-submit.

Nhóm endpoint chính:

- `POST /api/auth/register|login`, `GET /api/auth/me`, `POST /api/auth/logout`
- `GET /api/courses`, `GET /api/courses/:id`, `GET /api/courses/mine`
- `POST/DELETE /api/courses/:id/register` (sinh viên)
- `POST/PUT/DELETE /api/courses` (admin)
- `GET/POST/PUT/DELETE /api/students` (admin)
- `GET/POST/PUT/DELETE /api/lecturers`, `PUT /api/lecturers/:id/courses`, `GET /api/lecturers/me/courses`
- `GET /api/health`

Giao diện: landing/search/course detail, đăng nhập/đăng ký, dashboard sinh viên và giảng viên, `/admin/students`, `/admin/lecturers`.

## CSDL

Mặc định SQLite tại `.data/unimanage.sqlite` (được Git bỏ qua). MySQL dùng cùng schema chuẩn hóa: `students`, `auth_users`, `auth_sessions`, `courses`, `course_registrations`; khóa ngoại cascade khi xóa sinh viên/khóa học, unique `(student_id, course_id)` chống đăng ký trùng. TypeORM bật transaction khi đăng ký/CRUD giảng viên; MySQL dùng khóa bi quan khi kiểm tra sức chứa.

## Kiểm thử

```bash
npm test
```

25 test bao phủ 17 user stories, phân quyền, CSRF/CORS/JWT, migration mật khẩu scrypt → bcrypt, CRUD học phần/sinh viên/giảng viên và validator. Test dùng SQLite `:memory:`, không sửa dữ liệu `.data`.

## Docker

`docker compose up --build` build Vite + NestJS và chạy tại cổng 3000; SQLite lưu trong volume `app_data`. Khi triển khai production, đặt `SESSION_SECRET`, `ADMIN_*`, `CORS_ORIGINS` và (tùy chọn) cấu hình MySQL trong biến môi trường.

Giấy phép MIT — xem `LICENSE`.
