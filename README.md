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

## Backend hiện có

Backend Express/MySQL của repository vẫn được giữ nguyên. Cấu hình các biến database trong `.env`, sau đó chạy backend bằng:

```bash
npm run dev:server
```

Không commit file `.env`. Axios instance tại `react-node-app/src/services/api.js` bật `withCredentials` để backend NestJS có thể dùng cookie `httpOnly`; landing page hiện chưa gọi API.

## Cấu trúc giao diện

- `react-node-app/src/components/`: các thành phần giao diện dùng lại.
- `react-node-app/src/pages/`: landing page và trang kết quả tìm kiếm mẫu.
- `react-node-app/src/data/mockData.js`: nội dung mẫu.
- `react-node-app/src/services/api.js`: Axios instance dùng chung.
- `react-node-app/src/styles/`: biến màu và CSS responsive.

## Tích hợp NestJS tiếp theo

Triển khai các route `/login`, `/register`, `/search` và `/courses/:id`; thay dữ liệu mẫu bằng API NestJS qua Axios instance. Cấu hình `VITE_API_URL` trỏ đến API, bật CORS credentials phía backend cho đúng origin frontend, và dùng cookie `httpOnly`, `Secure`, `SameSite` phù hợp. Không lưu token hoặc dữ liệu xác thực trong Web Storage.
