import client from "./client";

export function fetchTransferClasses() {
  return client.get("/records/classes").then((r) => r.data.classes);
}

export function transferStudents(studentIds, toClassId) {
  return client.post("/records/transfer", { studentIds, toClassId }).then((r) => r.data);
}

export function fetchIncomingTransfers() {
  return client.get("/records/incoming").then((r) => r.data);
}

export function receiveTransfers(transferIds) {
  return client.post("/records/receive", { transferIds }).then((r) => r.data);
}

export function cancelTransfers(transferIds) {
  return client.post("/records/cancel-transfer", { transferIds }).then((r) => r.data);
}

export function fetchUndergraduates() {
  return client.get("/records/undergraduates").then((r) => r.data);
}

export function endYear(classId, year) {
  return client.post("/records/end-year", { classId, year }).then((r) => r.data);
}

export function endYearAll(year) {
  return client.post("/records/end-year-all", { year }).then((r) => r.data);
}

export function revertYear(classId, year) {
  return client.post("/records/revert-year", { classId, year }).then((r) => r.data);
}

export function revertYearAll(year) {
  return client.post("/records/revert-year-all", { year }).then((r) => r.data);
}

export function repeatStudent(recordId, year) {
  return client.post("/records/repeat", { recordId, year }).then((r) => r.data);
}

export function fetchStudentClasses(studentId) {
  return client.get(`/records/student/${studentId}/classes`).then((r) => r.data);
}
