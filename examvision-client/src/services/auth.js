import { api } from "./api";

export async function apiLogin(payload) {
  const { data } = await api.post("/api/auth/login", payload);
  return data;
}

export async function apiRegister(payload) {
  const { data } = await api.post("/api/auth/register", payload);
  return data;
}

export async function apiForgotPassword(payload) {
  const { data } = await api.post("/api/auth/forgot-password", payload);
  return data;
}

export async function apiMe() {
  const { data } = await api.get("/api/auth/me");
  return data;
}

export async function apiVerifyFace(payload) {
  const { data } = await api.post("/api/auth/verify-face", payload);
  return data;
}