import { Button, Container, Nav, Navbar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { BookHalf } from 'react-bootstrap-icons';

/** Primary responsive navigation for the UniManage landing page. */
export default function Header() {
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
              <Button as={Link} to="/login" variant="outline-light" className="login-button">Đăng nhập</Button>
              <Button as={Link} to="/register" variant="light" className="register-button">Đăng ký</Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
}
