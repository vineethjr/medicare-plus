import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserIcon,
  StethoscopeIcon,
  ShieldCheckIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from "../components/Icons";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "patient",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  function handleRoleSelect(role) {
    setFormData({
      ...formData,
      role,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!formData.role) {
      setError("Please select whether you are a patient or a doctor.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      setMessage("Account created successfully! Redirecting you to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1400);
    } catch {
      setError(
        "Unable to connect to MediCare+ service. Please verify the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <div className="register-split-container">
        {/* LEFT SHOWCASE PANEL */}
        <div className="register-showcase-panel">
          <div className="showcase-brand">
            <div className="brand-icon-box">+</div>
            <div>
              MediCare<strong>+</strong>
              <small className="brand-subtitle-tag">CLINICAL INTELLIGENCE</small>
            </div>
          </div>

          <div className="showcase-hero-text">
            <h2>Join the Futuristic Digital Health Network.</h2>
            <p>
              A unified tele-clinical ecosystem connecting patients with certified specialists with 100% transparent pay-upon-confirmation protection.
            </p>
          </div>

          <div className="showcase-role-benefits">
            <div className="benefit-block">
              <div className="benefit-header-row">
                <span className="benefit-badge">FOR PATIENTS</span>
                <ShieldCheckIcon size={18} className="benefit-icon-svg" />
              </div>
              <h4>Zero-Risk Booking Guarantee</h4>
              <p>Reserve consultation slots with doctors with ₹0 upfront charges. Pay only once your doctor confirms availability.</p>
            </div>

            <div className="benefit-block">
              <div className="benefit-header-row">
                <span className="benefit-badge doctor-badge">FOR DOCTORS</span>
                <StethoscopeIcon size={18} className="benefit-icon-svg" />
              </div>
              <h4>Clinical Command Center</h4>
              <p>Review appointments, issue structured digital prescriptions, conduct WebRTC video visits, and track earnings.</p>
            </div>
          </div>

          <div className="register-trust-badge">
            <ShieldCheckIcon size={16} />
            <span>HIPAA Compliant • 256-Bit E2EE • Verified Medical Registry</span>
          </div>
        </div>

        {/* RIGHT REGISTRATION FORM */}
        <div className="register-card">
          <div className="register-header-group">
            <h1>Create Account</h1>
            <p className="register-subtitle">
              Choose your role and register to access the medical portal.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            {/* ROLE SELECTOR */}
            <div className="role-selector-container">
              <span className="role-selector-label">I am joining as:</span>
              <div className="role-pill-group">
                <button
                  type="button"
                  className={`role-pill-option ${formData.role === "patient" ? "active" : ""}`}
                  onClick={() => handleRoleSelect("patient")}
                >
                  <div className="role-pill-icon-box">
                    <UserIcon size={20} />
                  </div>
                  <div className="role-pill-text">
                    <strong>Patient</strong>
                    <small>Book care & consult</small>
                  </div>
                </button>

                <button
                  type="button"
                  className={`role-pill-option ${formData.role === "doctor" ? "active" : ""}`}
                  onClick={() => handleRoleSelect("doctor")}
                >
                  <div className="role-pill-icon-box doctor-icon-box">
                    <StethoscopeIcon size={20} />
                  </div>
                  <div className="role-pill-text">
                    <strong>Doctor</strong>
                    <small>Clinical practice</small>
                  </div>
                </button>
              </div>
            </div>

            <div className="register-input-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder={formData.role === "doctor" ? "Dr. Full Name" : "Your Full Name"}
                value={formData.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>

            <div className="register-input-group">
              <label htmlFor="email">Email Address</label>
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

            <div className="register-input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="register-input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="form-feedback-error">
                <AlertCircleIcon size={18} />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="form-feedback-success">
                <CheckCircleIcon size={18} />
                <span>{message}</span>
              </div>
            )}

            <button type="submit" className="register-btn-submit" disabled={loading}>
              <span>{loading ? "Creating Account..." : "Create Account"}</span>
              <ArrowRightIcon size={18} />
            </button>
          </form>

          <p className="login-redirect-text">
            Already have an account? <Link to="/login">Sign in here</Link>
          </p>

          <Link to="/" className="back-home">
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;