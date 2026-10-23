import { useState } from 'react';
import { Alert, Button, Card, Col, Container, Row, Spinner } from 'react-bootstrap';
import { BookHalf, BoxArrowRight, Person } from 'react-bootstrap-icons';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../services/AuthContext.jsx';

export default function DashboardPage() {
  const { user, loading, error, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [logoutError, setLogoutError] = useState('');

  if (loading) {
    return <main className="auth-loading" aria-live="polite"><Spinner animation="border" role="status"><span className="visually-hidden">Đang tải tài khoản</span></Spinner></main>;
  }
  if (!user) return <Navigate to="/login" replace />;

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
          {id && <Alert variant="info">Danh mục học phần chi tiết sẽ khả dụng khi có dữ liệu học phần trên backend.</Alert>}
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
                    <div><dt>Ngành học</dt><dd>{user.major}</dd></div>
                    <div><dt>Năm học</dt><dd>Năm {user.year}</dd></div>
                  </dl>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="dashboard-card h-100">
                <Card.Body>
                  <span className="role-icon"><BookHalf aria-hidden="true" /></span>
                  <h2>Học phần</h2>
                  <p>Tra cứu danh mục học phần demo hiện có. Dữ liệu học phần và đăng ký học phần chưa được lưu trong backend.</p>
                  <Button as={Link} to="/search" variant="outline-primary">Khám phá học phần</Button>
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
