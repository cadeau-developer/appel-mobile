import client from "./client";

export function fetchTerms() {
  return client.get("/terms").then((r) => r.data);
}

export function startTerm(payload) {
  return client.post("/terms", payload || {}).then((r) => r.data);
}

export function endTerm() {
  return client.post("/terms/end").then((r) => r.data);
}
