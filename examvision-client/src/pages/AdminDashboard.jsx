import React from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth, getUser } from "../utils/auth";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = getUser();

  function logout() {
    clearAuth();
    navigate("/login");
  }

  const systemJobs = [
    { time: "08:30", name: "System Health Check", place: "Server", state: "Автомат" },
    { time: "12:00", name: "Backup Review", place: "Cloud", state: "Daily" },
    { time: "17:00", name: "Audit Export", place: "Ops", state: "Pending" },
  ];

  const examOverview = [
    { title: "School-wide Midterm", date: "2026-03-29", status: "312 оролцогч" },
    { title: "Faculty Exam Window", date: "2026-04-01", status: "6 хичээл" },
    { title: "Mock Test", date: "2026-04-03", status: "Monitoring" },
  ];

  const alerts = [
    "4 failed login attempts from unknown IP",
    "1 deployment warning on backend service",
    "Daily backup completed successfully",
    "2 role permission changes pending review",
  ];

  const adminTasks = [
    "Role permission audit хийх",
    "Deployment log шалгах",
    "Security alert review хийх",
    "Data retention policy update хийх",
  ];

  return (
    <div className="dashboard-shell">
      <div className="dashboard-topbar">
        <div>
          <p className="dashboard-role">Admin Panel</p>
          <h1 className="dashboard-title">Сайн байна уу, {user?.first_name || "Admin"} 🛡️</h1>
          <p className="dashboard-subtitle">
            Системийн ачаалал, хэрэглэгчид, шалгалтын төлөв, аюулгүй байдлын хяналтыг нэг самбарт нэгтгэлээ.
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
          <p className="stat-label">Нийт хэрэглэгч</p>
          <h3 className="stat-value">1,248</h3>
        </div>
        <div className="dashboard-stat-card">
          <p className="stat-label">Өнөөдрийн шалгалт</p>
          <h3 className="stat-value">12</h3>
        </div>
        <div className="dashboard-stat-card">
          <p className="stat-label">Active sessions</p>
          <h3 className="stat-value">138</h3>
        </div>
        <div className="dashboard-stat-card">
          <p className="stat-label">Security alerts</p>
          <h3 className="stat-value">4</h3>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <div className="dashboard-left-column">
          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Системийн өдөр тутмын ажлууд</h2>
              <span>Ops Schedule</span>
            </div>

            <div className="schedule-list">
              {systemJobs.map((job) => (
                <div className="schedule-item" key={`${job.time}-${job.name}`}>
                  <div>
                    <p className="schedule-title">{job.name}</p>
                    <p className="schedule-meta">
                      {job.time} · {job.place}
                    </p>
                  </div>
                  <span className="status-pill">{job.state}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Шалгалтын ерөнхий төлөв</h2>
              <span>Exam Overview</span>
            </div>

            <div className="exam-table">
              <div className="exam-row exam-head">
                <div>Шалгалт</div>
                <div>Огноо</div>
                <div>Төлөв</div>
              </div>

              {examOverview.map((item) => (
                <div className="exam-row" key={`${item.title}-${item.date}`}>
                  <div>{item.title}</div>
                  <div>{item.date}</div>
                  <div>
                    <span className="dark-pill">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>System summary</h2>
              <span>KPI</span>
            </div>

            <div className="mini-grid">
              <div className="mini-box">Uptime: 99.92%</div>
              <div className="mini-box">API Avg Response: 1.2s</div>
              <div className="mini-box">Failed Logins: 4</div>
              <div className="mini-box">Backup Status: Success</div>
            </div>
          </section>
        </div>

        <div className="dashboard-right-column">
          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Security / System alerts</h2>
              <span>Live Alerts</span>
            </div>

            <div className="simple-list">
              {alerts.map((item) => (
                <div className="simple-list-item" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Admin tasks</h2>
              <span>Today</span>
            </div>

            <div className="simple-list">
              {adminTasks.map((item) => (
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