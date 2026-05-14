import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGetExams } from "../services/exam";

export default function ExamListPage() {
  const [exams, setExams] = useState([]);
  const [busy, setBusy] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const res = await apiGetExams();
        setExams(res.exams || []);
      } catch (err) {
        alert(err?.response?.data?.detail || "Шалгалтын жагсаалт авахад алдаа гарлаа.");
      } finally {
        setBusy(false);
      }
    }

    load();
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
            Оюутан өгөх боломжтой онлайн шалгалтууд.
          </p>
        </div>

        <button className="btnSecondary" onClick={() => navigate("/student")}>
          Dashboard руу буцах
        </button>
      </div>

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
              <div className="mini-box">Monitoring: enabled</div>
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
    </div>
  );
}