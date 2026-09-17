import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function PatientDashboard() {
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

        <p className="sidebar-label">Patient Menu</p>

        <button
          className="sidebar-link active"
          onClick={() => navigate("/patient-dashboard")}
        >
          ◉ Dashboard
        </button>

        <button
          className="sidebar-link"
          onClick={() => navigate("/find-doctor")}
        >
          ⌕ Find a Doctor
        </button>

        <button
          className="sidebar-link"
          onClick={() => alert("Appointments feature coming soon.")}
        >
          ◷ My Appointments
        </button>

        <button
          className="sidebar-link"
          onClick={() => alert("Medical records feature coming soon.")}
        >
          ▣ Medical Records
        </button>

        <button
          className="sidebar-link"
          onClick={() => alert("Patient profile feature coming soon.")}
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
            <h2>Patient Dashboard</h2>
            <p>Your healthcare overview</p>
          </div>

          <div className="topbar-user">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || "P"}
            </div>

            <div className="user-details">
              <strong>{user?.name || "Patient"}</strong>
              <span>Patient Account</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="dashboard-content">
          {/* Welcome Section */}
          <section className="dashboard-welcome">
            <div>
              <span className="welcome-label">Welcome back</span>

              <h1>
                Hello, {user?.name || "Patient"} 👋
              </h1>

              <p>
                Take care of your health with simple, reliable,
                and accessible healthcare services.
              </p>
            </div>

            <div className="welcome-icon">🩺</div>
          </section>

          {/* Overview */}
          <div className="dashboard-section-title">
            <h3>Overview</h3>
            <span>Your account summary</span>
          </div>

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon teal">📅</div>

              <div>
                <h4>Upcoming Appointments</h4>
                <strong>0</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon blue">👨‍⚕️</div>

              <div>
                <h4>Consulted Doctors</h4>
                <strong>0</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange">📄</div>

              <div>
                <h4>Medical Records</h4>
                <strong>0</strong>
              </div>
            </div>
          </section>

          {/* Quick Access */}
          <div className="dashboard-section-title">
            <h3>Quick Access</h3>
            <span>Manage your healthcare</span>
          </div>

          <section className="feature-grid">
            {/* Find Doctor */}
            <div className="feature-card">
              <div className="feature-card-icon">👨‍⚕️</div>

              <h3>Find a Doctor</h3>

              <p>
                Search for doctors based on specialization,
                availability, and consultation needs.
              </p>

              <button
                className="dashboard-button"
                onClick={() => navigate("/find-doctor")}
              >
                Find Doctors →
              </button>
            </div>

            {/* Appointments */}
            <div className="feature-card">
              <div className="feature-card-icon">📅</div>

              <h3>My Appointments</h3>

              <p>
                View your upcoming consultations and manage
                your appointment requests.
              </p>

              <button
  className="dashboard-button"
  onClick={() => navigate("/patient-appointments")}
>
  View Appointments →
</button>
            </div>

            {/* Medical Records */}
            <div className="feature-card">
              <div className="feature-card-icon">📋</div>

              <h3>Medical Records</h3>

              <p>
                Access your medical history, prescriptions,
                and consultation records.
              </p>

              <button
                className="dashboard-button"
                onClick={() =>
                  alert("Medical records feature coming soon.")
                }
              >
                View Records →
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default PatientDashboard;