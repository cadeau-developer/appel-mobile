import client from "./client";

export function fetchAttendance(classId, date) {
  return client.get("/attendance", { params: { classId, date } }).then((r) => r.data);
}

export function submitAttendance(payload) {
  return client.post("/attendance", payload).then((r) => r.data);
}

export function fetchAttendanceReport(date, classId) {
  return client.get("/attendance/report", { params: { date, classId } }).then((r) => r.data);
}
