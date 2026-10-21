import client from "./client";

export function fetchYears() {
  return client.get("/years").then((r) => r.data);
}

export function startYear(payload) {
  return client.post("/years", payload || {}).then((r) => r.data);
}

export function endYear() {
  return client.post("/years/end").then((r) => r.data);
}

export function revertYear(year) {
  return client.post("/years/revert", { year }).then((r) => r.data);
}
