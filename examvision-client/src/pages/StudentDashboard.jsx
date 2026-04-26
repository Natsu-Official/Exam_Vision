import React from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth, getUser } from "../utils/auth";
import FaceVerificationCard from "../components/FaceVerificationCard";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = getUser();

  function logout() {
    clearAuth();
    navigate("/login");
  }

  const todayClasses = [
    { time: "09:00", name: "Software Engineering", room: "Lab 402", type: "Lecture" },
    { time: "11:00", name: "Database Systems", room: "B-201", type: "Practice" },
    { time: "14:00", name: "Artificial Intelligence", room: "Online", type: "Online" },
  ];

  const upcomingExams = [
    { subject: "Web Engineering", date: "2026-03-29", status: "48 цаг үлдсэн" },
    { subject: "Computer Networks", date: "2026-04-01", status: "Бэлтгэх" },
    { subject: "Algorithms", date: "2026-04-04", status: "Төлөвлөгдсөн" },
  ];

  const notifications = [
    "Software Engineering хичээлийн даалгаврын хугацаа маргааш дуусна.",
    "Web Engineering шалгалтын browser test хийх шаардлагатай.",
    "AI Fundamentals хичээлийн ирц шинэчлэгдсэн.",
  ];

  const tasks = [
    "Камер, микрофон access шалгах",
    "Шалгалтын browser lock test хийх",
    "Ирэх шалгалтын хуваарь баталгаажуулах",
    "Даалгаврын submission-ээ шалгах",
  ];

  return (
    <div className="dashboard-shell">
      <div className="dashboard-topbar">
        <div>
          <p className="dashboard-role">Student Panel</p>
          <h1 className="dashboard-title">
            Сайн байна уу, {user?.first_name || "Student"} 👋
          </h1>
          <p className="dashboard-subtitle">
            Таны хичээл, шалгалт, мэдэгдэл, шалгалтын бэлтгэлийг нэг дэлгэц дээр харуулж байна.
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
          <p className="stat-label">Энэ долоо хоногийн хичээл</p>
          <h3 className="stat-value">8</h3>
        </div>
        <div className="dashboard-stat-card">
          <p className="stat-label">Ирэх шалгалт</p>
          <h3 className="stat-value">3</h3>
        </div>
        <div className="dashboard-stat-card">
          <p className="stat-label">Ирц</p>
          <h3 className="stat-value">96%</h3>
        </div>
        <div className="dashboard-stat-card">
          <p className="stat-label">Unread мэдэгдэл</p>
          <h3 className="stat-value">5</h3>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <div className="dashboard-left-column">
          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Өнөөдрийн хичээлийн хуваарь</h2>
              <span>Today</span>
            </div>

            <div className="schedule-list">
              {todayClasses.map((item) => (
                <div className="schedule-item" key={`${item.time}-${item.name}`}>
                  <div>
                    <p className="schedule-title">{item.name}</p>
                    <p className="schedule-meta">
                      {item.time} · {item.room}
                    </p>
                  </div>
                  <span className="status-pill">{item.type}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Ойрын шалгалтууд</h2>
              <span>Exam Board</span>
            </div>

            <div className="exam-table">
              <div className="exam-row exam-head">
                <div>Хичээл</div>
                <div>Огноо</div>
                <div>Төлөв</div>
              </div>

              {upcomingExams.map((exam) => (
                <div className="exam-row" key={`${exam.subject}-${exam.date}`}>
                  <div>{exam.subject}</div>
                  <div>{exam.date}</div>
                  <div>
                    <span className="dark-pill">{exam.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <FaceVerificationCard />
        </div>

        <div className="dashboard-right-column">
          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Мэдэгдлүүд</h2>
              <span>Notifications</span>
            </div>

            <div className="simple-list">
              {notifications.map((item) => (
                <div className="simple-list-item" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-head">
              <h2>Priority checklist</h2>
              <span>Tasks</span>
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