import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGetTeacherReports } from "../services/report";

export default function TeacherReportsPage() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const res = await apiGetTeacherReports();
        setReports(res.reports || []);
      } catch (err) {
        alert(err?.response?.data?.detail || "Report авахад алдаа гарлаа.");
      } finally {
        setBusy(false);
      }
    }

    loadReports();
  }, []);

  if (busy) {
    return (
      <div className="container">
        <div className="card">Report ачааллаж байна...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <div className="dashboard-topbar">
        <div>
          <p className="dashboard-role">Teacher Reports</p>
          <h1 className="dashboard-title">Monitoring & Exam Reports</h1>
          <p className="dashboard-subtitle">
            Оюутны шалгалтын оноо, tab switch, fullscreen exit, AI object
            detection event-үүдийн нэгтгэл.
          </p>
        </div>

        <div className="dashboard-top-actions">
          <button className="btnSecondary" onClick={() => navigate("/teacher")}>
            Dashboard руу буцах
          </button>
        </div>
      </div>

      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <p className="stat-label">Нийт attempt</p>
          <h3 className="stat-value">{reports.length}</h3>
        </div>

        <div className="dashboard-stat-card">
          <p className="stat-label">High risk</p>
          <h3 className="stat-value">
            {reports.filter((item) => item.risk_level === "high").length}
          </h3>
        </div>

        <div className="dashboard-stat-card">
          <p className="stat-label">Phone detected</p>
          <h3 className="stat-value">
            {reports.reduce(
              (sum, item) => sum + (item.phone_detected_count || 0),
              0
            )}
          </h3>
        </div>

        <div className="dashboard-stat-card">
          <p className="stat-label">Tab switch</p>
          <h3 className="stat-value">
            {reports.reduce(
              (sum, item) => sum + (item.tab_switch_count || 0),
              0
            )}
          </h3>
        </div>
      </div>

      <section className="dashboard-panel">
        <div className="panel-head">
          <h2>Report Summary</h2>
          <span>{reports.length} attempts</span>
        </div>

        {reports.length === 0 ? (
          <div className="simple-list-item">
            Одоогоор submit хийсэн шалгалтын report байхгүй байна. Student
            account-аар шалгалт өгөөд submit хийсний дараа энд report гарна.
          </div>
        ) : (
          <div className="exam-table">
            <div
              className="exam-row exam-head"
              style={{
                gridTemplateColumns:
                  "1.2fr 1.3fr 0.7fr 0.8fr 0.7fr 0.7fr 0.7fr",
              }}
            >
              <div>Student</div>
              <div>Exam</div>
              <div>Score</div>
              <div>Risk</div>
              <div>Tab</div>
              <div>Phone</div>
              <div>Person</div>
            </div>

            {reports.map((report) => (
              <div
                className="exam-row"
                key={report.attempt_id}
                style={{
                  gridTemplateColumns:
                    "1.2fr 1.3fr 0.7fr 0.8fr 0.7fr 0.7fr 0.7fr",
                }}
              >
                <div>{report.student}</div>
                <div>{report.exam}</div>
                <div>
                  {report.score}/{report.total_score}
                </div>
                <div>
                  <span className="dark-pill">{report.risk_level}</span>
                </div>
                <div>{report.tab_switch_count}</div>
                <div>{report.phone_detected_count}</div>
                <div>{report.person_detected_count}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-panel" style={{ marginTop: 20 }}>
        <div className="panel-head">
          <h2>AI / Monitoring detail</h2>
          <span>Counts</span>
        </div>

        {reports.length === 0 ? (
          <div className="simple-list-item">Detail харах report алга байна.</div>
        ) : (
          <div className="simple-list">
            {reports.map((report) => (
              <div className="simple-list-item" key={`detail-${report.attempt_id}`}>
                <strong>
                  Attempt #{report.attempt_id} · {report.student}
                </strong>
                <br />
                Exam: {report.exam}
                <br />
                Risk level: {report.risk_level}
                <br />
                Tab switch: {report.tab_switch_count} · Fullscreen exit:{" "}
                {report.fullscreen_exit_count}
                <br />
                Phone: {report.phone_detected_count} · Person:{" "}
                {report.person_detected_count} · Book:{" "}
                {report.book_detected_count} · Laptop:{" "}
                {report.laptop_detected_count}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}