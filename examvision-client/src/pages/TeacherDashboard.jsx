import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth, getUser } from "../utils/auth";
import { apiGetTeacherExamResults } from "../services/exam";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const [results, setResults] = useState([]);

  function logout() {
    clearAuth();
    navigate("/login");
  }

  useEffect(() => {
    async function loadResults() {
      try {
        const res = await apiGetTeacherExamResults();
        setResults(res.results || []);
      } catch {
        setResults([]);
      }
    }

    loadResults();
  }, []);

  const courseList = [
    { name: "Software Engineering", students: 42, type: "Lecture" },
    { name: "Web Engineering", students: 27, type: "Lab" },
    { name: "Database Systems", students: 38, type: "Lecture" },
  ];

  const examList = [
    { title: "SE Midterm", date: "2026-03-30", status: "42 оюутан" },
    { title: "Web Quiz", date: "2026-04-02", status: "27 оюутан" },
    { title: "Database Practice Test", date: "2026-04-05", status: "Draft" },
  ];

  const suspiciousReports = [
    "SE Midterm: 3 tab switching event",
    "Web Quiz: 2 fullscreen exit event",
    "DB Test: 1 face missing report",
  ];

  const tasks = [
    "Шинэ шалгалтын асуулт нэмэх",
    "Essay submission-ууд үнэлэх",
    "Monitoring report review хийх",
    "Дүн нийтлэхээс өмнө шалгах",
  ];

  function riskClass(risk) {
    if (risk === "High") return "risk-high";
    if (risk === "Medium") return "risk-medium";
    return "risk-low";
  }

  return (
    <div className="dashboard-shell">
      <div className="dashboard-topbar">
        <div>
          <p className="dashboard-role">Teacher Panel</p>
          <h1 className="dashboard-title">
            Тавтай морил, {user?.first_name || "Teacher"} 👨‍🏫
          </h1>
          <p className="dashboard-subtitle">
            Хичээл, шалгалт, suspicious activity report, үнэлгээ болон monitoring тайлангийн самбар.
          </p>
        </div>

        <div className="dashboard-top-actions">
          <button className="btnSecondary" onClick={() => navigate("/settings")}>
            Theme
          </button>
          <button className="btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <p className="stat-label">Идэвхтэй хичээл</p>
          <h3 className="stat-value">4</h3>
        </div>
        <div className="dashboard-stat-card">
          <p className="stat-label">Энэ долоо хоногийн шалгалт</p>
          <h3 className="stat-value">2</h3>
        </div>
        <div className="dashboard-stat-card">
          <p className="stat-label">Шалгах essay</p>
          <h3 className="stat-value">18</h3>
        </div>
        <div className="dashboard-stat-card">
          <p className="stat-label">Submitted results</p>
          <h3 className="stat-value">{results.length}</h3>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <div className="dashboard-left-column">
          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Recent Exam Results</h2>
              <span>Auto grading + Monitoring</span>
            </div>

            {results.length === 0 ? (
              <div className="simple-list-item">
                Одоогоор илгээсэн шалгалтын үр дүн байхгүй байна. Student account-аар шалгалт өгөөд submit хийсний дараа энд харагдана.
              </div>
            ) : (
              <div className="exam-table">
                <div className="exam-row exam-head">
                  <div>Оюутан / Шалгалт</div>
                  <div>Оноо</div>
                  <div>Risk</div>
                </div>

                {results.map((item) => (
                  <div className="exam-row" key={item.id}>
                    <div>
                      <strong>{item.student_name}</strong>
                      <br />
                      <span style={{ opacity: 0.75 }}>{item.exam_title}</span>
                    </div>

                    <div>
                      {item.earned_score}/{item.total_score}
                      <br />
                      <span style={{ opacity: 0.75 }}>{item.percentage}%</span>
                    </div>

                    <div>
                      <span className={`risk-pill ${riskClass(item.risk_level)}`}>
                        {item.risk_level}
                      </span>
                      <br />
                      <span style={{ opacity: 0.75 }}>
                        violations: {item.violation_count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Хичээлүүд</h2>
              <span>Courses</span>
            </div>

            <div className="schedule-list">
              {courseList.map((course) => (
                <div className="schedule-item" key={course.name}>
                  <div>
                    <p className="schedule-title">{course.name}</p>
                    <p className="schedule-meta">{course.students} оюутан</p>
                  </div>
                  <span className="status-pill">{course.type}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Шалгалтын самбар</h2>
              <span>Exam Control</span>
            </div>

            <div className="exam-table">
              <div className="exam-row exam-head">
                <div>Шалгалт</div>
                <div>Огноо</div>
                <div>Төлөв</div>
              </div>

              {examList.map((exam) => (
                <div className="exam-row" key={`${exam.title}-${exam.date}`}>
                  <div>{exam.title}</div>
                  <div>{exam.date}</div>
                  <div>
                    <span className="dark-pill">{exam.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="dashboard-right-column">
          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Suspicious activity</h2>
              <span>Reports</span>
            </div>

            <div className="simple-list">
              {suspiciousReports.map((item) => (
                <div className="simple-list-item" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Priority tasks</h2>
              <span>Today</span>
            </div>

            <div className="simple-list">
              {tasks.map((item) => (
                <div className="simple-list-item" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Monitoring Summary</h2>
              <span>Sprint 4</span>
            </div>

            <div className="mini-grid">
              <div className="mini-box">AI proctoring: Demo</div>
              <div className="mini-box">Face check: Enabled</div>
              <div className="mini-box">Screen monitor: Enabled</div>
              <div className="mini-box">Report: Auto generated</div>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Профайл</h2>
              <span>User Info</span>
            </div>

            <div className="profile-card-lite">
              <p><strong>Нэр:</strong> {user?.first_name} {user?.last_name}</p>
              <p><strong>Role:</strong> {user?.role}</p>
              <p><strong>Identifier:</strong> {user?.identifier}</p>
              <p><strong>Статус:</strong> Active</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}