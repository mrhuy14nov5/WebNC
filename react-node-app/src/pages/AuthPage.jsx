import { useState } from 'react';
import { Alert, Button, Card, Container, Form, Spinner } from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import api from '../services/api.js';
import { useAuth } from '../services/AuthContext.jsx';

function getErrorMessage(error) {
  return error.response?.data?.message || 'Không thể kết nối máy chủ. Vui lòng thử lại sau.';
}

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { user, loading, error: connectionError, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', major: '', year: '1', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return <main className="auth-loading" aria-live="polite"><Spinner animation="border" role="status"><span className="visually-hidden">Đang kiểm tra phiên đăng nhập</span></Spinner></main>;
  }
  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (isRegister && form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(isRegister ? '/auth/register' : '/auth/login', {
        ...(isRegister ? { name: form.name, major: form.major, year: Number(form.year) } : {}),
        email: form.email,
        password: form.password,
      });
      setUser(data.user);
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header />
      <main className="auth-page">
        <Container>
          <Link to="/" className="back-link"><ArrowLeft aria-hidden="true" /> Về trang chủ</Link>
          <Card className="auth-card">
            <Card.Body>
              <span className="eyebrow">UNIMANAGE · TÀI KHOẢN SINH VIÊN</span>
              <h1 className="destination-title">{isRegister ? 'Tạo tài khoản' : 'Chào mừng trở lại'}</h1>
              <p className="destination-subtitle">
                {isRegister
                  ? 'Đăng ký tài khoản sinh viên để truy cập cổng thông tin.'
                  : 'Đăng nhập bằng email và mật khẩu tài khoản của bạn.'}
              </p>
              {connectionError && <Alert variant="warning">{connectionError}</Alert>}
              {error && <Alert variant="danger" role="alert">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                  {isRegister && (
                    <>
                      <Form.Group className="mb-3" controlId="register-name">
                        <Form.Label>Họ và tên</Form.Label>
                        <Form.Control autoComplete="name" maxLength={120} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                      </Form.Group>
                      <Form.Group className="mb-3" controlId="register-major">
                        <Form.Label>Ngành học</Form.Label>
                        <Form.Control maxLength={120} required value={form.major} onChange={(event) => setForm({ ...form, major: event.target.value })} placeholder="Ví dụ: Công nghệ thông tin" />
                      </Form.Group>
                      <Form.Group className="mb-3" controlId="register-year">
                        <Form.Label>Năm học</Form.Label>
                        <Form.Select required value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })}>
                          {[1, 2, 3, 4, 5, 6].map((year) => <option key={year} value={year}>Năm {year}</option>)}
                        </Form.Select>
                      </Form.Group>
                    </>
                  )}
                  <Form.Group className="mb-3" controlId={`${mode}-email`}>
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" autoComplete="email" maxLength={180} required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId={`${mode}-password`}>
                    <Form.Label>Mật khẩu</Form.Label>
                    <Form.Control type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={8} maxLength={128} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
                    {isRegister && <Form.Text className="text-muted">Mật khẩu cần có ít nhất 8 ký tự.</Form.Text>}
                  </Form.Group>
                  {isRegister && (
                    <Form.Group className="mb-3" controlId="register-confirm-password">
                      <Form.Label>Nhập lại mật khẩu</Form.Label>
                      <Form.Control type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
                    </Form.Group>
                  )}
                  <Button type="submit" className="search-button w-100" disabled={submitting}>
                    {submitting ? <><Spinner size="sm" className="me-2" />Đang xử lý...</> : isRegister ? 'Đăng ký' : 'Đăng nhập'}
                  </Button>
              </Form>
              <p className="auth-switch">
                {isRegister ? <>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></> : <>Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></>}
              </p>
              <p className="auth-footnote">Hiện tại hệ thống hỗ trợ tài khoản sinh viên. Tài khoản giảng viên và quản trị viên cần được cấp riêng.</p>
            </Card.Body>
          </Card>
        </Container>
      </main>
      <Footer />
    </>
  );
}
