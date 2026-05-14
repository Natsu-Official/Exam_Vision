import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGetExams } from "../services/exam";

export default function ExamListPage() {
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    async function loadExams() {
      try {
        const res = await apiGetExams();
        setExams(res.exams || []);
      } catch (err) {
        alert(err?.response?.data?.detail || "Шалгалтын жагсаалт авахад алдаа гарлаа.");
      } finally {
        setBusy(false);
      }
    }

    loadExams();
  }, []);

  if (busy) {
    return (
      <div className="container">
        <div className="card">Шалгалтын жагсаалт ачааллаж байна...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <div className="dashboard-topbar">
        <div>
          <p className="dashboard-role">Exam Module</p>
          <h1 className="dashboard-title">Шалгалтын жагсаалт</h1>
          <p className="dashboard-subtitle">
            Оюутан өгөх боломжтой онлайн шалгалтууд. Шалгалт эхлэх үед fullscreen,
            tab switch, copy/paste, right click болон AI object detection monitoring
            идэвхжих болно.
          </p>
        </div>

        <div className="dashboard-top-actions">
          <button className="btnSecondary" onClick={() => navigate("/student")}>
            Dashboard руу буцах
          </button>
        </div>
      </div>

      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <p className="stat-label">Нийт шалгалт</p>
          <h3 className="stat-value">{exams.length}</h3>
        </div>

        <div className="dashboard-stat-card">
          <p className="stat-label">Monitoring</p>
          <h3 className="stat-value">Active</h3>
        </div>

        <div className="dashboard-stat-card">
          <p className="stat-label">AI Detection</p>
          <h3 className="stat-value">Demo</h3>
        </div>

        <div className="dashboard-stat-card">
          <p className="stat-label">Status</p>
          <h3 className="stat-value">Ready</h3>
        </div>
      </div>

      {exams.length === 0 ? (
        <section className="dashboard-panel">
          <div className="panel-head">
            <h2>Шалгалт алга байна</h2>
            <span>Empty</span>
          </div>

          <p className="dashboard-subtitle">
            Одоогоор өгөгдлийн санд published төлөвтэй шалгалт байхгүй байна.
            Backend seed data зөв орсон эсэхийг шалгаарай.
          </p>
        </section>
      ) : (
        <div className="dashboard-main-grid" style={{ gridTemplateColumns: "1fr" }}>
          {exams.map((exam) => (
            <section className="dashboard-panel" key={exam.id}>
              <div className="panel-head">
                <h2>{exam.title}</h2>
                <span>{exam.duration_minutes} минут</span>
              </div>

              <p className="dashboard-subtitle">{exam.description}</p>

              <div className="mini-grid" style={{ marginTop: 16 }}>
                <div className="mini-box">Status: {exam.status}</div>
                <div className="mini-box">Timer: {exam.duration_minutes} минут</div>
                <div className="mini-box">Fullscreen: Required</div>
                <div className="mini-box">AI Monitoring: Enabled</div>
              </div>

              <button
                className="btn"
                style={{ marginTop: 16 }}
                onClick={() => navigate(`/exam/${exam.id}`)}
              >
                Шалгалт эхлүүлэх
              </button>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}