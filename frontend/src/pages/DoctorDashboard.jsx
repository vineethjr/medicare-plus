import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function DoctorDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  }

  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">
          MediCare<span>+</span>
        </div>

        <p className="sidebar-label">Doctor Menu</p>

        <button
          className="sidebar-link active"
          onClick={() => navigate("/doctor-dashboard")}
        >
          ◉ Dashboard
        </button>

        <button
          className="sidebar-link"
          onClick={() => navigate("/doctor-appointments")}
        >
          ◷ Appointments
        </button>

        <button
          className="sidebar-link"
          onClick={() => navigate("/doctor-appointments")}
        >
          👥 Patient Requests
        </button>

        <button
          className="sidebar-link"
          onClick={() =>
            alert("Patient records feature coming soon.")
          }
        >
          ▣ Patient Records
        </button>

        <button
          className="sidebar-link"
          onClick={() => navigate("/doctor-profile")}
        >
          ⚙ My Profile
        </button>

        <div className="sidebar-bottom">
          <button
            className="sidebar-link logout-link"
            onClick={handleLogout}
          >
            ↪ Logout
          </button>
        </div>
      </aside>

      {/* Main Dashboard */}
      <div className="dashboard-main">
        {/* Topbar */}
        <header className="dashboard-topbar">
          <div className="topbar-heading">
            <h2>Doctor Dashboard</h2>
            <p>Your professional healthcare overview</p>
          </div>

          <div className="topbar-user">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || "D"}
            </div>

            <div className="user-details">
              <strong>Dr. {user?.name || "Doctor"}</strong>
              <span>Doctor Account</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="dashboard-content">
          {/* Welcome Section */}
          <section className="dashboard-welcome">
            <div>
              <span className="welcome-label">
                Welcome back, Doctor
              </span>

              <h1>
                Hello, Dr. {user?.name || "Doctor"} 👨‍⚕️
              </h1>

              <p>
                Manage your appointments, patient requests,
                and consultation records from one place.
              </p>
            </div>

            <div className="welcome-icon">🩺</div>
          </section>

          {/* Overview */}
          <div className="dashboard-section-title">
            <h3>Overview</h3>
            <span>Your professional summary</span>
          </div>

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon teal">📅</div>

              <div>
                <h4>Today's Appointments</h4>
                <strong>0</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon blue">👥</div>

              <div>
                <h4>Total Patients</h4>
                <strong>0</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange">📩</div>

              <div>
                <h4>Pending Requests</h4>
                <strong>0</strong>
              </div>
            </div>
          </section>

          {/* Quick Access */}
          <div className="dashboard-section-title">
            <h3>Quick Access</h3>
            <span>Manage your professional activities</span>
          </div>

          <section className="feature-grid">
            {/* Appointments */}
            <div className="feature-card">
              <div className="feature-card-icon">📅</div>

              <h3>Appointments</h3>

              <p>
                View your scheduled consultations and manage
                upcoming appointments.
              </p>

              <button
                className="dashboard-button"
                onClick={() =>
                  navigate("/doctor-appointments")
                }
              >
                View Appointments →
              </button>
            </div>

            {/* Patient Requests */}
            <div className="feature-card">
              <div className="feature-card-icon">👥</div>

              <h3>Patient Requests</h3>

              <p>
                Review and respond to consultation requests
                from patients.
              </p>

              <button
                className="dashboard-button"
                onClick={() =>
                  navigate("/doctor-appointments")
                }
              >
                View Requests →
              </button>
            </div>

            {/* Doctor Profile */}
            <div className="feature-card">
              <div className="feature-card-icon">⚙</div>

              <h3>My Profile</h3>

              <p>
                Update your specialization, experience,
                and professional information.
              </p>

              <button
                className="dashboard-button"
                onClick={() => navigate("/doctor-profile")}
              >
                Edit Profile →
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default DoctorDashboard;