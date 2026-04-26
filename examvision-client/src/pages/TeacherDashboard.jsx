import React from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth, getUser } from "../utils/auth";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const user = getUser();

  function logout() {
    clearAuth();
    navigate("/login");
  }

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

  return (
    <div className="dashboard-shell">
      <div className="dashboard-topbar">
        <div>
          <p className="dashboard-role">Teacher Panel</p>
          <h1 className="dashboard-title">Тавтай морил, {user?.first_name || "Teacher"} 👨‍🏫</h1>
          <p className="dashboard-subtitle">
            Хичээл, шалгалт, suspicious activity report, үнэлгээ болон удирдлагын самбар.
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
          <p className="stat-label">Suspicious reports</p>
          <h3 className="stat-value">6</h3>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <div className="dashboard-left-column">
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

          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Үнэлгээний хурдан самбар</h2>
              <span>Grading</span>
            </div>

            <div className="mini-grid">
              <div className="mini-box">Auto graded: 124</div>
              <div className="mini-box">Essay pending: 18</div>
              <div className="mini-box">Published: 76</div>
              <div className="mini-box">Draft exams: 3</div>
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