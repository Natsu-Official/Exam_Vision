import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiLogin } from "../services/auth";
import { saveAuth } from "../utils/auth";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      alert("Имэйл/утас болон нууц үгээ оруулна уу.");
      return;
    }

    setBusy(true);

    try {
      const res = await apiLogin({
        identifier: identifier.trim(),
        password,
      });

      saveAuth(res);

      if (res.role === "student") navigate("/student");
      else if (res.role === "teacher") navigate("/teacher");
      else if (res.role === "admin") navigate("/admin");
      else navigate("/login");
    } catch (err) {
      alert(err?.response?.data?.detail || err?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <div className="badge">ExamVision · Sprint 2</div>
        <h1 className="h1">Нэвтрэх</h1>
        <p className="muted">
          Demo accounts:
          <br />
          student@example.com / demo123
          <br />
          teacher@example.com / demo123
          <br />
          admin@example.com / demo123
        </p>

        <form onSubmit={onSubmit}>
          <div className="field">
            <div className="label">Имэйл / Утас</div>
            <input
              className="input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <div className="field">
            <div className="label">Нууц үг</div>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="btn" disabled={busy}>
            {busy ? "Түр хүлээнэ үү..." : "Нэвтрэх"}
          </button>
        </form>

        <div className="navMini">
          <Link to="/forgot-password">Нууц үг сэргээх</Link>
          <Link to="/register">Бүртгүүлэх</Link>
        </div>

        <button className="btnSecondary" onClick={() => navigate("/settings")}>
          Background өнгө тохируулах
        </button>
      </div>
    </div>
  );
}