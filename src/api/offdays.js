import client from "./client";

export function fetchOffDays() {
  return client.get("/off-days").then((r) => r.data.offDays);
}

// Full response for the headmaster screen: scheduled off days + days the
// server detected as off (no attendance was taken school-wide).
export function fetchOffDaysBundle() {
  return client.get("/off-days").then((r) => r.data);
}

export function addOffDay(payload) {
  return client.post("/off-days", payload).then((r) => r.data.offDay);
}

export function deleteOffDay(id) {
  return client.delete(`/off-days/${id}`).then((r) => r.data);
}

export function fetchWeekendAttendanceDays() {
  return client.get("/off-days/weekend-attendance").then((r) => r.data.weekendAttendanceDays);
}

export function allowWeekendAttendance(date) {
  return client.post("/off-days/weekend-attendance", { date }).then((r) => r.data.weekendAttendanceDay);
}

export function removeWeekendAttendance(date) {
  return client.delete(`/off-days/weekend-attendance/${date}`).then((r) => r.data);
}

// Server-side answer to "is this date an off day?" (weekends included).
export function fetchOffDayStatus(date) {
  return client.get("/off-days/status", { params: { date } }).then((r) => r.data);
}