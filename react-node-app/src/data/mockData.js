import {
  BookHalf,
  ClipboardCheck,
  PersonBadge,
} from 'react-bootstrap-icons';

/** Demo-only content; all people, course capacity figures, and notices are fictional. */
export const roles = [
  {
    name: 'Sinh viên',
    description: 'Chủ động theo dõi hành trình học tập của bạn.',
    icon: BookHalf,
    features: ['Đăng ký học phần', 'Xem thời khóa biểu', 'Theo dõi điểm và GPA'],
  },
  {
    name: 'Giảng viên',
    description: 'Quản lý lớp học và hỗ trợ sinh viên hiệu quả.',
    icon: PersonBadge,
    features: ['Xem lớp phụ trách', 'Nhập và cập nhật điểm', 'Điểm danh trực tuyến'],
  },
  {
    name: 'Quản trị viên',
    description: 'Vận hành dữ liệu đào tạo trong một nơi duy nhất.',
    icon: ClipboardCheck,
    features: ['Quản lý hồ sơ sinh viên', 'Phân quyền tài khoản', 'Báo cáo thống kê'],
  },
];

export const faculties = ['Tất cả', 'Công nghệ thông tin', 'Kinh tế', 'Kỹ thuật'];

export const semesters = ['Học kỳ 1 · 2026–2027', 'Học kỳ 2 · 2025–2026', 'Học kỳ hè · 2025–2026'];

export const courses = [
  {
    id: 'web-301',
    name: 'Phát triển ứng dụng Web nâng cao',
    code: 'WEB301',
    credits: 3,
    lecturer: 'ThS. Nguyễn Minh Anh',
    remaining: 12,
    faculty: 'Công nghệ thông tin',
    accent: 'blue',
  },
  {
    id: 'data-210',
    name: 'Cơ sở dữ liệu nâng cao',
    code: 'IT210',
    credits: 3,
    lecturer: 'TS. Trần Hoàng Nam',
    remaining: 8,
    faculty: 'Công nghệ thông tin',
    accent: 'violet',
  },
  {
    id: 'eco-201',
    name: 'Kinh tế vi mô',
    code: 'ECO201',
    credits: 3,
    lecturer: 'ThS. Lê Thu Hà',
    remaining: 18,
    faculty: 'Kinh tế',
    accent: 'gold',
  },
  {
    id: 'eng-115',
    name: 'Nhập môn kỹ thuật cơ điện tử',
    code: 'ENG115',
    credits: 2,
    lecturer: 'TS. Phạm Quốc Huy',
    remaining: 5,
    faculty: 'Kỹ thuật',
    accent: 'teal',
  },
];

export const stats = [
  { value: '12.000+', label: 'Sinh viên', detail: 'đang học tập' },
  { value: '650+', label: 'Giảng viên', detail: 'đồng hành mỗi ngày' },
  { value: '180+', label: 'Môn học', detail: 'trong chương trình' },
  { value: '420+', label: 'Lớp học phần', detail: 'mỗi năm học' },
];

export const steps = [
  { title: 'Đăng nhập', description: 'Truy cập tài khoản của bạn', number: '01' },
  { title: 'Chọn học phần', description: 'Tìm môn phù hợp kế hoạch', number: '02' },
  { title: 'Xác nhận', description: 'Kiểm tra và hoàn tất đăng ký', number: '03' },
  { title: 'Xem kết quả', description: 'Theo dõi trạng thái tức thì', number: '04' },
];

export const notices = [
  {
    title: 'Mở đăng ký học phần học kỳ 1 năm học 2026–2027',
    date: '20/10/2026',
    category: 'Đào tạo',
    variant: 'primary',
  },
  {
    title: 'Cập nhật lịch sinh hoạt công dân đầu khóa',
    date: '18/10/2026',
    category: 'Sinh viên',
    variant: 'success',
  },
  {
    title: 'Bảo trì cổng thông tin vào tối thứ Bảy',
    date: '15/10/2026',
    category: 'Hệ thống',
    variant: 'warning',
  },
  {
    title: 'Hướng dẫn sử dụng hệ thống quản lý học tập',
    date: '12/10/2026',
    category: 'Hướng dẫn',
    variant: 'info',
  },
];

export const faqs = [
  {
    question: 'Làm thế nào để đăng ký học phần?',
    answer:
      'Đăng nhập cổng thông tin, chọn mục Học phần, tìm lớp còn chỗ và xác nhận đăng ký. Hệ thống sẽ hiển thị kết quả ngay sau khi hoàn tất.',
  },
  {
    question: 'Tôi có thể xem thời khóa biểu ở đâu?',
    answer:
      'Thời khóa biểu được cập nhật trong mục Lịch học sau khi đăng nhập. Bạn có thể xem theo tuần hoặc theo học kỳ.',
  },
  {
    question: 'Tôi cần làm gì nếu thông tin cá nhân chưa chính xác?',
    answer:
      'Gửi yêu cầu cập nhật đến Phòng Công tác sinh viên hoặc liên hệ bộ phận hỗ trợ để được hướng dẫn xác minh.',
  },
  {
    question: 'Quên mật khẩu thì xử lý thế nào?',
    answer:
      'Sử dụng chức năng khôi phục mật khẩu tại trang đăng nhập hoặc liên hệ bộ phận hỗ trợ qua email support@phenikaa-uni.edu.vn.',
  },
  {
    question: 'Tôi có thể liên hệ hỗ trợ qua đâu?',
    answer:
      'Gửi email tới support@phenikaa-uni.edu.vn hoặc gọi số (024) 6291 8118 trong giờ hành chính.',
  },
];
