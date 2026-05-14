import { api } from "./api";

export async function apiGetExams() {
  const { data } = await api.get("/api/exams");
  return data;
}

export async function apiStartExam(examId) {
  const { data } = await api.post("/api/exams/start", {
    exam_id: examId,
  });

  return data;
}

export async function apiSubmitExam(payload) {
  const { data } = await api.post("/api/exams/submit", payload);
  return data;
}

export async function apiLogMonitoringEvent(payload) {
  const { data } = await api.post("/api/monitoring/log-event", payload);
  return data;
}