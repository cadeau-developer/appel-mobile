import client from "./client";

export function fetchDisciplineCases() {
  return client.get("/discipline-cases").then((r) => r.data.disciplineCases);
}

export function createDisciplineCase(payload) {
  return client.post("/discipline-cases", payload).then((r) => r.data.disciplineCase);
}

export function markDisciplineCaseReviewed(id) {
  return client.patch(`/discipline-cases/${id}/review`).then((r) => r.data.disciplineCase);
}

export function fetchDisciplineSettings() {
  return client.get("/discipline-cases/settings").then((r) => r.data.settings);
}

export function updateDisciplineSettings(payload) {
  return client.put("/discipline-cases/settings", payload).then((r) => r.data.settings);
}

export function fetchDisciplineMarks() {
  return client.get("/discipline-cases/marks").then((r) => r.data);
}

export function fetchStudentDiscipline(studentId) {
  return client.get(`/discipline-cases/student/${studentId}`).then((r) => r.data);
}
