import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Container, Form, Spinner, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import api from '../services/api.js';

const emptyForm = { name: '', email: '', major: '', year: '1' };

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const loadStudents = useCallback(() => {
    setLoading(true);
    api.get('/students', { params: { search } })
      .then(({ data }) => setStudents(data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Không thể tải danh sách sinh viên.'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  async function submitStudent(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    const payload = { ...form, year: Number(form.year), email: form.email.trim().toLowerCase() };
    try {
      if (editingId) {
        await api.put(`/students/${editingId}`, payload);
        setNotice('Đã cập nhật hồ sơ sinh viên.');
      } else {
        await api.post('/students', payload);
        setNotice('Đã tạo hồ sơ sinh viên.');
      }
      setForm(emptyForm);
      setEditingId(null);
      loadStudents();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể lưu hồ sơ sinh viên.');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(student) {
    setEditingId(student.id);
    setForm({ name: student.name, email: student.email, major: student.major, year: String(student.year) });
    setError('');
    setNotice('');
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function deleteStudent(id) {
    if (!window.confirm('Bạn có chắc muốn xóa hồ sơ sinh viên này?')) return;
    setError('');
    try {
      await api.delete(`/students/${id}`);
      setStudents((current) => current.filter((student) => student.id !== id));
      setNotice('Đã xóa hồ sơ sinh viên.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể xóa sinh viên.');
    }
  }

  return <>
    <Header />
    <main className="dashboard-page"><Container>
      <Link to="/dashboard" className="back-link">← Trang tổng quan</Link>
      <div className="dashboard-heading mt-4"><div><span className="eyebrow">QUẢN TRỊ HỆ THỐNG</span><h1 className="destination-title">Quản lý sinh viên</h1></div></div>
      {error && <Alert variant="danger">{error}</Alert>}{notice && <Alert variant="success">{notice}</Alert>}
      <Card className="dashboard-card mb-4"><Card.Body><h2>{editingId ? 'Sửa hồ sơ sinh viên' : 'Thêm sinh viên'}</h2><Form onSubmit={submitStudent} className="row g-3">
        <Form.Group className="col-md-6"><Form.Label>Họ và tên</Form.Label><Form.Control required maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Form.Group>
        <Form.Group className="col-md-6"><Form.Label>Email</Form.Label><Form.Control type="email" required maxLength={180} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Form.Group>
        <Form.Group className="col-md-6"><Form.Label>Ngành học</Form.Label><Form.Control required maxLength={120} value={form.major} onChange={(event) => setForm({ ...form, major: event.target.value })} /></Form.Group>
        <Form.Group className="col-md-3"><Form.Label>Năm học</Form.Label><Form.Select value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })}>{[1, 2, 3, 4, 5, 6].map((year) => <option key={year}>{year}</option>)}</Form.Select></Form.Group>
        <div className="col-12"><Button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo sinh viên'}</Button>{editingId && <Button variant="outline-secondary" className="ms-2" onClick={cancelEdit} disabled={saving}>Hủy</Button>}</div>
      </Form></Card.Body></Card>
      <div className="d-flex justify-content-between align-items-center mb-3"><h2>Danh sách sinh viên</h2><Form.Control aria-label="Tìm sinh viên" placeholder="Tìm theo tên, email hoặc ngành" value={search} onChange={(event) => setSearch(event.target.value)} style={{ maxWidth: 360 }} /></div>
      {loading ? <div className="text-center p-5"><Spinner animation="border" role="status"><span className="visually-hidden">Đang tải sinh viên</span></Spinner></div> : <Table responsive striped><thead><tr><th>Họ tên</th><th>Email</th><th>Ngành</th><th>Năm</th><th /></tr></thead><tbody>{students.map((student) => <tr key={student.id}><td>{student.name}</td><td>{student.email}</td><td>{student.major}</td><td>{student.year}</td><td className="text-nowrap"><Button size="sm" variant="outline-secondary" className="me-2" onClick={() => startEdit(student)}>Sửa</Button><Button size="sm" variant="outline-danger" onClick={() => deleteStudent(student.id)}>Xóa</Button></td></tr>)}{students.length === 0 && <tr><td colSpan="5" className="text-center">Không có sinh viên phù hợp.</td></tr>}</tbody></Table>}
    </Container></main>
    <Footer />
  </>;
}
