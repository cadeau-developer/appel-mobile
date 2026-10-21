import client from "./client";

export function fetchPendingSchools() {
  return client.get("/admin/schools", { params: { status: "PENDING" } }).then((r) => r.data.schools);
}

export function fetchAllSchools() {
  return client.get("/admin/schools").then((r) => r.data.schools);
}

export function registerSchool(payload) {
  return client.post("/admin/schools", payload).then((r) => r.data);
}

export function approveSchool(id) {
  return client.post(`/admin/schools/${id}/approve`).then((r) => r.data);
}

export function rejectSchool(id) {
  return client.post(`/admin/schools/${id}/reject`).then((r) => r.data);
}

export function updateSchool({ id, ...payload }) {
  return client.patch(`/admin/schools/${id}`, payload).then((r) => r.data);
}

export function deleteSchool(id) {
  return client.delete(`/admin/schools/${id}`).then((r) => r.data);
}

export function fetchProfile() {
  return client.get("/admin/profile").then((r) => r.data.user);
}

export function updateProfile(payload) {
  return client.patch("/admin/profile", payload).then((r) => r.data.user);
}

export function fetchYearStatus(year) {
  return client.get("/admin/year-status", { params: { year } }).then((r) => r.data);
}

export function startYearAllSchools(year) {
  return client.post("/admin/start-year-all", { year }).then((r) => r.data);
}