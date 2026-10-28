import { Accordion, Container } from 'react-bootstrap';
import { faqs } from '../data/mockData.js';

/** Frequently asked questions using the keyboard-accessible Bootstrap accordion. */
export default function FAQ() {
  return (
    <section className="section-space faq-section" id="faq" aria-labelledby="faq-title">
      <Container>
        <div className="faq-layout">
          <div className="faq-intro"><span className="eyebrow">CHÚNG TÔI CÓ THỂ GIÚP GÌ?</span><h2 id="faq-title">Câu hỏi thường gặp</h2><p>Tìm câu trả lời nhanh cho những thắc mắc về việc sử dụng cổng thông tin.</p></div>
          <Accordion className="faq-accordion">
            {faqs.map((faq, index) => (
              <Accordion.Item eventKey={String(index)} key={faq.question}>
                <Accordion.Header>{faq.question}</Accordion.Header>
                <Accordion.Body>{faq.answer}</Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      </Container>
    </section>
  );
}
