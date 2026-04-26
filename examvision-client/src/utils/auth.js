export function saveAuth(data) {
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("user_role", data.role);
  localStorage.setItem("user_info", JSON.stringify(data.user));
}

export function clearAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_role");
  localStorage.removeItem("user_info");
}

export function getToken() {
  return localStorage.getItem("access_token");
}

export function getRole() {
  return localStorage.getItem("user_role");
}

export function getUser() {
  const raw = localStorage.getItem("user_info");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getToken();
}