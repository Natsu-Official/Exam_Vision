import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiLogin } from "../services/auth";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      alert("Имэйл/утас болон нууц үгээ оруулна уу.");
      return;
    }
    setBusy(true);
    try {
      const res = await apiLogin({ identifier: identifier.trim(), password });
      alert(res.message || "Login OK (API)");
    } catch (err) {
      alert(err?.response?.data?.detail || err?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <div className="badge">ExamVision · Sprint 1</div>
        <h1 className="h1">Нэвтрэх</h1>
        <p className="muted">Суурь API холболт шалгах demo.</p>

        <form onSubmit={onSubmit}>
          <div className="field">
            <div className="label">Имэйл / Утас</div>
            <input className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          </div>

          <div className="field">
            <div className="label">Нууц үг</div>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button className="btn" disabled={busy}>
            {busy ? "Түр хүлээнэ үү..." : "Нэвтрэх"}
          </button>
        </form>

        <div className="navMini">
          <Link to="/forgot-password">Нууц үг сэргээх</Link>
          <Link to="/register">Бүртгүүлэх</Link>
        </div>

        <button className="btnSecondary" onClick={() => (window.location.href = "/settings")}>
          Background өнгө тохируулах
        </button>
      </div>
    </div>
  );
}