import { useState } from 'react';
import { Alert, Button, Container, Nav, Navbar } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { BookHalf } from 'react-bootstrap-icons';
import { useAuth } from '../services/AuthContext.jsx';

/** Primary responsive navigation for the UniManage landing page. */
export default function Header() {
  const { user, loading, error, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState('');

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
    <header>
      <Navbar expand="lg" variant="dark" sticky="top" className="site-navbar">
        <Container>
          <Navbar.Brand as={Link} to="/" className="brand-lockup" aria-label="UniManage - Trang chủ">
            <span className="brand-mark"><BookHalf aria-hidden="true" /></span>
            <span>Uni<span>Manage</span></span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-navigation" aria-label="Mở menu điều hướng" />
          <Navbar.Collapse id="main-navigation">
            <Nav className="mx-auto main-nav">
              <Nav.Link as={Link} to="/">Trang chủ</Nav.Link>
              <Nav.Link href="/#courses">Môn học</Nav.Link>
              <Nav.Link href="/#notices">Thông báo</Nav.Link>
              <Nav.Link href="/#faq">Hỗ trợ</Nav.Link>
            </Nav>
            <div className="navbar-actions">
              {user ? (
                <>
                  <Button as={Link} to="/dashboard" variant="outline-light" className="login-button">{user.name}</Button>
                  <Button variant="light" className="register-button" onClick={handleLogout}>Đăng xuất</Button>
                </>
              ) : (
                <>
                  <Button as={Link} to="/login" variant="outline-light" className="login-button" disabled={loading}>Đăng nhập</Button>
                  <Button as={Link} to="/register" variant="light" className="register-button" disabled={loading}>Đăng ký</Button>
                </>
              )}
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      {error && <Alert variant="warning" className="connection-notice" role="status">{error}</Alert>}
      {logoutError && <Alert variant="danger" className="connection-notice" role="alert">{logoutError}</Alert>}
    </header>
  );
}
