import { useEffect, useState } from 'react';
import { Alert, Button, Card, Container, Spinner } from 'react-bootstrap';
import { ArrowLeft, People, Person } from 'react-bootstrap-icons';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import api from '../services/api.js';
import { useAuth } from '../services/AuthContext.jsx';

export default function CourseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get(`/courses/${encodeURIComponent(id)}`), user?.role === 'student' ? api.get('/courses/mine') : Promise.resolve({ data: [] })])
      .then(([courseResponse, registrationsResponse]) => {
        setCourse(courseResponse.data);
        setRegistered(registrationsResponse.data.some((item) => item.id === id));
      })
      .catch((requestError) => setError(requestError.response?.status === 404 ? 'Không tìm thấy học phần.' : 'Không thể tải thông tin học phần.'))
      .finally(() => setLoading(false));
  }, [id, user]);

  async function handleRegistration() {
    setError('');
    setMessage('');
    try {
      if (registered) {
        await api.delete(`/courses/${encodeURIComponent(id)}/register`);
        setRegistered(false);
        setMessage('Đã hủy đăng ký học phần.');
      } else {
        await api.post(`/courses/${encodeURIComponent(id)}/register`);
        setRegistered(true);
        setCourse((current) => ({ ...current, enrolled: current.enrolled + 1, remaining: current.remaining - 1 }));
        setMessage('Đăng ký học phần thành công.');
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể cập nhật đăng ký. Vui lòng thử lại.');
    }
  }

  return <>
    <Header />
    <main className="destination-page"><Container>
      <Link to="/search" className="back-link"><ArrowLeft aria-hidden="true" /> Danh sách học phần</Link>
      {loading ? <div className="text-center p-5"><Spinner animation="border" role="status"><span className="visually-hidden">Đang tải học phần</span></Spinner></div> : error && !course ? <Alert className="mt-4" variant="danger">{error}</Alert> : course && <Card className="dashboard-card mt-4"><Card.Body>
        <span className="eyebrow">{course.faculty} · {course.code}</span>
        <h1 className="destination-title mt-2">{course.name}</h1>
        <p className="destination-subtitle">{course.description}</p>
        <div className="course-details my-4"><span><Person aria-hidden="true" />{course.lecturer}</span><span><People aria-hidden="true" />Còn {course.remaining} chỗ · {course.credits} tín chỉ</span></div>
        {error && <Alert variant="danger">{error}</Alert>}{message && <Alert variant="success">{message}</Alert>}
        {user?.role === 'student' ? <Button disabled={!registered && course.remaining <= 0} onClick={handleRegistration}>{registered ? 'Hủy đăng ký' : 'Đăng ký học phần'}</Button> : user ? <Alert variant="info">Tài khoản của bạn không có quyền đăng ký học phần.</Alert> : <Button as={Link} to="/login">Đăng nhập để đăng ký</Button>}
      </Card.Body></Card>}
    </Container></main>
    <Footer />
  </>;
}
