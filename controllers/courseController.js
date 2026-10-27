const courseModel = require('../models/courseModel');

function validateCourse(body = {}, requireId = false) {
  body ??= {};
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

function isDuplicateCourseError(error) {
  return error.code === 'ER_DUP_ENTRY' || /UNIQUE constraint failed: courses\.(id|code)/.test(error.message);
}

async function list(request, response) {
  response.json(await courseModel.listCourses({ search: String(request.query.search || ''), faculty: String(request.query.faculty || '') }));
}

async function detail(request, response) {
  const course = await courseModel.findCourse(request.params.id);
  if (!course) return response.status(404).json({ message: 'Không tìm thấy học phần.' });
  return response.json(course);
}

async function create(request, response) {
  const result = validateCourse(request.body, true);
  if (result.error) return response.status(400).json({ message: result.error });
  try {
    return response.status(201).json(await courseModel.createCourse(result.course));
  } catch (error) {
    if (isDuplicateCourseError(error)) return response.status(409).json({ message: 'Mã học phần hoặc mã môn học đã tồn tại.' });
    throw error;
  }
}

async function update(request, response) {
  const result = validateCourse(request.body);
  if (result.error) return response.status(400).json({ message: result.error });
  try {
    const course = await courseModel.updateCourse(request.params.id, result.course);
    if (!course) return response.status(404).json({ message: 'Không tìm thấy học phần.' });
    return response.json(course);
  } catch (error) {
    if (isDuplicateCourseError(error)) return response.status(409).json({ message: 'Mã học phần hoặc mã môn học đã tồn tại.' });
    if (error.code === 'COURSE_CAPACITY_BELOW_ENROLLMENT') return response.status(409).json({ message: 'Sức chứa không thể thấp hơn số sinh viên đã đăng ký.' });
    throw error;
  }
}

async function remove(request, response) {
  try {
    await courseModel.deleteCourse(request.params.id);
    return response.status(204).send();
  } catch (error) {
    if (error.code === 'COURSE_NOT_FOUND') return response.status(404).json({ message: 'Không tìm thấy học phần.' });
    if (error.code === 'COURSE_HAS_REGISTRATIONS') return response.status(409).json({ message: 'Không thể xóa học phần đang có sinh viên đăng ký.' });
    throw error;
  }
}

async function registrations(request, response) {
  response.json(await courseModel.listRegistrations(request.user.id));
}

async function register(request, response) {
  try {
    await courseModel.registerForCourse(request.user.id, request.params.id);
    return response.status(201).json({ message: 'Đăng ký học phần thành công.' });
  } catch (error) {
    if (error.code === 'COURSE_NOT_FOUND') return response.status(404).json({ message: 'Không tìm thấy học phần.' });
    if (error.code === 'COURSE_FULL') return response.status(409).json({ message: 'Học phần đã đủ chỗ.' });
    if (error.code === 'ALREADY_REGISTERED') return response.status(409).json({ message: 'Bạn đã đăng ký học phần này.' });
    throw error;
  }
}

async function unregister(request, response) {
  const removed = await courseModel.unregisterFromCourse(request.user.id, request.params.id);
  if (!removed) return response.status(404).json({ message: 'Bạn chưa đăng ký học phần này.' });
  return response.status(204).send();
}

module.exports = { list, detail, create, update, remove, registrations, register, unregister, validateCourse };
