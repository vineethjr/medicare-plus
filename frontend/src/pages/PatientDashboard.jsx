import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import {
  ActivityIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  DoctorIcon,
  DropletIcon,
  FileTextIcon,
  HeartPulseIcon,
  HospitalIcon,
  LogOutIcon,
  LungsIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserIcon,
  ArrowRightIcon,
} from "../components/Icons";
import { API_URL } from "../config";

function PatientDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const [stats, setStats] = useState({
    totalAppointments: 0,
    confirmedAppointments: 0,
    pendingAppointments: 0,
    unpaidAppointments: 0,
    paidAppointments: 0,
  });

  const [loadingStats, setLoadingStats] = useState(true);

  // ================================
  // FETCH PATIENT STATISTICS
  // ================================

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(
          `${API_URL}/appointments/patient/stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setStats(data);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error("Failed to load patient statistics:", error);
      } finally {
        setLoadingStats(false);
      }
    }

    if (token) {
      fetchStats();
    } else {
      setLoadingStats(false);
    }
  }, [token]);

  // ================================
  // LOGOUT
  // ================================

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <div className="dashboard-page">
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">
          <div className="dashboard-logo-icon">+</div>
          <div>MediCare<span>+</span></div>
        </div>

        <div className="sidebar-section-title">
          <span>PATIENT WORKSPACE</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className="sidebar-link active"
            onClick={() => navigate("/patient-dashboard")}
          >
            <span className="sidebar-link-icon"><ActivityIcon size={18} /></span>
            <span>Overview</span>
          </button>

          <button
            className="sidebar-link"
            onClick={() => navigate("/find-doctor")}
          >
            <span className="sidebar-link-icon"><SearchIcon size={18} /></span>
            <span>Find a Doctor</span>
          </button>

          <button
            className="sidebar-link"
            onClick={() => navigate("/doctor-recommendation")}
          >
            <span className="sidebar-link-icon"><SparklesIcon size={18} /></span>
            <span>AI Symptom Checker</span>
          </button>

          <button
            className="sidebar-link"
            onClick={() => navigate("/patient-appointments")}
          >
            <span className="sidebar-link-icon"><CalendarIcon size={18} /></span>
            <span>My Appointments</span>
            {stats.unpaidAppointments > 0 && (
              <span className="sidebar-nav-badge">
                Pay ({stats.unpaidAppointments})
              </span>
            )}
          </button>

          <button
            className="sidebar-link"
            onClick={() => navigate("/patient-medical-records")}
          >
            <span className="sidebar-link-icon"><FileTextIcon size={18} /></span>
            <span>Medical Records</span>
          </button>

          <button
            className="sidebar-link"
            onClick={() => navigate("/patient-profile")}
          >
            <span className="sidebar-link-icon"><UserIcon size={18} /></span>
            <span>My Health Dossier</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-system-status">
            <span className="status-dot-pulse"></span>
            <div>
              <strong>Secure Portal</strong>
              <small>E2EE Verified</small>
            </div>
          </div>

          <button className="sidebar-link logout-link" onClick={handleLogout}>
            <span className="sidebar-link-icon"><LogOutIcon size={18} /></span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="dashboard-main">
        {/* TOPBAR */}
        <header className="dashboard-topbar">
          <div className="topbar-heading">
            <h2>Patient Portal</h2>
            <p>Welcome to your personal health management suite</p>
          </div>

          <div
            className="topbar-user"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/patient-profile")}
            title="Manage your health profile"
          >
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || "P"}
            </div>
            <div className="user-details">
              <strong>{user?.name || "Patient"}</strong>
              <span>Verified Health Dossier</span>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="dashboard-content">
          {/* FUTURISTIC WELCOME HERO */}
          <section className="patient-hero">
            <div className="hero-glow glow-one"></div>
            <div className="hero-glow glow-two"></div>

            <div className="patient-hero-left">
              <div className="patient-hero-tag">
                <span className="pulse-dot"></span>
                <span className="patient-hero-tag-text">TELEHEALTH & CLINICAL PATIENT HUB</span>
              </div>
              <h2>
                Welcome back, <strong>{user?.name || "Patient"}</strong>
              </h2>
              <p>
                Browse verified specialists, consult through secure real-time video,
                and pay consultation fees only after your doctor confirms your slot.
              </p>
              <div className="hero-actions">
                <button
                  className="primary-hero-btn"
                  onClick={() => navigate("/find-doctor")}
                >
                  <SearchIcon size={16} />
                  <span>Find a Doctor</span>
                  <ArrowRightIcon size={16} />
                </button>
                <button
                  className="secondary-hero-btn"
                  onClick={() => navigate("/doctor-recommendation")}
                >
                  <SparklesIcon size={16} />
                  <span>AI Symptom Checker</span>
                </button>
              </div>
            </div>

            <div className="patient-hero-visual">
              <div className="medical-orbit orbit-one"></div>
              <div className="medical-orbit orbit-two"></div>
              <div className="medical-core">
                <HeartPulseIcon size={28} />
              </div>

              <div className="floating-medical-card card-top">
                <ShieldCheckIcon size={18} />
                <div>
                  <small>PROTECTED BOOKING</small>
                  <strong>Pay On Confirmation</strong>
                </div>
              </div>

              <div className="floating-medical-card card-bottom">
                <ActivityIcon size={18} />
                <div>
                  <small>SYSTEM STATUS</small>
                  <strong>100% Online</strong>
                </div>
              </div>
            </div>
          </section>

          {/* PATIENT VITALS STRIP */}
          <section className="patient-vitals-strip">
            <div className="vital-item">
              <span className="vital-icon-box teal">
                <HeartPulseIcon size={20} />
              </span>
              <div>
                <small>Resting Heart Rate</small>
                <strong>72 BPM <span className="vital-badge-good">Optimal</span></strong>
              </div>
            </div>
            <div className="vital-item">
              <span className="vital-icon-box red">
                <DropletIcon size={20} />
              </span>
              <div>
                <small>Blood Pressure</small>
                <strong>118/78 <span className="vital-badge-good">Normal</span></strong>
              </div>
            </div>
            <div className="vital-item">
              <span className="vital-icon-box blue">
                <LungsIcon size={20} />
              </span>
              <div>
                <small>Oxygen Saturation</small>
                <strong>99% SpO2 <span className="vital-badge-good">Optimal</span></strong>
              </div>
            </div>
            <div className="vital-item">
              <span className="vital-icon-box green">
                <ShieldCheckIcon size={20} />
              </span>
              <div>
                <small>Booking Policy</small>
                <strong>Active <span className="vital-badge-prot">Pay-On-Confirm</span></strong>
              </div>
            </div>
          </section>

          {/* PAYMENT PENDING CALLOUT BANNER */}
          {stats.unpaidAppointments > 0 && (
            <section className="payment-alert-banner">
              <div className="payment-alert-content">
                <div className="payment-alert-icon">
                  <CreditCardIcon size={24} />
                </div>
                <div className="payment-alert-text">
                  <strong>
                    Action Required: {stats.unpaidAppointments} Confirmed Consultation
                    {stats.unpaidAppointments > 1 ? "s" : ""} Awaiting Payment
                  </strong>
                  <p>
                    Your doctor has confirmed your appointment. Please pay the consultation fee
                    to secure your slot and unlock your consultation room.
                  </p>
                </div>
              </div>

              <button
                className="btn-pay-alert"
                onClick={() => navigate("/patient-appointments")}
              >
                <span>Review & Pay Now</span>
                <ArrowRightIcon size={16} />
              </button>
            </section>
          )}

          {/* OVERVIEW SECTION */}
          <div className="dashboard-section-title">
            <div>
              <span className="section-eyebrow">LIVE TELEMETRY</span>
              <h3>Consultation Summary</h3>
            </div>
            <div className="live-indicator-pill">
              <span className="pulse-dot"></span>
              <span>Live Records</span>
            </div>
          </div>

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-eyebrow">BOOKINGS</span>
                <div className="stat-icon-wrapper teal">
                  <CalendarIcon size={18} />
                </div>
              </div>
              <div className="stat-number">
                {loadingStats ? "..." : stats.totalAppointments}
              </div>
              <div className="stat-desc">Total consultations scheduled</div>
              <div className="stat-progress-bar teal"></div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-eyebrow">DOCTOR ACCEPTED</span>
                <div className="stat-icon-wrapper blue">
                  <CheckCircleIcon size={18} />
                </div>
              </div>
              <div className="stat-number">
                {loadingStats ? "..." : stats.confirmedAppointments}
              </div>
              <div className="stat-desc">Slots confirmed by doctor</div>
              <div className="stat-progress-bar blue"></div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-eyebrow">AWAITING REVIEW</span>
                <div className="stat-icon-wrapper orange">
                  <ClockIcon size={18} />
                </div>
              </div>
              <div className="stat-number">
                {loadingStats ? "..." : stats.pendingAppointments}
              </div>
              <div className="stat-desc">Pending doctor acceptance</div>
              <div className="stat-progress-bar orange"></div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-eyebrow">PAYMENT SETTLED</span>
                <div className="stat-icon-wrapper green">
                  <CreditCardIcon size={18} />
                </div>
              </div>
              <div className="stat-number">
                {loadingStats ? "..." : stats.paidAppointments || 0}
              </div>
              <div className="stat-desc">Consultation fees paid</div>
              <div className="stat-progress-bar green"></div>
            </div>
          </section>

          {/* QUICK ACCESS TILES */}
          <div className="dashboard-section-title">
            <div>
              <span className="section-eyebrow">DIRECT ACCESS</span>
              <h3>Healthcare Services</h3>
            </div>
          </div>

          <section className="feature-grid">
            <div className="feature-card">
              <div className="feature-card-icon">
                <SearchIcon size={24} />
              </div>
              <span className="feature-code">01 / SPECIALISTS</span>
              <h3>Find a Doctor</h3>
              <p>Search top doctors by specialty, hospital, ratings, and consultation fee.</p>
              <button
                className="dashboard-button"
                onClick={() => navigate("/find-doctor")}
              >
                <span>Browse Specialists</span>
                <ArrowRightIcon size={16} />
              </button>
            </div>

            <div className="feature-card">
              <div className="feature-card-icon">
                <SparklesIcon size={24} />
              </div>
              <span className="feature-code">02 / AI DIAGNOSTICS</span>
              <h3>AI Symptom Checker</h3>
              <p>Describe symptoms in natural language and receive clinical guidance.</p>
              <button
                className="dashboard-button"
                onClick={() => navigate("/doctor-recommendation")}
              >
                <span>Check Symptoms</span>
                <ArrowRightIcon size={16} />
              </button>
            </div>

            <div className="feature-card">
              <div className="feature-card-icon">
                <CalendarIcon size={24} />
              </div>
              <span className="feature-code">03 / TELEHEALTH</span>
              <h3>My Appointments</h3>
              <p>Manage scheduled appointments, pay doctor fees, and join video consultations.</p>
              <button
                className="dashboard-button"
                onClick={() => navigate("/patient-appointments")}
              >
                <span>View Bookings</span>
                <ArrowRightIcon size={16} />
              </button>
            </div>

            <div className="feature-card">
              <div className="feature-card-icon">
                <FileTextIcon size={24} />
              </div>
              <span className="feature-code">04 / HEALTH VAULT</span>
              <h3>Medical Records</h3>
              <p>Access your consultation diagnoses, certified digital prescriptions, and advice.</p>
              <button
                className="dashboard-button"
                onClick={() => navigate("/patient-medical-records")}
              >
                <span>View Records</span>
                <ArrowRightIcon size={16} />
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default PatientDashboard;