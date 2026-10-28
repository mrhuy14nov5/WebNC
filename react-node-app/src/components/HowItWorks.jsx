import { Container } from 'react-bootstrap';
import { ArrowRight, Check2Circle, DoorOpen, Search, ShieldCheck } from 'react-bootstrap-icons';
import { steps } from '../data/mockData.js';

const stepIcons = [DoorOpen, Search, ShieldCheck, Check2Circle];

/** Four-step overview designed to keep the main enrollment flow simple. */
export default function HowItWorks() {
  return (
    <section className="section-space how-section" aria-labelledby="how-title">
      <Container>
        <div className="section-heading">
          <div><span className="eyebrow">BẮT ĐẦU THẬT ĐƠN GIẢN</span><h2 id="how-title">Bốn bước, sẵn sàng cho học kỳ mới</h2></div>
          <p>Quy trình đăng ký gọn gàng, rõ ràng từ đầu đến cuối.</p>
        </div>
        <div className="steps-grid">
          {steps.map((step, index) => {
            const Icon = stepIcons[index];
            return (
              <article className="step-item" key={step.number}>
                <div className="step-icon-wrap"><span>{step.number}</span><Icon aria-hidden="true" /></div>
                <h3>{step.title}</h3><p>{step.description}</p>
                {index < steps.length - 1 && <ArrowRight className="step-arrow" aria-hidden="true" />}
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
