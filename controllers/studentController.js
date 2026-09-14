const studentModel = require('../models/studentModel');

function validateStudent(body) {
  const student = {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim(),
    major: String(body.major || '').trim(),
    year: Number(body.year)
  };
  if (!student.name || !student.email || !student.major || !Number.isInteger(student.year)) {
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
  response.status(201).json(await studentModel.createStudent(result.student));
}

async function updateStudent(request, response) {
  const result = validateStudent(request.body);
  if (result.error) return response.status(400).json({ message: result.error });
  const student = await studentModel.updateStudent(request.params.id, result.student);
  if (!student) return response.status(404).json({ message: 'Không tìm thấy sinh viên.' });
  response.json(student);
}

async function deleteStudent(request, response) {
  const existingStudent = await studentModel.findStudent(request.params.id);
  if (!existingStudent) return response.status(404).json({ message: 'Không tìm thấy sinh viên.' });
  await studentModel.deleteStudent(request.params.id);
  response.status(204).send();
}

module.exports = { getStudents, getStudent, createStudent, updateStudent, deleteStudent };