import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, Row } from 'react-bootstrap';
import { BookHalf, BoxArrowRight, Person } from 'react-bootstrap-icons';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../services/AuthContext.jsx';
import api from '../services/api.js';

export default function DashboardPage() {
  const { user, error, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [courseError, setCourseError] = useState('');

  useEffect(() => {
    if (user?.role !== 'student') return;
    api.get('/courses/mine').then(({ data }) => setRegistrations(data))
      .catch(() => setCourseError('Không thể tải danh sách học phần đã đăng ký.'));
  }, [user]);

  async function handleLogout() {
    setLogoutError('');
    try {
      await logout();
      navigate('/', { replace: true });
    } catch {
      setLogoutError('Không thể đăng xuất khỏi máy chủ. Vui lòng thử lại.');
    }
  }

  return (
    <>
      <Header />
      <main className="dashboard-page">
        <Container>
          {error && <Alert variant="warning">{error}</Alert>}
          {logoutError && <Alert variant="danger" role="alert">{logoutError}</Alert>}
          <div className="dashboard-heading">
            <div><span className="eyebrow">CỔNG THÔNG TIN SINH VIÊN</span><h1 className="destination-title">Xin chào, {user.name}</h1><p className="destination-subtitle">Thông tin tài khoản của bạn được tải từ máy chủ.</p></div>
            <Button variant="outline-secondary" onClick={handleLogout}><BoxArrowRight aria-hidden="true" className="me-2" />Đăng xuất</Button>
          </div>
          <Row className="g-4">
            <Col md={6}>
              <Card className="dashboard-card h-100">
                <Card.Body>
                  <span className="role-icon"><Person aria-hidden="true" /></span>
                  <h2>Hồ sơ sinh viên</h2>
                  <dl className="profile-list">
                    <div><dt>Họ và tên</dt><dd>{user.name}</dd></div>
                    <div><dt>Email</dt><dd>{user.email}</dd></div>
                    {user.role === 'student' && <><div><dt>Ngành học</dt><dd>{user.major}</dd></div><div><dt>Năm học</dt><dd>Năm {user.year}</dd></div></>}
                    <div><dt>Vai trò</dt><dd>{user.role === 'admin' ? 'Quản trị viên' : user.role === 'lecturer' ? 'Giảng viên' : 'Sinh viên'}</dd></div>
                  </dl>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="dashboard-card h-100">
                <Card.Body>
                  <span className="role-icon"><BookHalf aria-hidden="true" /></span>
                  {user.role === 'admin' ? <><h2>Quản trị</h2><p>Quản lý hồ sơ sinh viên và tra cứu dữ liệu hệ thống.</p><Button as={Link} to="/admin/students" variant="outline-primary">Quản lý sinh viên</Button></> : <><h2>Học phần đã đăng ký</h2><p>{courseError || (registrations.length ? registrations.map((course) => `${course.code} · ${course.name}`).join(' — ') : 'Bạn chưa đăng ký học phần nào.')}</p><Button as={Link} to="/search" variant="outline-primary">Khám phá học phần</Button></>}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </main>
      <Footer />
    </>
  );
}
