# WebNC

## Công nghệ

- **Backend:** Node.js, Express, MySQL2
- **Frontend:** React 19, Vite
- **Database:** MySQL Aiven qua TLS

## Development container

Tạo file `.env` từ `.env.example`, điền password Aiven, sau đó mở thư mục này bằng VS Code và chọn **Reopen in Container**. Dev container sẽ khởi động:

- Node.js 22 với ứng dụng Express tại `http://localhost:3000`
- Kết nối TLS tới MySQL Aiven từ các biến `DB_*`

## Chạy dự án

```bash
npm install
npm run build
npm start
```

Mở `http://localhost:3000`. Trong lúc phát triển frontend, có thể chạy thêm `npm run client` và mở `http://localhost:5173`; Vite sẽ proxy các request `/api` sang backend.

Server tự tạo bảng `students` từ [database/schema.sql](database/schema.sql) khi khởi động.

## CRUD students

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| GET | `/api/students` | Lấy danh sách sinh viên |
| GET | `/api/students/:id` | Lấy một sinh viên |
| POST | `/api/students` | Thêm sinh viên |
| PUT | `/api/students/:id` | Cập nhật sinh viên |
| DELETE | `/api/students/:id` | Xóa sinh viên |

Request tạo/cập nhật cần có `name`, `email`, `major`, `year`. Có thể tìm kiếm bằng `GET /api/students?search=react`.

Kiểm tra kết nối ứng dụng và database tại `GET /api/health`.