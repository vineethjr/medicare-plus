import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheckIcon,
  BrainIcon,
  VideoIcon,
  AlertCircleIcon,
  ArrowRightIcon,
} from "../components/Icons";
import { API_URL, BACKEND_URL } from "../config";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  function fillDemo(email, pass) {
    setFormData({ email, password: pass });
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid email or password");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "admin") {
        navigate("/admin-dashboard");
      } else if (data.user.role === "doctor") {
        navigate("/doctor-dashboard");
      } else {
        navigate("/patient-dashboard");
      }
    } catch (err) {
      if (
        typeof window !== "undefined" &&
        window.location.hostname !== "localhost" &&
        BACKEND_URL.includes("localhost")
      ) {
        setError(
          "Backend URL is not configured. In Vercel Project Settings > Environment Variables, set VITE_BACKEND_URL to your deployed backend URL (e.g. on Render) and redeploy."
        );
      } else {
        setError(
          "Unable to connect to MediCare+ service. Free servers may take ~30 seconds to wake up from sleep. Please wait a moment and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-split-container">
        {/* LEFT SHOWCASE PANEL */}
        <div className="login-showcase-panel">
          <div className="showcase-brand">
            <div className="brand-icon-box">+</div>
            <div>
              <span>MediCare<strong>+</strong></span>
              <small className="brand-subtitle-tag">CLINICAL INTELLIGENCE</small>
            </div>
          </div>

          <div className="showcase-hero-text">
            <h2>Healthcare Reimagined for Patients & Doctors.</h2>
            <p>
              Experience seamless tele-consultations with guaranteed pay-upon-confirmation protection, clinical AI triage, and official administrative credential verification.
            </p>
          </div>

          <div className="showcase-perks">
            <div className="showcase-perk-item">
              <div className="perk-icon-wrapper">
                <ShieldCheckIcon size={20} />
              </div>
              <div>
                <strong>Pay Only Upon Confirmation</strong>
                <p>Never get billed upfront for appointments doctors cannot attend.</p>
              </div>
            </div>

            <div className="showcase-perk-item">
              <div className="perk-icon-wrapper">
                <BrainIcon size={20} />
              </div>
              <div>
                <strong>Clinical AI Symptom Triage</strong>
                <p>Intelligent specialty matching before scheduling consultations.</p>
              </div>
            </div>

            <div className="showcase-perk-item">
              <div className="perk-icon-wrapper">
                <VideoIcon size={20} />
              </div>
              <div>
                <strong>Ultra-HD WebRTC Video Calls</strong>
                <p>Bank-grade encrypted consultations directly in your browser.</p>
              </div>
            </div>
          </div>

          <div className="showcase-quote-card">
            <p>“MediCare+ has eliminated booking friction and gave our clinical practice a modern, patient-first workflow.”</p>
            <div className="quote-author">
              <div className="quote-avatar">Dr</div>
              <div>
                <strong>Dr. Alexander Reed</strong>
                <small>Chief Cardiologist · MD, FACC</small>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT LOGIN FORM */}
        <div className="login-card">
          <div className="login-header-group">
            <h1>Sign In to Portal</h1>
            <p className="login-subtitle">
              Enter your credentials to access your appointments and medical records.
            </p>
          </div>

          {/* QUICK DEMO CREDENTIALS SHORTCUTS */}
          <div className="demo-credentials-hud" style={{
            background: "rgba(45, 212, 191, 0.06)",
            border: "1px solid rgba(45, 212, 191, 0.2)",
            borderRadius: "12px",
            padding: "12px",
            marginBottom: "18px"
          }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#2dd4bf", letterSpacing: "0.05em", marginBottom: "8px" }}>
              QUICK TEST ACCOUNTS:
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => fillDemo("admin@medicare.com", "Admin123!")}
                style={{
                  padding: "5px 10px",
                  fontSize: "11px",
                  fontWeight: "700",
                  background: "rgba(16, 185, 129, 0.2)",
                  border: "1px solid #10b981",
                  borderRadius: "6px",
                  color: "#6ee7b7",
                  cursor: "pointer"
                }}
              >
                🛡️ Admin Panel
              </button>
              <button
                type="button"
                onClick={() => fillDemo("sarah.jenkins@medicare.com", "Doctor123!")}
                style={{
                  padding: "5px 10px",
                  fontSize: "11px",
                  fontWeight: "600",
                  background: "rgba(14, 165, 233, 0.15)",
                  border: "1px solid rgba(14, 165, 233, 0.4)",
                  borderRadius: "6px",
                  color: "#7dd3fc",
                  cursor: "pointer"
                }}
              >
                🩺 Doctor
              </button>
              <button
                type="button"
                onClick={() => fillDemo("vineethjrbusiness@gmail.com", "Doctor123!")}
                style={{
                  padding: "5px 10px",
                  fontSize: "11px",
                  fontWeight: "600",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "6px",
                  color: "#e2e8f0",
                  cursor: "pointer"
                }}
              >
                👤 Patient
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-input-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="form-feedback-error">
                <AlertCircleIcon size={18} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="login-btn-submit" disabled={loading}>
              <span>{loading ? "Authenticating..." : "Sign In to MediCare+"}</span>
              <ArrowRightIcon size={18} />
            </button>
          </form>

          <p className="register-text">
            Don't have an account yet? <Link to="/register">Create an account</Link>
          </p>

          <Link to="/" className="back-home">
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
