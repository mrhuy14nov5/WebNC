import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './app.css';

const emptyStudent = { name: '', email: '', major: '', year: 1 };

function App() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(emptyStudent);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  async function loadStudents(query = search) {
    const response = await fetch(`/api/students?search=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Không thể tải danh sách sinh viên.');
    setStudents(await response.json());
  }

  useEffect(() => { loadStudents().catch((error) => setMessage(error.message)); }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm({ ...form, [name]: name === 'year' ? Number(value) : value });
  }

  async function submitForm(event) {
    event.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/students/${editingId}` : '/api/students';
    const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = response.status === 204 ? null : await response.json();
    if (!response.ok) return setMessage(data.message);
    setForm(emptyStudent);
    setEditingId(null);
    setMessage(editingId ? 'Đã cập nhật sinh viên.' : 'Đã thêm sinh viên.');
    await loadStudents();
  }

  function editStudent(student) {
    setEditingId(student.id);
    setForm({ name: student.name, email: student.email, major: student.major, year: student.year });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function removeStudent(id) {
    if (!window.confirm('Bạn có chắc muốn xóa sinh viên này?')) return;
    const response = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    if (response.ok) { setMessage('Đã xóa sinh viên.'); await loadStudents(); }
  }

  return <main className="page">
    <header className="hero"><p className="eyebrow">WEBNC · REACT + NODE.JS</p><h1>Student registry.</h1><p>Quản lý thông tin sinh viên qua REST API và MySQL.</p></header>
    <section className="workspace">
      <form className="form-panel" onSubmit={submitForm}>
        <div className="panel-heading"><h2>{editingId ? 'Chỉnh sửa' : 'Thêm sinh viên'}</h2>{editingId && <button type="button" className="text-button" onClick={() => { setEditingId(null); setForm(emptyStudent); }}>Hủy</button>}</div>
        <label>Họ và tên<input name="name" value={form.name} onChange={updateField} required /></label>
        <label>Email<input type="email" name="email" value={form.email} onChange={updateField} required /></label>
        <label>Chuyên ngành<input name="major" value={form.major} onChange={updateField} required /></label>
        <label>Năm học<select name="year" value={form.year} onChange={updateField}>{[1, 2, 3, 4, 5, 6].map((year) => <option key={year} value={year}>Năm {year}</option>)}</select></label>
        <button className="primary-button" type="submit">{editingId ? 'Lưu thay đổi' : 'Thêm sinh viên'}</button>
      </form>
      <section className="list-panel"><div className="panel-heading"><div><p className="eyebrow">CRUD DIRECTORY</p><h2>Danh sách sinh viên</h2></div><span className="count">{students.length}</span></div><input className="search" placeholder="Tìm theo tên, email, chuyên ngành..." value={search} onChange={(event) => { setSearch(event.target.value); loadStudents(event.target.value); }} />
        <div className="student-list">{students.length === 0 ? <p className="empty">Chưa có dữ liệu phù hợp.</p> : students.map((student) => <article className="student-row" key={student.id}><div><h3>{student.name}</h3><p>{student.email} · {student.major} · Năm {student.year}</p></div><div className="row-actions"><button onClick={() => editStudent(student)}>Sửa</button><button className="danger" onClick={() => removeStudent(student.id)}>Xóa</button></div></article>)}</div>
      </section>
    </section>
    {message && <p className="toast">{message}</p>}
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);