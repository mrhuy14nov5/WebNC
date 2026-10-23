import { useMemo } from 'react';
import { Badge, Button, Card, Col, Container, Row } from 'react-bootstrap';
import { ArrowLeft, People, Person } from 'react-bootstrap-icons';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { courses } from '../data/mockData.js';

/** Displays locally-filtered demo course results for the hero search form. */
export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q')?.trim().toLocaleLowerCase('vi') ?? '';
  const faculty = searchParams.get('faculty') ?? '';
  const results = useMemo(() => courses.filter((course) => {
    const matchesQuery = !query || `${course.name} ${course.code} ${course.faculty}`.toLocaleLowerCase('vi').includes(query);
    return matchesQuery && (!faculty || course.faculty === faculty);
  }), [faculty, query]);

  return (
    <>
      <Header />
      <main className="destination-page">
        <Container>
          <Link to="/" className="back-link"><ArrowLeft aria-hidden="true" /> Về trang chủ</Link>
          <span className="eyebrow d-block mt-4">TRA CỨU HỌC PHẦN</span>
          <h1 className="destination-title">Kết quả tìm kiếm</h1>
          <p className="destination-subtitle">
            {query ? <>Từ khóa: <strong>{searchParams.get('q')}</strong></> : 'Các môn học đang mở đăng ký'}
            {faculty && <> · {faculty}</>}
          </p>
          {results.length ? (
            <Row className="g-4">
              {results.map((course) => (
                <Col sm={6} lg={4} key={course.id}>
                  <Card className="course-card h-100">
                    <div className={`course-art course-art-${course.accent}`} aria-hidden="true"><span className="course-art-mark">{course.code.slice(0, 2)}</span><span className="course-art-dots" /></div>
                    <Card.Body className="d-flex flex-column">
                      <div className="course-meta"><Badge bg="light" text="dark">{course.faculty}</Badge><span>{course.code}</span></div>
                      <Card.Title as="h2">{course.name}</Card.Title>
                      <div className="course-details"><span><Person aria-hidden="true" />{course.lecturer}</span><span><People aria-hidden="true" />Còn {course.remaining} chỗ</span></div>
                      <Button as={Link} to={`/courses/${course.id}`} variant="outline-primary" className="mt-auto">Xem chi tiết</Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <div className="empty-search"><h2>Chưa tìm thấy môn học phù hợp</h2><p>Thử từ khóa khác hoặc xem toàn bộ môn học đang mở đăng ký.</p><Button as={Link} to="/search">Xem tất cả môn học</Button></div>
          )}
          <p className="demo-note mt-4">Kết quả được lấy từ dữ liệu mẫu trên giao diện.</p>
        </Container>
      </main>
      <Footer />
    </>
  );
}
