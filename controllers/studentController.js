const studentModel = require('../models/studentModel');

function validateStudent(body) {
  body ??= {};
  const student = {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    major: String(body.major || '').trim(),
    year: Number(body.year)
  };
  if (!student.name || student.name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email) || student.email.length > 180 || !student.major || student.major.length > 120 || !Number.isInteger(student.year)) {
    return { error: 'name, email, major và year là bắt buộc.' };
  }
  if (student.year < 1 || student.year > 6) return { error: 'year phải từ 1 đến 6.' };
  return { student };
}

async function getStudents(request, response) {
  response.json(await studentModel.listStudents(request.query.search || ''));
}

async function getStudent(request, response) {
  const student = await studentModel.findStudent(request.params.id);
  if (!student) return response.status(404).json({ message: 'Không tìm thấy sinh viên.' });
  response.json(student);
}

async function createStudent(request, response) {
  const result = validateStudent(request.body);
  if (result.error) return response.status(400).json({ message: result.error });
  try {
    return response.status(201).json(await studentModel.createStudent(result.student));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' || /UNIQUE constraint failed: students\.email/.test(error.message)) {
      return response.status(409).json({ message: 'Email này đã được sử dụng.' });
    }
    throw error;
  }
}

async function updateStudent(request, response) {
  const result = validateStudent(request.body);
  if (result.error) return response.status(400).json({ message: result.error });
  try {
    const student = await studentModel.updateStudent(request.params.id, result.student);
    if (!student) return response.status(404).json({ message: 'Không tìm thấy sinh viên.' });
    return response.json(student);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' || /UNIQUE constraint failed: students\.email/.test(error.message)) {
      return response.status(409).json({ message: 'Email này đã được sử dụng.' });
    }
    throw error;
  }
}

async function deleteStudent(request, response) {
  const existingStudent = await studentModel.findStudent(request.params.id);
  if (!existingStudent) return response.status(404).json({ message: 'Không tìm thấy sinh viên.' });
  await studentModel.deleteStudent(request.params.id);
  response.status(204).send();
}

module.exports = { getStudents, getStudent, createStudent, updateStudent, deleteStudent, validateStudent };