export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCredentials(body: Record<string, any> = {}) {
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!emailPattern.test(email) || email.length > 180 || password.length < 8 || password.length > 128) {
    return { message: 'Email không hợp lệ hoặc mật khẩu chưa đáp ứng yêu cầu (8–128 ký tự).' };
  }
  return { email, password };
}

export function validateStudent(body: Record<string, any> = {}) {
  const student = {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    major: String(body.major || '').trim(),
    year: Number(body.year),
  };
  if (!student.name || student.name.length > 120 || !emailPattern.test(student.email) || student.email.length > 180
    || !student.major || student.major.length > 120 || !Number.isInteger(student.year)) {
    return { error: 'name, email, major và year là bắt buộc.' };
  }
  if (student.year < 1 || student.year > 6) return { error: 'year phải từ 1 đến 6.' };
  return { student };
}

export function validateCourse(body: Record<string, any> = {}, requireId = false) {
  const course = {
    id: String(body.id || '').trim(),
    name: String(body.name || '').trim(),
    code: String(body.code || '').trim().toUpperCase(),
    credits: Number(body.credits),
    lecturer: String(body.lecturer || '').trim(),
    capacity: Number(body.capacity),
    faculty: String(body.faculty || '').trim(),
    description: String(body.description || '').trim(),
  };
  if ((requireId && !/^[a-z0-9][a-z0-9-]{1,39}$/i.test(course.id))
    || !course.name || course.name.length > 180 || !/^[A-Z0-9-]{2,30}$/.test(course.code)
    || !Number.isInteger(course.credits) || course.credits < 1 || course.credits > 30
    || !course.lecturer || course.lecturer.length > 120 || !Number.isInteger(course.capacity) || course.capacity < 1
    || course.capacity > 100000 || !course.faculty || course.faculty.length > 120
    || !course.description || course.description.length > 5000) {
    return { error: 'Thông tin học phần không hợp lệ hoặc còn thiếu.' };
  }
  return { course };
}

export function validateLecturer(body: Record<string, any> = {}, { requirePassword = true } = {}) {
  const lecturer = {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    faculty: String(body.faculty || '').trim(),
    password: typeof body.password === 'string' ? body.password : '',
  };
  if (!lecturer.name || lecturer.name.length > 120
    || !emailPattern.test(lecturer.email) || lecturer.email.length > 180
    || !lecturer.faculty || lecturer.faculty.length > 120) {
    return { error: 'Vui lòng nhập họ tên, email và khoa/bộ môn hợp lệ.' };
  }
  if ((requirePassword || lecturer.password) && (lecturer.password.length < 8 || lecturer.password.length > 128)) {
    return { error: 'Mật khẩu phải có từ 8 đến 128 ký tự.' };
  }
  return { lecturer };
}

export function validateCourseIds(body: Record<string, any> = {}) {
  if (!Array.isArray(body.courseIds) || body.courseIds.length > 100) {
    return { error: 'Danh sách học phần không hợp lệ.' };
  }
  const courseIds = [...new Set(body.courseIds.map((id) => String(id ?? '').trim()))];
  if (courseIds.some((id) => !id || id.length > 40)) {
    return { error: 'Danh sách học phần không hợp lệ.' };
  }
  return { courseIds };
}
