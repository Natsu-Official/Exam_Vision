import { api } from "./api";

export async function apiDetectObject(payload) {
  const { data } = await api.post("/api/ai/detect-object", payload);
  return data;
}