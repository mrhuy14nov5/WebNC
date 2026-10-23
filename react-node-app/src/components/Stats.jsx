import { Col, Container, Row } from 'react-bootstrap';
import { stats } from '../data/mockData.js';

/** At-a-glance demo statistics for the university learning portal. */
export default function Stats() {
  return (
    <section className="stats-section" aria-labelledby="stats-title">
      <Container>
        <div className="stats-heading"><span className="eyebrow">PHENIKAA UNIVERSITY</span><h2 id="stats-title">Cùng nhau tạo nên một cộng đồng học tập</h2></div>
        <Row className="g-0 stats-grid">
          {stats.map((stat) => (
            <Col xs={6} lg={3} key={stat.label}>
              <div className="stat-item"><strong>{stat.value}</strong><span>{stat.label}</span><small>{stat.detail}</small></div>
            </Col>
          ))}
        </Row>
        <p className="demo-note">Số liệu minh họa cho giao diện mẫu.</p>
      </Container>
    </section>
  );
}
