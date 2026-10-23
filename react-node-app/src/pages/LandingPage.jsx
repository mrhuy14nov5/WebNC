import { Container } from 'react-bootstrap';
import { ArrowRight } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Hero from '../components/Hero.jsx';
import RoleCards from '../components/RoleCards.jsx';
import CourseList from '../components/CourseList.jsx';
import Stats from '../components/Stats.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import Notices from '../components/Notices.jsx';
import FAQ from '../components/FAQ.jsx';
import Footer from '../components/Footer.jsx';

/** Composes all sections of the UniManage public landing page. */
export default function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <RoleCards />
        <CourseList />
        <Stats />
        <HowItWorks />
        <section className="registration-cta">
          <Container className="registration-cta-inner">
            <div><span className="eyebrow">HỌC KỲ MỚI ĐANG CHỜ BẠN</span><h2>Sẵn sàng cho bước tiếp theo?</h2><p>Khám phá các học phần và lên kế hoạch học tập của bạn.</p></div>
            <Link to="/search" className="cta-button">Tìm môn học <ArrowRight aria-hidden="true" /></Link>
          </Container>
        </section>
        <Notices />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
