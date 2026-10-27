import { Container, Col, Row } from 'react-bootstrap';
import { Envelope, GeoAlt, Telephone } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';

/** Site footer with navigation and university contact information. */
export default function Footer() {
  return (
    <footer className="site-footer">
      <Container>
        <Row className="gy-4 footer-main">
          <Col lg={4}>
            <Link to="/" className="brand-lockup footer-brand"><span className="brand-mark">U</span><span>Uni<span>Manage</span></span></Link>
            <p className="footer-about">Không gian học tập số kết nối cộng đồng Phenikaa, giúp mỗi hành trình học tập trở nên chủ động và hiệu quả hơn.</p>
          </Col>
          <Col sm={6} lg={2}>
            <h2>Khám phá</h2><ul className="footer-links">
              <li><Link to="/">Trang chủ</Link></li><li><Link to="/#courses">Môn học</Link></li><li><Link to="/#notices">Thông báo</Link></li><li><Link to="/#faq">Trợ giúp</Link></li>
            </ul>
          </Col>
          <Col sm={6} lg={3}>
            <h2>Liên hệ</h2><ul className="footer-contact">
              <li><GeoAlt aria-hidden="true" /><span>Đường Nguyễn Văn Trác, Hà Đông, Hà Nội</span></li>
              <li><Telephone aria-hidden="true" /><a href="tel:+842462918118">(024) 6291 8118</a></li>
              <li><Envelope aria-hidden="true" /><a href="mailto:support@phenikaa-uni.edu.vn">support@phenikaa-uni.edu.vn</a></li>
            </ul>
          </Col>
          <Col lg={3}>
            <h2>Thông tin</h2><ul className="footer-links">
              <li><a href="#privacy">Chính sách bảo mật</a></li><li><a href="#terms">Điều khoản sử dụng</a></li><li><a href="https://phenikaa-uni.edu.vn/">Đại học Phenikaa</a></li>
            </ul>
          </Col>
        </Row>
        <div className="footer-bottom"><span>© 2026 UniManage - Nhóm 2 - Đại học Phenikaa. Phát hành theo giấy phép MIT.</span><span>Thiết kế cho cộng đồng Phenikaa</span></div>
      </Container>
    </footer>
  );
}
