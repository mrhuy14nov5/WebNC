import { Badge, Container, ListGroup } from 'react-bootstrap';
import { ArrowUpRight } from 'react-bootstrap-icons';
import { notices } from '../data/mockData.js';

/** Recent university announcements in an accessible list. */
export default function Notices() {
  return (
    <section className="section-space notices-section" id="notices" aria-labelledby="notices-title">
      <Container>
        <div className="section-heading">
          <div><span className="eyebrow">CẬP NHẬT MỚI NHẤT</span><h2 id="notices-title">Thông báo từ nhà trường</h2></div>
          <a className="view-all-link" href="#notices">Tất cả thông báo <ArrowUpRight aria-hidden="true" /></a>
        </div>
        <ListGroup className="notice-list">
          {notices.map((notice) => (
            <ListGroup.Item className="notice-item" key={notice.title}>
              <div className="notice-main"><Badge bg={notice.variant}>{notice.category}</Badge><h3>{notice.title}</h3></div>
              <time>{notice.date}</time>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Container>
    </section>
  );
}
