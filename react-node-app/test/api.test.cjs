const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { once } = require('node:events');

process.env.UNIMANAGE_SQLITE_PATH = ':memory:';
process.env.ADMIN_EMAIL = `admin-${process.pid}@example.test`;
process.env.ADMIN_PASSWORD = 'Admin-Test-Password-2026';

const { app, initialize } = require('../../server');

let server;
let baseUrl;
let admin;
let primaryEmail;
let crudStudentId;
const adminPassword = process.env.ADMIN_PASSWORD;
const capacityCourseId = `test-capacity-${process.pid}`;

function createClient() {
  const cookies = new Map();
  let csrfToken = '';

  return {
    async request(path, { method = 'GET', body, csrf = true } = {}) {
      const headers = { Accept: 'application/json' };
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      if (cookies.size) headers.Cookie = [...cookies].map(([name, value]) => `${name}=${value}`).join('; ');
      if (csrf && csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) headers['X-CSRF-Token'] = csrfToken;

      const response = await fetch(`${baseUrl}/api${path}`, {
        method,
        headers,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      for (const cookie of response.headers.getSetCookie()) {
        const [pair] = cookie.split(';', 1);
        const separator = pair.indexOf('=');
        if (separator > 0) cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
      }
      const data = response.status === 204 ? null : await response.json();
      if (path === '/auth/csrf' && response.ok) csrfToken = data.csrfToken;
      return { response, data };
    },
    getCookie(name) {
      return cookies.get(name);
    },
    setCookie(name, value) {
      cookies.set(name, value);
    },
  };
}

async function createStudentClient(email = primaryEmail) {
  const client = createClient();
  await client.request('/auth/csrf');
  const { response } = await client.request('/auth/login', {
    method: 'POST',
    body: { email, password: 'Student-Test-Password-2026' },
  });
  assert.equal(response.status, 200);
  return client;
}

before(async () => {
  await initialize;
  const database = require('../../database/localStore').database;
  database.prepare('INSERT INTO courses (id, name, code, credits, lecturer, capacity, faculty, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(capacityCourseId, 'Học phần kiểm thử sức chứa', `TST${process.pid}`, 3, 'Giảng viên kiểm thử', 1, 'Công nghệ thông tin', 'Học phần dùng trong kiểm thử tích hợp.');

  server = app.listen(0);
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  admin = createClient();
  await admin.request('/auth/csrf');
  const login = await admin.request('/auth/login', {
    method: 'POST',
    body: { email: process.env.ADMIN_EMAIL, password: adminPassword },
  });
  assert.equal(login.response.status, 200);
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  require('../../database/localStore').database.close();
});

test('US01 - sinh viên đăng ký và chỉ nhận dữ liệu hồ sơ công khai', async () => {
  primaryEmail = `student-${process.pid}@example.test`;
  const client = createClient();
  await client.request('/auth/csrf');
  const { response, data } = await client.request('/auth/register', {
    method: 'POST',
    body: { name: 'Sinh viên kiểm thử', email: primaryEmail, major: 'Công nghệ thông tin', year: 2, password: 'Student-Test-Password-2026' },
  });

  assert.equal(response.status, 201);
  assert.equal(data.user.role, 'student');
  assert.equal(data.user.email, primaryEmail);
  assert.equal('password_hash' in data.user, false);
  assert.equal('password_salt' in data.user, false);
});

test('US02 - đăng nhập tạo phiên, /me trả hồ sơ và logout thu hồi phiên', async () => {
  const client = await createStudentClient();
  assert.equal((await client.request('/auth/me')).data.user.email, primaryEmail);
  assert.equal((await client.request('/auth/logout', { method: 'POST', csrf: false })).response.status, 403);
  assert.equal((await client.request('/auth/logout', { method: 'POST' })).response.status, 204);
  assert.equal((await client.request('/auth/me')).data.user, null);
});

test('US03 - sinh viên không được truy cập chức năng quản trị', async () => {
  const guest = createClient();
  assert.equal((await guest.request('/courses/mine')).response.status, 401);
  assert.equal((await guest.request('/students')).response.status, 401);
  const student = await createStudentClient();
  assert.equal((await student.request('/students')).response.status, 403);
});

test('US04 - tìm kiếm học phần theo từ khóa và khoa', async () => {
  const { response, data } = await createClient().request('/courses?search=WEB301&faculty=Công%20nghệ%20thông%20tin');
  assert.equal(response.status, 200);
  assert.ok(data.some((course) => course.code === 'WEB301'));
  assert.ok(data.every((course) => course.faculty === 'Công nghệ thông tin'));
});

test('US05 - xem chi tiết học phần và phản hồi 404 cho mã không tồn tại', async () => {
  const client = createClient();
  const detail = await client.request('/courses/web-301');
  assert.equal(detail.response.status, 200);
  assert.equal(detail.data.code, 'WEB301');
  assert.equal((await client.request('/courses/not-a-course')).response.status, 404);
});

test('US07 - đăng ký kiểm tra đăng nhập, sức chứa và đăng ký trùng', async () => {
  const student = await createStudentClient();
  const guest = createClient();
  await guest.request('/auth/csrf');
  assert.equal((await guest.request(`/courses/${capacityCourseId}/register`, { method: 'POST' })).response.status, 401);
  const first = await student.request(`/courses/${capacityCourseId}/register`, { method: 'POST' });
  assert.equal(first.response.status, 201);
  const duplicate = await student.request(`/courses/${capacityCourseId}/register`, { method: 'POST' });
  assert.equal(duplicate.response.status, 409);
  assert.match(duplicate.data.message, /đã đăng ký/);

  const secondEmail = `second-${process.pid}@example.test`;
  const second = createClient();
  await second.request('/auth/csrf');
  const registration = await second.request('/auth/register', {
    method: 'POST',
    body: { name: 'Sinh viên thứ hai', email: secondEmail, major: 'Kỹ thuật', year: 1, password: 'Student-Test-Password-2026' },
  });
  assert.equal(registration.response.status, 201);
  const full = await second.request(`/courses/${capacityCourseId}/register`, { method: 'POST' });
  assert.equal(full.response.status, 409);
  assert.match(full.data.message, /đủ chỗ/);
});

test('US08 - sinh viên xem lịch học cá nhân', async () => {
  const student = await createStudentClient();
  const { response, data } = await student.request('/courses/mine');
  assert.equal(response.status, 200);
  assert.ok(data.some((course) => course.id === capacityCourseId));
});

test('US09 - sinh viên hủy đăng ký và lịch học được cập nhật', async () => {
  const student = await createStudentClient();
  assert.equal((await student.request(`/courses/${capacityCourseId}/register`, { method: 'DELETE' })).response.status, 204);
  const { data } = await student.request('/courses/mine');
  assert.equal(data.some((course) => course.id === capacityCourseId), false);
});

test('US06 - admin tìm kiếm danh sách sinh viên', async () => {
  const { response, data } = await admin.request(`/students?search=${encodeURIComponent(primaryEmail)}`);
  assert.equal(response.status, 200);
  assert.ok(data.some((student) => student.email === primaryEmail));
  assert.equal('password_hash' in data[0], false);
});

test('US10 - admin tạo hồ sơ sinh viên', async () => {
  const created = await admin.request('/students', {
    method: 'POST',
    body: { name: 'Hồ sơ mới', email: `crud-${process.pid}@example.test`, major: 'Khoa học dữ liệu', year: 1 },
  });
  assert.equal(created.response.status, 201);
  crudStudentId = created.data.id;
  assert.equal((await admin.request(`/students/${crudStudentId}`)).response.status, 200);
});

test('US11 - admin cập nhật hồ sơ sinh viên', async () => {
  const updated = await admin.request(`/students/${crudStudentId}`, {
    method: 'PUT',
    body: { name: 'Hồ sơ đã sửa', email: `crud-${process.pid}@example.test`, major: 'An toàn thông tin', year: 3 },
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.data.major, 'An toàn thông tin');
});

test('US12 - admin xóa hồ sơ sinh viên', async () => {
  const created = await admin.request('/students', {
    method: 'POST',
    body: { name: 'Hồ sơ cần xóa', email: `delete-${process.pid}@example.test`, major: 'Toán tin', year: 2 },
  });
  assert.equal(created.response.status, 201);
  assert.equal((await admin.request(`/students/${created.data.id}`, { method: 'DELETE' })).response.status, 204);
  assert.equal((await admin.request(`/students/${created.data.id}`)).response.status, 404);
});

test('API - JWT sai chữ ký không thể dùng để truy cập tài nguyên riêng tư', async () => {
  const student = await createStudentClient();
  const token = student.getCookie('unimanage_session');
  const parts = token.split('.');
  parts[2] = `${parts[2][0] === 'A' ? 'B' : 'A'}${parts[2].slice(1)}`;
  student.setCookie('unimanage_session', parts.join('.'));
  assert.equal((await student.request('/courses/mine')).response.status, 401);
});

test('API - CORS chỉ cho phép origin trong allowlist', async () => {
  const allowed = await fetch(`${baseUrl}/api/health`, { headers: { Origin: 'http://localhost:5173' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  const blocked = await fetch(`${baseUrl}/api/health`, { headers: { Origin: 'https://untrusted.example' } });
  assert.equal(blocked.headers.get('access-control-allow-origin'), null);
});

test('API - tài khoản scrypt hiện hữu được tự nâng cấp sang bcrypt sau đăng nhập', async () => {
  const { randomBytes, scryptSync } = require('node:crypto');
  const database = require('../../database/localStore').database;
  const email = `legacy-${process.pid}@example.test`;
  const password = 'Legacy-Test-Password-2026';
  const salt = randomBytes(16).toString('hex');
  const passwordHash = scryptSync(password, salt, 64).toString('hex');
  const student = database.prepare('INSERT INTO students (name, email, major, year) VALUES (?, ?, ?, ?)')
    .run('Tài khoản cũ', email, 'Công nghệ thông tin', 2);
  database.prepare('INSERT INTO auth_users (student_id, email, password_hash, password_salt) VALUES (?, ?, ?, ?)')
    .run(Number(student.lastInsertRowid), email, passwordHash, salt);

  const client = createClient();
  await client.request('/auth/csrf');
  assert.equal((await client.request('/auth/login', { method: 'POST', body: { email, password } })).response.status, 200);
  const upgraded = database.prepare('SELECT password_hash FROM auth_users WHERE email = ?').get(email);
  assert.match(upgraded.password_hash, /^\$2[aby]\$/);
});

test('API - CRUD học phần chỉ dành cho admin và không xóa học phần đang có đăng ký', async () => {
  const student = await createStudentClient();
  assert.equal((await student.request(`/courses/${capacityCourseId}/register`, { method: 'POST' })).response.status, 201);
  assert.equal((await student.request('/courses', { method: 'POST', body: {} })).response.status, 403);
  assert.equal((await admin.request(`/courses/${capacityCourseId}`, { method: 'DELETE' })).response.status, 409);

  const id = `admin-course-${process.pid}`;
  const created = await admin.request('/courses', {
    method: 'POST',
    body: { id, name: 'Học phần quản trị', code: `ADM${process.pid}`, credits: 3, lecturer: 'Giảng viên quản trị', capacity: 2, faculty: 'Công nghệ thông tin', description: 'Học phần dùng kiểm thử CRUD.' },
  });
  assert.equal(created.response.status, 201);
  const otherStudent = await createStudentClient(`second-${process.pid}@example.test`);
  assert.equal((await student.request(`/courses/${id}/register`, { method: 'POST' })).response.status, 201);
  assert.equal((await otherStudent.request(`/courses/${id}/register`, { method: 'POST' })).response.status, 201);
  const rejectedCapacity = await admin.request(`/courses/${id}`, {
    method: 'PUT',
    body: { name: 'Học phần đã cập nhật', code: `ADM${process.pid}`, credits: 4, lecturer: 'Giảng viên quản trị', capacity: 1, faculty: 'Công nghệ thông tin', description: 'Nội dung sau cập nhật.' },
  });
  assert.equal(rejectedCapacity.response.status, 409);
  const updated = await admin.request(`/courses/${id}`, {
    method: 'PUT',
    body: { name: 'Học phần đã cập nhật', code: `ADM${process.pid}`, credits: 4, lecturer: 'Giảng viên quản trị', capacity: 3, faculty: 'Công nghệ thông tin', description: 'Nội dung sau cập nhật.' },
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.data.credits, 4);
  await student.request(`/courses/${id}/register`, { method: 'DELETE' });
  await otherStudent.request(`/courses/${id}/register`, { method: 'DELETE' });
  assert.equal((await admin.request(`/courses/${id}`, { method: 'DELETE' })).response.status, 204);
});

test('Unit - validator xác thực từ chối email và mật khẩu không hợp lệ', () => {
  const { validateCredentials } = require('../../controllers/authController');
  assert.ok(validateCredentials({ email: 'not-an-email', password: 'short' }).message);
  assert.deepEqual(validateCredentials({ email: 'student@example.test', password: 'Correct-Password-2026' }), {
    email: 'student@example.test',
    password: 'Correct-Password-2026',
  });
});

test('Unit - validator sinh viên giới hạn email và năm học', () => {
  const { validateStudent } = require('../../controllers/studentController');
  assert.ok(validateStudent({ name: 'Test', email: 'bad', major: 'IT', year: 2 }).error);
  assert.ok(validateStudent({ name: 'Test', email: 'student@example.test', major: 'IT', year: 7 }).error);
  assert.equal(validateStudent({ name: 'Test', email: 'student@example.test', major: 'IT', year: 2 }).student.year, 2);
});

test('Unit - validator học phần giới hạn mã, sức chứa và tín chỉ', () => {
  const { validateCourse } = require('../../controllers/courseController');
  const course = { id: 'course-test', name: 'Lập trình Web', code: 'WEB501', credits: 3, lecturer: 'Giảng viên', capacity: 30, faculty: 'CNTT', description: 'Mô tả học phần.' };
  assert.equal(validateCourse(course, true).course.code, 'WEB501');
  assert.ok(validateCourse({ ...course, capacity: 0 }, true).error);
  assert.ok(validateCourse({ ...course, code: 'invalid code' }, true).error);
});
