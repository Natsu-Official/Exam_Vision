import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiForgotPassword } from "../services/auth";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();

    if (!identifier.trim()) {
      alert("Имэйл эсвэл утсаа оруулна уу.");
      return;
    }

    setBusy(true);

    try {
      const res = await apiForgotPassword({ identifier: identifier.trim() });
      alert(`${res.message}\nDemo OTP: ${res.demo_otp}`);
    } catch (err) {
      alert(err?.response?.data?.detail || "Reset request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="h1">Нууц үг сэргээх</h1>

        <form onSubmit={onSubmit}>
          <div className="field">
            <div className="label">Имэйл / Утас</div>
            <input
              className="input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          <button className="btn" disabled={busy}>
            {busy ? "..." : "Сэргээх хүсэлт илгээх"}
          </button>
        </form>

        <div className="navMini">
          <Link to="/login">Нэвтрэх</Link>
          <Link to="/register">Бүртгүүлэх</Link>
        </div>
      </div>
    </div>
  );
}