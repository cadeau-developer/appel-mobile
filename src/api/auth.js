import client from "./client";

export function registerHeadmaster(payload) {
  return client.post("/auth/register-headmaster", payload).then((r) => r.data);
}

export function login(email, password) {
  return client.post("/auth/login", { email, password }).then((r) => r.data);
}

export function fetchMe() {
  return client.get("/auth/me").then((r) => r.data);
}

export function updateMe(payload) {
  return client.patch("/auth/me", payload).then((r) => r.data.user);
}
