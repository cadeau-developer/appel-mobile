import client from "./client";

export function fetchClassStudents(classId) {
  return client.get(`/classes/${classId}/students`).then((r) => r.data.students);
}

export function addStudent(classId, payload) {
  return client.post(`/classes/${classId}/students`, payload).then((r) => r.data.student);
}

export function updateStudent(classId, studentId, payload) {
  return client.patch(`/classes/${classId}/students/${studentId}`, payload).then((r) => r.data.student);
}

export function leaveStudents(classId, studentIds) {
  return client.post(`/classes/${classId}/students/bulk-leave`, { studentIds }).then((r) => r.data);
}

export function searchStudents(search) {
  return client.get("/students", { params: { search } }).then((r) => r.data.students);
}

export function fetchStudentHistory(studentId) {
  return client.get(`/students/${studentId}/history`).then((r) => r.data);
}
