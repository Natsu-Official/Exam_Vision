import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../theme/ThemeProvider";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="container">
      <div className="card">
        <h1 className="h1">Theme тохиргоо</h1>
        <p className="muted">Sprint 1: localStorage дээр хадгална.</p>

        <div className="field">
          <div className="label">Background өнгө</div>
          <input
            className="input"
            type="color"
            value={theme.bg}
            onChange={(e) => setTheme((t) => ({ ...t, bg: e.target.value }))}
          />
        </div>

        <div className="field">
          <div className="label">Text өнгө</div>
          <input
            className="input"
            type="color"
            value={theme.fg}
            onChange={(e) => setTheme((t) => ({ ...t, fg: e.target.value }))}
          />
        </div>

        <div className="navMini">
          <Link to="/login">← Буцах</Link>
          <button
            className="btnSecondary"
            onClick={() => setTheme({ bg: "#0b1220", fg: "#e5e7eb" })}
          >
            Default болгох
          </button>
        </div>
      </div>
    </div>
  );
}