import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function PatientDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [stats, setStats] = useState({
    totalAppointments: 0,
    confirmedAppointments: 0,
    pendingAppointments: 0,
  });

  const [loadingStats, setLoadingStats] = useState(true);

  // ================================
  // FETCH PATIENT STATISTICS
  // ================================

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch(
          "http://localhost:5000/api/appointments/patient/stats",
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
          "Failed to load patient statistics:",
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

      {/* =========================
          SIDEBAR
      ========================== */}

      <aside className="dashboard-sidebar">

        <div className="dashboard-logo">
          MediCare<span>+</span>
        </div>

        <p className="sidebar-label">
          Patient Menu
        </p>

        {/* DASHBOARD */}

        <button
          className="sidebar-link active"
          onClick={() =>
            navigate("/patient-dashboard")
          }
        >
          ◉ Dashboard
        </button>

        {/* FIND DOCTOR */}

        <button
          className="sidebar-link"
          onClick={() =>
            navigate("/find-doctor")
          }
        >
          ⚕ Find a Doctor
        </button>

        {/* AI RECOMMENDATION */}

        <button
          className="sidebar-link"
          onClick={() =>
            navigate("/doctor-recommendation")
          }
        >
          🤖 AI Doctor Recommendation
        </button>

        {/* APPOINTMENTS */}

        <button
          className="sidebar-link"
          onClick={() =>
            navigate("/patient-appointments")
          }
        >
          ◷ My Appointments
        </button>

        {/* MEDICAL RECORDS */}

        <button
          className="sidebar-link"
          onClick={() =>
            navigate("/patient-medical-records")
          }
        >
          ▣ Medical Records
        </button>

        {/* LOGOUT */}

        <div className="sidebar-bottom">

          <button
            className="sidebar-link logout-link"
            onClick={handleLogout}
          >
            ↪ Logout
          </button>

        </div>

      </aside>

      {/* =========================
          MAIN
      ========================== */}

      <div className="dashboard-main">

        {/* TOPBAR */}

        <header className="dashboard-topbar">

          <div className="topbar-heading">

            <h2>
              Patient Dashboard
            </h2>

            <p>
              Your personal healthcare overview
            </p>

          </div>

          <div className="topbar-user">

            <div className="user-avatar">

              {user?.name
                ?.charAt(0)
                .toUpperCase() || "P"}

            </div>

            <div className="user-details">

              <strong>
                {user?.name || "Patient"}
              </strong>

              <span>
                Patient Account
              </span>

            </div>

          </div>

        </header>

        {/* CONTENT */}

        <main className="dashboard-content">

          {/* WELCOME */}

          <section className="dashboard-welcome">

            <div>

              <span className="welcome-label">
                Welcome back
              </span>

              <h1>
                Hello,{" "}
                {user?.name || "Patient"} 👋
              </h1>

              <p>
                Manage your appointments, find
                doctors, and access your healthcare
                services from one place.
              </p>

            </div>

            <div className="welcome-icon">
              🏥
            </div>

          </section>

          {/* OVERVIEW */}

          <div className="dashboard-section-title">

            <h3>
              Overview
            </h3>

            <span>
              Your healthcare summary
            </span>

          </div>

          {/* STATS */}

          <section className="stats-grid">

            {/* TOTAL */}

            <div className="stat-card">

              <div className="stat-icon teal">
                📅
              </div>

              <div>

                <h4>
                  Total Appointments
                </h4>

                <strong>
                  {loadingStats
                    ? "..."
                    : stats.totalAppointments}
                </strong>

              </div>

            </div>

            {/* CONFIRMED */}

            <div className="stat-card">

              <div className="stat-icon blue">
                ✅
              </div>

              <div>

                <h4>
                  Confirmed
                </h4>

                <strong>
                  {loadingStats
                    ? "..."
                    : stats.confirmedAppointments}
                </strong>

              </div>

            </div>

            {/* PENDING */}

            <div className="stat-card">

              <div className="stat-icon orange">
                ⏳
              </div>

              <div>

                <h4>
                  Pending
                </h4>

                <strong>
                  {loadingStats
                    ? "..."
                    : stats.pendingAppointments}
                </strong>

              </div>

            </div>

          </section>

          {/* QUICK ACCESS */}

          <div className="dashboard-section-title">

            <h3>
              Quick Access
            </h3>

            <span>
              Access your healthcare services
            </span>

          </div>

          <section className="feature-grid">

            {/* FIND DOCTOR */}

            <div className="feature-card">

              <div className="feature-card-icon">
                ⚕
              </div>

              <h3>
                Find a Doctor
              </h3>

              <p>
                Search for doctors by
                specialization, hospital, or name.
              </p>

              <button
                className="dashboard-button"
                onClick={() =>
                  navigate("/find-doctor")
                }
              >
                Find Doctor →
              </button>

            </div>

            {/* AI RECOMMENDATION */}

            <div className="feature-card">

              <div className="feature-card-icon">
                🤖
              </div>

              <h3>
                AI Doctor Recommendation
              </h3>

              <p>
                Describe your symptoms and get an
                AI-assisted specialist recommendation.
              </p>

              <button
                className="dashboard-button"
                onClick={() =>
                  navigate(
                    "/doctor-recommendation"
                  )
                }
              >
                Check Symptoms →
              </button>

            </div>

            {/* APPOINTMENTS */}

            <div className="feature-card">

              <div className="feature-card-icon">
                📅
              </div>

              <h3>
                My Appointments
              </h3>

              <p>
                View your booked consultations and
                track appointment status.
              </p>

              <button
                className="dashboard-button"
                onClick={() =>
                  navigate(
                    "/patient-appointments"
                  )
                }
              >
                View Appointments →
              </button>

            </div>

            {/* MEDICAL RECORDS */}

            <div className="feature-card">

              <div className="feature-card-icon">
                📋
              </div>

              <h3>
                Medical Records
              </h3>

              <p>
                View your diagnosis, prescriptions,
                doctor's notes and follow-up details.
              </p>

              <button
                className="dashboard-button"
                onClick={() =>
                  navigate(
                    "/patient-medical-records"
                  )
                }
              >
                View Medical Records →
              </button>

            </div>

          </section>

        </main>

      </div>

    </div>
  );
}

export default PatientDashboard;