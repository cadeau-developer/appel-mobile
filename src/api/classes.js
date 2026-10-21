import client from "./client";

export function fetchClasses() {
  return client.get("/classes").then((r) => r.data.classes ?? []);
}

export function createClass(payload) {
  return client.post("/classes", payload).then((r) => r.data.class);
}

export function fetchMyClasses() {
  return client.get("/classes/mine").then((r) => r.data.classes ?? []);
}

export function fetchTeacherDashboard() {
  return client.get("/classes/mine/dashboard").then((r) => r.data);
}

export function assignClassTeacher(classId, teacherId) {
  return client.patch(`/classes/${classId}`, { teacherId }).then((r) => r.data.class);
}

export function deleteClass(classId) {
  return client.delete(`/classes/${classId}`).then((r) => r.data);
}
