import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DoctorDashboard.css";

function DoctorDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    pendingRequests: 0,
  });

  const [loadingStats, setLoadingStats] = useState(true);

  // ========================================
  // FETCH DOCTOR STATISTICS
  // ========================================

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(
          "http://localhost:5000/api/appointments/doctor/stats",
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
        console.error(
          "Failed to load doctor statistics:",
          error
        );
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

  // ========================================
  // LOGOUT
  // ========================================

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  }

  const doctorName = user?.name || "Doctor";

  return (
    <div className="doctor-dashboard">

      {/* =====================================
          SIDEBAR
      ====================================== */}

      <aside className="doctor-sidebar">

        <div className="doctor-brand">
          <div className="brand-mark">
            +
          </div>

          <div>
            <h2>
              MediCare<span>+</span>
            </h2>

            <small>
              Clinical Intelligence
            </small>
          </div>
        </div>

        <div className="doctor-sidebar-section">
          <span>WORKSPACE</span>
        </div>

        <nav className="doctor-navigation">

          <button
            className="doctor-nav-item active"
            onClick={() =>
              navigate("/doctor-dashboard")
            }
          >
            <span className="nav-icon">⌂</span>
            <span>Dashboard</span>
          </button>

          <button
            className="doctor-nav-item"
            onClick={() =>
              navigate("/doctor-appointments")
            }
          >
            <span className="nav-icon">◷</span>
            <span>Appointments</span>
          </button>

          <button
            className="doctor-nav-item"
            onClick={() =>
              navigate("/doctor-appointments")
            }
          >
            <span className="nav-icon">♧</span>
            <span>Patient Requests</span>

            {stats.pendingRequests > 0 && (
              <span className="nav-badge">
                {stats.pendingRequests}
              </span>
            )}
          </button>

          <button
            className="doctor-nav-item"
            onClick={() =>
              navigate("/doctor-medical-records")
            }
          >
            <span className="nav-icon">▣</span>
            <span>Patient Records</span>
          </button>

          <button
            className="doctor-nav-item"
            onClick={() =>
              navigate("/doctor-profile")
            }
          >
            <span className="nav-icon">⚙</span>
            <span>My Profile</span>
          </button>

        </nav>

        <div className="doctor-sidebar-footer">

          <div className="system-status">
            <span className="status-dot"></span>

            <div>
              <strong>System Online</strong>
              <small>MediCare+ Core</small>
            </div>
          </div>

          <button
            className="doctor-logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* =====================================
          MAIN AREA
      ====================================== */}

      <main className="doctor-main">

        {/* TOP BAR */}

        <header className="doctor-topbar">

          <div>
            <span className="topbar-eyebrow">
              MEDICARE+ / CLINICAL CONSOLE
            </span>

            <h1>
              Doctor Dashboard
            </h1>

            <p>
              Monitor your clinical activity and
              patient consultations.
            </p>
          </div>

          <div className="doctor-profile-mini">

            <div className="doctor-avatar">
              {doctorName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                Dr. {doctorName}
              </strong>

              <span>
                Doctor Account
              </span>
            </div>

            <div className="online-indicator"></div>

          </div>

        </header>

        {/* =====================================
            HERO
        ====================================== */}

        <section className="doctor-hero">

          <div className="hero-glow glow-one"></div>
          <div className="hero-glow glow-two"></div>

          <div className="hero-content">

            <div className="hero-tag">
              <span></span>
              CLINICAL COMMAND CENTER
            </div>

            <h2>
              Good day,{" "}
              <strong>
                Dr. {doctorName}
              </strong>
            </h2>

            <p>
              Everything you need to manage your
              appointments and patient consultations
              is right here.
            </p>

            <div className="hero-actions">

              <button
                className="primary-hero-btn"
                onClick={() =>
                  navigate("/doctor-appointments")
                }
              >
                View Appointments
                <span>→</span>
              </button>

              <button
                className="secondary-hero-btn"
                onClick={() =>
                  navigate("/doctor-profile")
                }
              >
                Manage Profile
              </button>

            </div>

          </div>

          <div className="hero-medical-visual">

            <div className="medical-orbit orbit-one"></div>
            <div className="medical-orbit orbit-two"></div>

            <div className="medical-core">
              <span>+</span>
            </div>

            <div className="floating-medical-card card-top">
              <span>♥</span>
              <div>
                <strong>Patient Care</strong>
                <small>Active</small>
              </div>
            </div>

            <div className="floating-medical-card card-bottom">
              <span>✓</span>
              <div>
                <strong>System Ready</strong>
                <small>100% Online</small>
              </div>
            </div>

          </div>

        </section>

        {/* =====================================
            OVERVIEW HEADER
        ====================================== */}

        <div className="doctor-section-heading">

          <div>
            <span>LIVE OVERVIEW</span>
            <h2>Clinical Activity</h2>
          </div>

          <div className="live-indicator">
            <span></span>
            Live Data
          </div>

        </div>

        {/* =====================================
            STATISTICS
        ====================================== */}

        <section className="doctor-stats-grid">

          {/* TODAY */}

          <div className="doctor-stat-card">

            <div className="stat-card-top">
              <span className="stat-label">
                TODAY
              </span>

              <div className="stat-symbol teal-symbol">
                ◷
              </div>
            </div>

            <div className="stat-number">
              {loadingStats
                ? "..."
                : stats.todayAppointments}
            </div>

            <div className="stat-description">
              Scheduled appointments
            </div>

            <div className="stat-line">
              <span></span>
            </div>

          </div>

          {/* PATIENTS */}

          <div className="doctor-stat-card">

            <div className="stat-card-top">
              <span className="stat-label">
                PATIENTS
              </span>

              <div className="stat-symbol blue-symbol">
                ♧
              </div>
            </div>

            <div className="stat-number">
              {loadingStats
                ? "..."
                : stats.totalPatients}
            </div>

            <div className="stat-description">
              Total patients consulted
            </div>

            <div className="stat-line">
              <span></span>
            </div>

          </div>

          {/* REQUESTS */}

          <div className="doctor-stat-card">

            <div className="stat-card-top">
              <span className="stat-label">
                REQUESTS
              </span>

              <div className="stat-symbol orange-symbol">
                !
              </div>
            </div>

            <div className="stat-number">
              {loadingStats
                ? "..."
                : stats.pendingRequests}
            </div>

            <div className="stat-description">
              Pending consultation requests
            </div>

            <div className="stat-line">
              <span></span>
            </div>

          </div>

        </section>

        {/* =====================================
            QUICK ACTIONS
        ====================================== */}

        <div className="doctor-section-heading actions-heading">

          <div>
            <span>QUICK ACTIONS</span>
            <h2>Clinical Workspace</h2>
          </div>

        </div>

        <section className="doctor-action-grid">

          {/* APPOINTMENTS */}

          <div className="doctor-action-card primary-action">

            <div className="action-icon">
              ◷
            </div>

            <div className="action-content">

              <span className="action-code">
                01 / APPOINTMENTS
              </span>

              <h3>
                Manage Appointments
              </h3>

              <p>
                Review requests, confirm patients,
                and complete consultations.
              </p>

              <button
                onClick={() =>
                  navigate("/doctor-appointments")
                }
              >
                Open Workspace →
              </button>

            </div>

          </div>

          {/* PATIENT RECORDS */}

          <div className="doctor-action-card">

            <div className="action-icon">
              ▣
            </div>

            <div className="action-content">

              <span className="action-code">
                02 / MEDICAL RECORDS
              </span>

              <h3>
                Patient Records
              </h3>

              <p>
                Access consultation history,
                diagnoses, prescriptions and
                follow-up information.
              </p>

              <button
                onClick={() =>
                  navigate(
                    "/doctor-medical-records"
                  )
                }
              >
                View Records →
              </button>

            </div>

          </div>

          {/* PROFILE */}

          <div className="doctor-action-card">

            <div className="action-icon">
              ⚙
            </div>

            <div className="action-content">

              <span className="action-code">
                03 / PROFILE
              </span>

              <h3>
                Professional Profile
              </h3>

              <p>
                Maintain your specialization,
                experience, hospital and
                consultation information.
              </p>

              <button
                onClick={() =>
                  navigate("/doctor-profile")
                }
              >
                Edit Profile →
              </button>

            </div>

          </div>

        </section>

        {/* FOOTER */}

        <footer className="doctor-dashboard-footer">
          <span>
            MediCare+ Clinical Intelligence System
          </span>

          <span>
            Secure Healthcare Environment
          </span>
        </footer>

      </main>

    </div>
  );
}

export default DoctorDashboard;