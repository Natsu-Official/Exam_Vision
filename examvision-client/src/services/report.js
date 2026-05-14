import { api } from "./api";

export async function apiGetTeacherReports() {
  const { data } = await api.get("/api/teacher/reports");
  return data;
}

export async function apiGetMonitoringReport(attemptId) {
  const { data } = await api.get(`/api/monitoring/report/${attemptId}`);
  return data;
}