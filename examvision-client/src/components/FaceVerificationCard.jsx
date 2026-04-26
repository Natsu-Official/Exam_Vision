import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import { apiVerifyFace } from "../services/auth";

export default function FaceVerificationCard() {
  const webcamRef = useRef(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleVerify() {
    try {
      setBusy(true);
      const imageSrc = webcamRef.current?.getScreenshot();

      if (!imageSrc) {
        alert("Камерын зураг авч чадсангүй.");
        return;
      }

      const res = await apiVerifyFace({ image: imageSrc });
      setResult(res);
    } catch (err) {
      alert(err?.response?.data?.detail || "Face verification failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dashboard-panel">
      <div className="panel-head">
        <h2>Face Verification</h2>
        <span>Demo</span>
      </div>

      <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 14 }}>
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          style={{ width: "100%", borderRadius: 16 }}
          videoConstraints={{ facingMode: "user" }}
        />
      </div>

      <button className="btn" onClick={handleVerify} disabled={busy}>
        {busy ? "Шалгаж байна..." : "Verify Face"}
      </button>

      {result && (
        <div className="mini-box" style={{ marginTop: 12 }}>
          <p><strong>Status:</strong> {result.verified ? "Verified" : "Rejected"}</p>
          <p><strong>Confidence:</strong> {result.confidence}</p>
          <p><strong>Message:</strong> {result.message}</p>
        </div>
      )}
    </div>
  );
}