import { Button, Card, Col, Container, Row } from 'react-bootstrap';
import { ArrowUpRight, Check2 } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import { roles } from '../data/mockData.js';

/** Role-based entry points with a short list of key capabilities. */
export default function RoleCards() {
  return (
    <section className="section-space roles-section" id="roles" aria-labelledby="roles-title">
      <Container>
        <div className="section-heading">
          <div><span className="eyebrow">MỘT CỔNG THÔNG TIN · NHIỀU TRẢI NGHIỆM</span><h2 id="roles-title">Bạn đang tìm điều gì?</h2></div>
          <p>Chọn vai trò để khám phá những công cụ phù hợp với bạn.</p>
        </div>
        <Row className="g-4">
          {roles.map(({ name, description, icon: Icon, features }, index) => (
            <Col md={4} key={name}>
              <Card className={`role-card role-card-${index + 1} h-100`}>
                <Card.Body>
                  <span className="role-icon"><Icon aria-hidden="true" /></span>
                  <div className="role-card-title"><h3>{name}</h3><ArrowUpRight aria-hidden="true" /></div>
                  <p className="role-description">{description}</p>
                  <ul className="feature-list">
                    {features.map((feature) => <li key={feature}><Check2 aria-hidden="true" />{feature}</li>)}
                  </ul>
                  <Button as={Link} to={`/login?role=${encodeURIComponent(name)}`} variant="outline-primary" className="role-link">
                    Vào cổng thông tin <ArrowUpRight aria-hidden="true" />
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}
