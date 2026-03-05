import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiRegister } from "../services/auth";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !emailOrPhone.trim() || !password.trim()) {
      alert("Бүх талбарыг бөглөнө үү.");
      return;
    }
    setBusy(true);
    try {
      const res = await apiRegister({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        identifier: emailOrPhone.trim(),
        password,
        role: "student",
      });
      alert(res.message || "Register OK (API)");
    } catch (err) {
      alert(err?.response?.data?.detail || err?.message || "Register failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="h1">Бүртгүүлэх</h1>

        <form onSubmit={onSubmit}>
          <div className="row">
            <div className="field">
              <div className="label">Овог</div>
              <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="field">
              <div className="label">Нэр</div>
              <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <div className="label">Имэйл / Утас</div>
            <input className="input" value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} />
          </div>

          <div className="field">
            <div className="label">Нууц үг</div>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button className="btn" disabled={busy}>
            {busy ? "..." : "Бүртгүүлэх"}
          </button>
        </form>

        <div className="navMini">
          <Link to="/login">Нэвтрэх рүү буцах</Link>
          <Link to="/settings">Theme</Link>
        </div>
      </div>
    </div>
  );
}