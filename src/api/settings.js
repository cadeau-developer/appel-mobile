import client from "./client";

export function fetchSettings() {
  return client.get("/settings").then((r) => r.data.settings);
}

export function updateSettings(payload) {
  return client.put("/settings", payload).then((r) => r.data.settings);
}
