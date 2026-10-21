import client from "./client";

export function fetchTeachers() {
  return client.get("/teachers").then((r) => r.data.teachers ?? []);
}

export function createTeacher(payload) {
  return client.post("/teachers", payload).then((r) => r.data.teacher);
}
