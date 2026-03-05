import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiForgotPassword } from "../services/auth";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!identifier.trim()) {
      alert("Имэйл/утсаа оруулна уу.");
      return;
    }
    setBusy(true);
    try {
      const res = await apiForgotPassword({ identifier: identifier.trim() });
      alert(res.message || "Request sent (API)");
    } catch (err) {
      alert(err?.response?.data?.detail || err?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="h1">Нууц үг сэргээх</h1>
        <p className="muted">Sprint 1: API request явж байгааг харуулах.</p>

        <form onSubmit={onSubmit}>
          <div className="field">
            <div className="label">Имэйл / Утас</div>
            <input className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
          </div>

          <button className="btn" disabled={busy}>
            {busy ? "..." : "Хүсэлт илгээх"}
          </button>
        </form>

        <div className="navMini">
          <Link to="/login">Нэвтрэх рүү буцах</Link>
          <Link to="/register">Бүртгүүлэх</Link>
        </div>
      </div>
    </div>
  );
}