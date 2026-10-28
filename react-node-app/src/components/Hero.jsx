import { Container } from 'react-bootstrap';
import { ArrowRight, CheckCircleFill } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import SearchBox from './SearchBox.jsx';

/** Landing hero and prominent course-search form. */
export default function Hero() {
  return (
    <section className="hero-section" aria-labelledby="hero-title">
      <Container className="hero-container">
        <div className="hero-copy">
          <span className="hero-eyebrow"><CheckCircleFill aria-hidden="true" /> CỔNG THÔNG TIN ĐÀO TẠO</span>
          <h1 id="hero-title">Quản lý học tập dễ dàng,<br className="d-none d-md-block" /> mọi lúc mọi nơi</h1>
          <p>Một không gian thống nhất để kết nối sinh viên, giảng viên và hành trình học tập tại Phenikaa.</p>
          <Link className="hero-text-link" to="/#roles">Khám phá cổng thông tin <ArrowRight aria-hidden="true" /></Link>
        </div>
        <SearchBox />
      </Container>
    </section>
  );
}
