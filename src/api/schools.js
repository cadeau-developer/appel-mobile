import client from "./client";

export function updateSchool(payload) {
  return client.patch("/schools/me", payload).then((r) => r.data.school);
}