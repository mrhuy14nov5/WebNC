import { Button, Container } from 'react-bootstrap';
import { ArrowLeft } from 'react-bootstrap-icons';
import { Link, useLocation } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

/** Informs visitors which authenticated/backend-backed page is the next integration step. */
export default function DestinationPage({ title }) {
  const location = useLocation();
  const isMissing = title === 'Không tìm thấy trang';

  return (
    <>
      <Header />
      <main className="destination-page">
        <Container>
          <div className="destination-message">
            <span className="eyebrow">UNIMANAGE · PHENIKAA</span>
            <h1 className="destination-title">{title}</h1>
            <p className="destination-subtitle">
              {isMissing
                ? 'Địa chỉ này không tồn tại. Bạn có thể quay lại trang chủ để tiếp tục khám phá.'
                : `Trang ${title.toLocaleLowerCase('vi')} sẽ được hoàn thiện khi kết nối với hệ thống backend.`}
            </p>
            <p className="destination-path">Đường dẫn: {location.pathname}</p>
            <Button as={Link} to="/" className="search-button"><ArrowLeft aria-hidden="true" className="me-2" />Về trang chủ</Button>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
