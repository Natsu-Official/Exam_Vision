import React, { useEffect, useMemo, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useNavigate, useParams } from "react-router-dom";
import { apiLogMonitoringEvent, apiStartExam, apiSubmitExam } from "../services/exam";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getRiskLevel(count) {
  if (count >= 5) return "High";
  if (count >= 3) return "Medium";
  return "Low";
}

export default function ExamTakingPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const webcamRef = useRef(null);

  const [exam, setExam] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [result, setResult] = useState(null);
  const [events, setEvents] = useState([]);
  const [cameraStatus, setCameraStatus] = useState("checking");
  const [faceStatus, setFaceStatus] = useState("waiting");
  const submittedRef = useRef(false);

  const examIdNumber = useMemo(() => Number(examId), [examId]);

  const violationTypes = [
    "tab_switch",
    "fullscreen_exit",
    "copy_attempt",
    "paste_attempt",
    "right_click",
    "camera_denied",
    "face_missing_demo",
  ];

  const violationCount = events.filter((e) =>
    violationTypes.includes(e.event_type)
  ).length;

  async function logEvent(eventType, details = {}) {
    const newEvent = {
      event_type: eventType,
      details,
      time: new Date().toLocaleTimeString(),
    };

    setEvents((prev) => [...prev, newEvent]);

    try {
      await apiLogMonitoringEvent({
        exam_id: examIdNumber,
        event_type: eventType,
        details,
      });
    } catch {
      // demo үед log fail болсон ч exam зогсоохгүй
    }
  }

  async function submitExam(auto = false) {
    if (submittedRef.current) return;
    submittedRef.current = true;

    try {
      const res = await apiSubmitExam({
        exam_id: examIdNumber,
        answers,
      });

      setResult({
        ...res,
        auto,
        local_events: events,
      });

      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      alert(err?.response?.data?.detail || "Submit хийхэд алдаа гарлаа.");
      submittedRef.current = false;
    }
  }

  useEffect(() => {
    async function start() {
      try {
        const res = await apiStartExam(examIdNumber);
        setExam(res.exam);
        setAttemptId(res.attempt_id);
        setTimeLeft(res.exam.duration_minutes * 60);

        try {
          await document.documentElement.requestFullscreen();
          await logEvent("fullscreen_enter", { attempt_id: res.attempt_id });
        } catch {
          await logEvent("fullscreen_denied", { attempt_id: res.attempt_id });
        }
      } catch (err) {
        alert(err?.response?.data?.detail || "Шалгалт эхлүүлэхэд алдаа гарлаа.");
        navigate("/exams");
      }
    }

    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examIdNumber]);

  useEffect(() => {
    if (timeLeft === null || result) return;

    if (timeLeft <= 0) {
      submitExam(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, result]);

  useEffect(() => {
    if (violationCount >= 5 && !submittedRef.current && !result) {
      logEvent("auto_submit_triggered", {
        reason: "Violation limit reached",
        violation_count: violationCount,
      });
      submitExam(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [violationCount]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.hidden && !submittedRef.current) {
        logEvent("tab_switch", {
          message: "User switched tab or minimized browser",
        });
      }
    }

    function onFullscreenChange() {
      if (!document.fullscreenElement && !submittedRef.current) {
        logEvent("fullscreen_exit", {
          message: "User exited fullscreen mode",
        });
      }
    }

    function onCopy(e) {
      if (!submittedRef.current) {
        e.preventDefault();
        logEvent("copy_attempt", {
          message: "User tried to copy exam content",
        });
      }
    }

    function onPaste(e) {
      if (!submittedRef.current) {
        e.preventDefault();
        logEvent("paste_attempt", {
          message: "User tried to paste content",
        });
      }
    }

    function onContextMenu(e) {
      if (!submittedRef.current) {
        e.preventDefault();
        logEvent("right_click", {
          message: "User tried to open context menu",
        });
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("contextmenu", onContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("contextmenu", onContextMenu);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examIdNumber]);

  useEffect(() => {
    if (!exam || result) return;

    async function checkCameraPermission() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        setCameraStatus("active");
        setFaceStatus("demo_verified");

        await logEvent("camera_enabled", {
          message: "Camera permission granted",
        });
      } catch {
        setCameraStatus("denied");
        setFaceStatus("missing");

        await logEvent("camera_denied", {
          message: "Camera permission denied",
        });
      }
    }

    checkCameraPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, result]);

  useEffect(() => {
    if (!exam || result || cameraStatus !== "active") return;

    const faceInterval = setInterval(async () => {
      const screenshot = webcamRef.current?.getScreenshot();

      if (!screenshot) {
        setFaceStatus("missing");
        await logEvent("face_missing_demo", {
          message: "No webcam screenshot captured",
        });
        return;
      }

      setFaceStatus("demo_verified");
      await logEvent("face_check_demo", {
        message: "Face check demo passed",
        confidence: 0.93,
      });
    }, 30000);

    return () => clearInterval(faceInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam, result, cameraStatus]);

  if (result) {
    const monitoringEvents = result.monitoring_events || result.local_events || [];
    const riskyEvents = monitoringEvents.filter((e) =>
      violationTypes.includes(e.event_type)
    );

    const faceEvents = monitoringEvents.filter((e) =>
      ["camera_enabled", "camera_denied", "face_check_demo", "face_missing_demo"].includes(e.event_type)
    );

    return (
      <div className="dashboard-shell">
        <div className="dashboard-topbar">
          <div>
            <p className="dashboard-role">Exam Result</p>
            <h1 className="dashboard-title">Шалгалт илгээгдлээ</h1>
            <p className="dashboard-subtitle">
              {result.auto
                ? "Системийн дүрэм эсвэл хугацааны улмаас автоматаар илгээгдсэн."
                : "Та шалгалтаа амжилттай илгээлээ."}
            </p>
          </div>

          <button className="btn" onClick={() => navigate("/student")}>
            Dashboard руу буцах
          </button>
        </div>

        <section className="dashboard-panel">
          <div className="panel-head">
            <h2>Онооны үр дүн</h2>
            <span>Auto grading</span>
          </div>

          <div className="mini-grid">
            <div className="mini-box">Нийт оноо: {result.total_score}</div>
            <div className="mini-box">Авсан оноо: {result.earned_score}</div>
            <div className="mini-box">Хувь: {result.percentage}%</div>
            <div className="mini-box">Submit төрөл: {result.auto ? "Auto" : "Manual"}</div>
          </div>
        </section>

        <section className="dashboard-panel" style={{ marginTop: 20 }}>
          <div className="panel-head">
            <h2>Monitoring report</h2>
            <span>AI proctoring demo</span>
          </div>

          <div className="mini-grid">
            <div className="mini-box">Total events: {monitoringEvents.length}</div>
            <div className="mini-box">Violations: {riskyEvents.length}</div>
            <div className="mini-box">Risk level: {getRiskLevel(riskyEvents.length)}</div>
            <div className="mini-box">Face/Camera events: {faceEvents.length}</div>
          </div>

          <div className="simple-list" style={{ marginTop: 16 }}>
            {monitoringEvents.length === 0 && (
              <div className="simple-list-item">Monitoring event бүртгэгдээгүй.</div>
            )}

            {monitoringEvents.map((event, idx) => (
              <div className="simple-list-item" key={`${event.event_type}-${idx}`}>
                {event.event_type} — {event.created_at || event.time || "runtime"}
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (!exam || timeLeft === null) {
    return (
      <div className="container">
        <div className="card">Шалгалт ачааллаж байна...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <div className="dashboard-topbar">
        <div>
          <p className="dashboard-role">Attempt #{attemptId}</p>
          <h1 className="dashboard-title">{exam.title}</h1>
          <p className="dashboard-subtitle">{exam.description}</p>
        </div>

        <div className="dashboard-top-actions">
          <div className="dashboard-stat-card" style={{ minWidth: 150 }}>
            <p className="stat-label">Үлдсэн хугацаа</p>
            <h3 className="stat-value">{formatTime(timeLeft)}</h3>
          </div>

          <div className="dashboard-stat-card" style={{ minWidth: 150 }}>
            <p className="stat-label">Violation</p>
            <h3 className="stat-value">{violationCount}/5</h3>
          </div>

          <button className="btn" onClick={() => submitExam(false)}>
            Submit
          </button>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <div className="dashboard-left-column">
          {exam.questions.map((q, index) => (
            <section className="dashboard-panel" key={q.id}>
              <div className="panel-head">
                <h2>
                  {index + 1}. {q.text}
                </h2>
                <span>{q.points} оноо</span>
              </div>

              <div className="simple-list">
                {q.options.map((option) => (
                  <label className="simple-list-item" key={option.id}>
                    <input
                      type="radio"
                      name={`question-${q.id}`}
                      value={option.id}
                      checked={answers[String(q.id)] === option.id}
                      onChange={() =>
                        setAnswers((prev) => ({
                          ...prev,
                          [String(q.id)]: option.id,
                        }))
                      }
                      style={{ marginRight: 10 }}
                    />
                    {option.text}
                  </label>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="dashboard-right-column">
          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Camera Monitoring</h2>
              <span>Sprint 4</span>
            </div>

            <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 14 }}>
              {cameraStatus === "active" ? (
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "user" }}
                  style={{
                    width: "100%",
                    borderRadius: 16,
                    border: "1px solid var(--ev-border)",
                  }}
                />
              ) : (
                <div className="mini-box">
                  Camera status: {cameraStatus}
                </div>
              )}
            </div>

            <div className="mini-grid">
              <div className="mini-box">Camera: {cameraStatus}</div>
              <div className="mini-box">Face: {faceStatus}</div>
              <div className="mini-box">Check interval: 30s</div>
              <div className="mini-box">Mode: Demo AI</div>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Monitoring</h2>
              <span>Live</span>
            </div>

            <div className="simple-list">
              <div className="simple-list-item">Fullscreen: required</div>
              <div className="simple-list-item">Tab switch: detecting</div>
              <div className="simple-list-item">Copy/Paste: blocked</div>
              <div className="simple-list-item">Right click: blocked</div>
              <div className="simple-list-item">Face monitoring: active demo</div>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Detected events</h2>
              <span>{events.length}</span>
            </div>

            <div className="simple-list">
              {events.length === 0 && (
                <div className="simple-list-item">Одоогоор event илрээгүй.</div>
              )}

              {events.map((event, idx) => (
                <div className="simple-list-item" key={`${event.event_type}-${idx}`}>
                  {event.time} — {event.event_type}
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Risk status</h2>
              <span>{getRiskLevel(violationCount)}</span>
            </div>

            <div className="mini-box">
              {violationCount >= 5
                ? "High risk: auto submit хийгдэнэ."
                : "Шалгалтын явц хэвийн байна."}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}