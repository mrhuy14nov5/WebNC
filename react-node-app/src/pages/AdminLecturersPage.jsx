import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Container, Form, Modal, Spinner, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import api from '../services/api.js';

const emptyForm = { name: '', email: '', faculty: '', password: '' };

export default function AdminLecturersPage() {
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [assigning, setAssigning] = useState(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [assignSaving, setAssignSaving] = useState(false);

  const loadLecturers = useCallback(() => {
    setLoading(true);
    api.get('/lecturers', { params: { search } })
      .then(({ data }) => setLecturers(data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Không thể tải danh sách giảng viên.'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { loadLecturers(); }, [loadLecturers]);
  useEffect(() => {
    api.get('/courses')
      .then(({ data }) => setCourses(data))
      .catch(() => setError('Không thể tải danh sách học phần.'));
  }, []);

  async function submitLecturer(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      if (editingId) {
        await api.put(`/lecturers/${editingId}`, form);
        setNotice('Đã cập nhật tài khoản giảng viên.');
      } else {
        await api.post('/lecturers', form);
        setNotice('Đã tạo tài khoản giảng viên.');
      }
      setForm(emptyForm);
      setEditingId(null);
      loadLecturers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể lưu tài khoản giảng viên.');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(lecturer) {
    setEditingId(lecturer.id);
    setForm({ name: lecturer.name, email: lecturer.email, faculty: lecturer.faculty, password: '' });
    setError('');
    setNotice('');
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function deleteLecturer(lecturer) {
    if (!window.confirm(`Bạn có chắc muốn xóa tài khoản giảng viên ${lecturer.name}?`)) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/lecturers/${lecturer.id}`);
      setNotice('Đã xóa tài khoản giảng viên.');
      loadLecturers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể xóa giảng viên.');
    }
  }

  function openAssignment(lecturer) {
    setAssigning(lecturer);
    setSelectedCourseIds(lecturer.courseIds || []);
    setError('');
    setNotice('');
  }

  function toggleCourse(courseId) {
    setSelectedCourseIds((current) => (current.includes(courseId)
      ? current.filter((id) => id !== courseId)
      : [...current, courseId]));
  }

  async function saveAssignment() {
    if (!assigning) return;
    setAssignSaving(true);
    setError('');
    setNotice('');
    try {
      await api.put(`/lecturers/${assigning.id}/courses`, { courseIds: selectedCourseIds });
      setNotice(`Đã cập nhật học phần phụ trách của ${assigning.name}.`);
      setAssigning(null);
      loadLecturers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể phân công học phần.');
    } finally {
      setAssignSaving(false);
    }
  }

  return <>
    <Header />
    <main className="dashboard-page"><Container>
      <Link to="/dashboard" className="back-link">← Trang tổng quan</Link>
      <div className="dashboard-heading mt-4"><div><span className="eyebrow">QUẢN TRỊ HỆ THỐNG</span><h1 className="destination-title">Quản lý giảng viên</h1></div></div>
      {error && <Alert variant="danger">{error}</Alert>}{notice && <Alert variant="success">{notice}</Alert>}
      <Card className="dashboard-card mb-4"><Card.Body><h2>{editingId ? 'Sửa tài khoản giảng viên' : 'Thêm giảng viên'}</h2><Form onSubmit={submitLecturer} className="row g-3">
        <Form.Group className="col-md-6"><Form.Label>Họ và tên</Form.Label><Form.Control required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Form.Group>
        <Form.Group className="col-md-6"><Form.Label>Email</Form.Label><Form.Control type="email" required maxLength={180} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Form.Group>
        <Form.Group className="col-md-6"><Form.Label>Khoa/Bộ môn</Form.Label><Form.Control required maxLength={120} value={form.faculty} onChange={(event) => setForm({ ...form, faculty: event.target.value })} /></Form.Group>
        <Form.Group className="col-md-6"><Form.Label>Mật khẩu {editingId ? '(để trống nếu không đổi)' : ''}</Form.Label><Form.Control type="password" required={!editingId} minLength={8} maxLength={128} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></Form.Group>
        <div className="col-12"><Button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo giảng viên'}</Button>{editingId && <Button variant="outline-secondary" className="ms-2" onClick={cancelEdit} disabled={saving}>Hủy</Button>}</div>
      </Form></Card.Body></Card>
      <div className="d-flex justify-content-between align-items-center mb-3"><h2>Danh sách giảng viên</h2><Form.Control aria-label="Tìm giảng viên" placeholder="Tìm theo tên, email hoặc khoa" value={search} onChange={(event) => setSearch(event.target.value)} style={{ maxWidth: 360 }} /></div>
      {loading ? <div className="text-center p-5"><Spinner animation="border" role="status"><span className="visually-hidden">Đang tải giảng viên</span></Spinner></div> : <Table responsive striped><thead><tr><th>Họ tên</th><th>Email</th><th>Khoa/Bộ môn</th><th>Học phần phụ trách</th><th /></tr></thead><tbody>{lecturers.map((lecturer) => <tr key={lecturer.id}><td>{lecturer.name}</td><td>{lecturer.email}</td><td>{lecturer.faculty}</td><td>{lecturer.courseCodes.length ? lecturer.courseCodes.join(', ') : '—'}</td><td className="text-nowrap"><Button size="sm" variant="outline-primary" className="me-2" onClick={() => openAssignment(lecturer)}>Phân công</Button><Button size="sm" variant="outline-secondary" className="me-2" onClick={() => startEdit(lecturer)}>Sửa</Button><Button size="sm" variant="outline-danger" onClick={() => deleteLecturer(lecturer)}>Xóa</Button></td></tr>)}{lecturers.length === 0 && <tr><td colSpan="5" className="text-center">Không có giảng viên phù hợp.</td></tr>}</tbody></Table>}
    </Container></main>
    <Footer />
    <Modal show={Boolean(assigning)} onHide={() => setAssigning(null)} size="lg">
      <Modal.Header closeButton><Modal.Title>Phân công học phần · {assigning?.name}</Modal.Title></Modal.Header>
      <Modal.Body>
        {courses.length === 0 ? <p className="mb-0">Chưa có học phần nào trong hệ thống.</p> : courses.map((course) => <Form.Check key={course.id} type="checkbox" id={`assign-${course.id}`} className="mb-2" label={`${course.code} · ${course.name}`} checked={selectedCourseIds.includes(course.id)} onChange={() => toggleCourse(course.id)} />)}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={() => setAssigning(null)} disabled={assignSaving}>Hủy</Button>
        <Button onClick={saveAssignment} disabled={assignSaving}>{assignSaving ? 'Đang lưu...' : 'Lưu phân công'}</Button>
      </Modal.Footer>
    </Modal>
  </>;
}
