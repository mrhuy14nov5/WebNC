import { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Row, ToggleButton } from 'react-bootstrap';
import { ArrowRight, People, Person } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import { courses, faculties } from '../data/mockData.js';
import api from '../services/api.js';

/** Featured courses with faculty filters and responsive course cards. */
export default function CourseList() {
  const [activeFaculty, setActiveFaculty] = useState('Tất cả');
  const [courseList, setCourseList] = useState([]);
  const [courseError, setCourseError] = useState('');
  useEffect(() => {
    api.get('/courses').then(({ data }) => setCourseList(data))
      .catch(() => { setCourseList(courses); setCourseError('Không tải được dữ liệu máy chủ; đang hiển thị dữ liệu tham khảo.'); });
  }, []);
  const visibleCourses = activeFaculty === 'Tất cả' ? courseList : courseList.filter((course) => course.faculty === activeFaculty);

  return (
    <section className="section-space courses-section" id="courses" aria-labelledby="courses-title">
      <Container>
        <div className="section-heading course-heading">
          <div><span className="eyebrow">LỰA CHỌN NỔI BẬT</span><h2 id="courses-title">Môn học đang mở đăng ký</h2></div>
          <Link to="/search" className="view-all-link">Xem tất cả môn học <ArrowRight aria-hidden="true" /></Link>
        </div>
        <div className="faculty-filters" aria-label="Lọc môn học theo khoa">
          {faculties.map((faculty) => (
            <ToggleButton
              key={faculty}
              id={`faculty-${faculty.replaceAll(' ', '-').toLowerCase()}`}
              type="radio"
              name="faculty-filter"
              value={faculty}
              checked={activeFaculty === faculty}
              onChange={() => setActiveFaculty(faculty)}
              variant="outline-primary"
              className="faculty-filter"
            >
              {faculty}
            </ToggleButton>
          ))}
        </div>
        {courseError && <Alert variant="warning">{courseError}</Alert>}
        <Row className="g-4">
          {visibleCourses.map((course) => (
            <Col sm={6} xl={3} key={course.id}>
              <Card className="course-card h-100">
                <div className={`course-art course-art-${course.accent}`} aria-hidden="true">
                  <span className="course-art-mark">{course.code.slice(0, 2)}</span>
                  <span className="course-art-dots" />
                </div>
                <Card.Body className="d-flex flex-column">
                  <div className="course-meta"><Badge bg="light" text="dark">{course.faculty}</Badge><span>{course.code}</span></div>
                  <Card.Title as="h3">{course.name}</Card.Title>
                  <div className="course-details">
                    <span><Person aria-hidden="true" />{course.lecturer}</span>
                    <span><People aria-hidden="true" />Còn {course.remaining} chỗ</span>
                  </div>
                  <div className="course-card-footer mt-auto">
                    <span><strong>{course.credits}</strong> tín chỉ</span>
                    <Button as={Link} to={`/courses/${course.id}`} variant="link" aria-label={`Xem chi tiết môn ${course.name}`}>
                      Chi tiết <ArrowRight aria-hidden="true" />
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
          {visibleCourses.length === 0 && <Col><p>Chưa có môn học trong khoa này.</p></Col>}
        </Row>
      </Container>
    </section>
  );
}
