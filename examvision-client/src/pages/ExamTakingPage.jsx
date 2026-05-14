import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  apiLogMonitoringEvent,
  apiStartExam,
  apiSubmitExam,
} from "../services/exam";

import { apiDetectObject } from "../services/ai";

function formatTime(seconds) {
  const safeSeconds = Math.max(0, seconds || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remainSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainSeconds).padStart(
    2,
    "0"
  )}`;
}

export default function ExamTakingPage() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const examIdNumber = useMemo(() => Number(examId), [examId]);

  const [exam, setExam] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [events, setEvents] = useState([]);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const submittedRef = useRef(false);
  const startingRef = useRef(false);

  async function logEvent(eventType, details = {}) {
    if (submittedRef.current) return;

    const localEvent = {
      event_type: eventType,
      details,
      time: new Date().toLocaleTimeString(),
    };

    setEvents((prev) => [...prev, localEvent]);

    try {
      await apiLogMonitoringEvent({
        exam_id: examIdNumber,
        event_type: eventType,
        details,
      });
    } catch {
      // Monitoring log алдаа гарсан ч шалгалтыг зогсоохгүй.
    }
  }

  async function runAIDemo(demoObject) {
    if (submittedRef.current) return;

    try {
      const res = await apiDetectObject({
        exam_id: examIdNumber,
        demo_object: demoObject,
        image: null,
      });

      setEvents((prev) => [
        ...prev,
        {
          event_type: res.event_type,
          details: { object: demoObject, risk_level: res.risk_level },
          time: new Date().toLocaleTimeString(),
        },
      ]);

      alert(`${res.message}\nRisk: ${res.risk_level}`);
    } catch (err) {
      alert(err?.response?.data?.detail || "AI detection failed");
    }
  }

  async function submitExam(auto = false) {
    if (submittedRef.current) return;

    submittedRef.current = true;
    setSubmitting(true);

    try {
      const res = await apiSubmitExam({
        exam_id: examIdNumber,
        answers,
      });

      setResult({
        ...res,
        auto,
      });

      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          // Fullscreen exit fail бол demo flow-г зогсоохгүй.
        }
      }
    } catch (err) {
      submittedRef.current = false;
      alert(err?.response?.data?.detail || "Submit хийхэд алдаа гарлаа.");
    } finally {
      setSubmitting(false);
    }
  }

  function selectAnswer(questionId, answerId) {
    setAnswers((prev) => ({
      ...prev,
      [String(questionId)]: answerId,
    }));
  }

  useEffect(() => {
    async function startExam() {
      if (startingRef.current) return;
      startingRef.current = true;

      try {
        setBusy(true);

        const res = await apiStartExam(examIdNumber);

        setExam(res.exam);
        setAttemptId(res.attempt_id);
        setTimeLeft(res.exam.duration_minutes * 60);

        try {
          await document.documentElement.requestFullscreen();
          await logEvent("fullscreen_enter", {
            attempt_id: res.attempt_id,
            message: "Exam started in fullscreen mode",
          });
        } catch {
          await logEvent("fullscreen_denied", {
            attempt_id: res.attempt_id,
            message: "Browser denied fullscreen request",
          });
        }
      } catch (err) {
        alert(err?.response?.data?.detail || "Шалгалт эхлүүлэхэд алдаа гарлаа.");
        navigate("/exams");
      } finally {
        setBusy(false);
      }
    }

    startExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examIdNumber]);

  useEffect(() => {
    if (timeLeft === null || result || submittedRef.current) return;

    if (timeLeft <= 0) {
      submitExam(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return prev;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, result]);

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

    function onCopy(event) {
      if (!submittedRef.current) {
        event.preventDefault();
        logEvent("copy_attempt", {
          message: "User attempted to copy content during exam",
        });
      }
    }

    function onPaste(event) {
      if (!submittedRef.current) {
        event.preventDefault();
        logEvent("paste_attempt", {
          message: "User attempted to paste content during exam",
        });
      }
    }

    function onContextMenu(event) {
      if (!submittedRef.current) {
        event.preventDefault();
        logEvent("right_click", {
          message: "User attempted to open context menu during exam",
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

  if (busy) {
    return (
      <div className="container">
        <div className="card">Шалгалт ачааллаж байна...</div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="dashboard-shell">
        <div className="dashboard-topbar">
          <div>
            <p className="dashboard-role">Exam Result</p>
            <h1 className="dashboard-title">Шалгалт илгээгдлээ</h1>
            <p className="dashboard-subtitle">
              {result.auto
                ? "Цаг дууссан тул шалгалт автоматаар илгээгдсэн."
                : "Та шалгалтаа амжилттай илгээлээ."}
            </p>
          </div>

          <button className="btn" onClick={() => navigate("/student")}>
            Dashboard руу буцах
          </button>
        </div>

        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            <p className="stat-label">Нийт оноо</p>
            <h3 className="stat-value">{result.total_score}</h3>
          </div>

          <div className="dashboard-stat-card">
            <p className="stat-label">Авсан оноо</p>
            <h3 className="stat-value">{result.earned_score}</h3>
          </div>

          <div className="dashboard-stat-card">
            <p className="stat-label">Хувь</p>
            <h3 className="stat-value">{result.percentage}%</h3>
          </div>

          <div className="dashboard-stat-card">
            <p className="stat-label">Risk level</p>
            <h3 className="stat-value">
              {result.monitoring_report?.risk_level || "low"}
            </h3>
          </div>
        </div>

        <div className="dashboard-main-grid">
          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Хариултын үр дүн</h2>
              <span>Score detail</span>
            </div>

            <div className="simple-list">
              {(result.details || []).map((item) => (
                <div className="simple-list-item" key={item.question_id}>
                  <strong>Question #{item.question_id}</strong>
                  <br />
                  Таны хариулт: {item.student_answer || "Хариулаагүй"}
                  <br />
                  Зөв хариулт: {item.correct_answer}
                  <br />
                  Төлөв: {item.is_correct ? "Зөв" : "Буруу"}
                  <br />
                  Оноо: {item.points}
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Monitoring report</h2>
              <span>AI + Anti-cheat</span>
            </div>

            <div className="mini-grid">
              <div className="mini-box">
                Risk: {result.monitoring_report?.risk_level || "low"}
              </div>
              <div className="mini-box">
                Tab switch: {result.monitoring_report?.tab_switch_count || 0}
              </div>
              <div className="mini-box">
                Fullscreen exit:{" "}
                {result.monitoring_report?.fullscreen_exit_count || 0}
              </div>
              <div className="mini-box">
                Phone: {result.monitoring_report?.phone_detected_count || 0}
              </div>
              <div className="mini-box">
                Person: {result.monitoring_report?.person_detected_count || 0}
              </div>
              <div className="mini-box">
                Book: {result.monitoring_report?.book_detected_count || 0}
              </div>
              <div className="mini-box">
                Laptop: {result.monitoring_report?.laptop_detected_count || 0}
              </div>
              <div className="mini-box">
                Total events: {result.monitoring_events?.length || 0}
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container">
        <div className="card">Шалгалт олдсонгүй.</div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <div className="dashboard-topbar">
        <div>
          <p className="dashboard-role">Exam Taking</p>
          <h1 className="dashboard-title">{exam.title}</h1>
          <p className="dashboard-subtitle">{exam.description}</p>
        </div>

        <div className="dashboard-top-actions">
          <span className="status-pill">Attempt #{attemptId}</span>
          <span className="status-pill">Timer: {formatTime(timeLeft)}</span>
          <button
            className="btn"
            disabled={submitting}
            onClick={() => submitExam(false)}
          >
            {submitting ? "Илгээж байна..." : "Submit"}
          </button>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <div className="dashboard-left-column">
          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Асуултууд</h2>
              <span>{exam.questions?.length || 0} questions</span>
            </div>

            <div className="simple-list">
              {(exam.questions || []).map((question, index) => (
                <div className="simple-list-item" key={question.id}>
                  <p style={{ marginTop: 0 }}>
                    <strong>
                      {index + 1}. {question.text}
                    </strong>
                  </p>

                  <div className="simple-list">
                    {(question.options || []).map((option) => (
                      <label
                        key={option.id}
                        className="simple-list-item"
                        style={{ cursor: "pointer" }}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={answers[String(question.id)] === option.id}
                          onChange={() => selectAnswer(question.id, option.id)}
                          style={{ marginRight: 8 }}
                        />
                        <strong>{option.id.toUpperCase()}.</strong> {option.text}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="dashboard-right-column">
          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Exam Monitoring</h2>
              <span>Active</span>
            </div>

            <div className="mini-grid">
              <div className="mini-box">Fullscreen: Required</div>
              <div className="mini-box">Tab switch: Tracking</div>
              <div className="mini-box">Copy/Paste: Blocked</div>
              <div className="mini-box">Right click: Blocked</div>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>AI Object Detection</h2>
              <span>Demo</span>
            </div>

            <p className="dashboard-subtitle">
              Шалгалтын үед гар утас, өөр хүн, ном, laptop илэрсэн эсэхийг demo
              байдлаар бүртгэнэ.
            </p>

            <div className="mini-grid" style={{ marginTop: 16 }}>
              <button
                className="btnSecondary"
                onClick={() => runAIDemo("phone")}
              >
                Detect Phone
              </button>

              <button
                className="btnSecondary"
                onClick={() => runAIDemo("person")}
              >
                Detect Person
              </button>

              <button className="btnSecondary" onClick={() => runAIDemo("book")}>
                Detect Book
              </button>

              <button
                className="btnSecondary"
                onClick={() => runAIDemo("laptop")}
              >
                Detect Laptop
              </button>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Live events</h2>
              <span>{events.length} events</span>
            </div>

            {events.length === 0 ? (
              <div className="simple-list-item">Одоогоор event бүртгэгдээгүй.</div>
            ) : (
              <div className="simple-list">
                {events
                  .slice()
                  .reverse()
                  .map((event, index) => (
                    <div
                      className="simple-list-item"
                      key={`${event.event_type}-${index}`}
                    >
                      <strong>{event.event_type}</strong>
                      <br />
                      Time: {event.time}
                    </div>
                  ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}