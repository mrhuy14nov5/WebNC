const courseModel = require('../models/courseModel');

async function list(request, response) {
  response.json(await courseModel.listCourses({ search: String(request.query.search || ''), faculty: String(request.query.faculty || '') }));
}

async function detail(request, response) {
  const course = await courseModel.findCourse(request.params.id);
  if (!course) return response.status(404).json({ message: 'Không tìm thấy học phần.' });
  return response.json(course);
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

module.exports = { list, detail, registrations, register, unregister };
