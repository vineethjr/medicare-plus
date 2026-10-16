import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DoctorDashboard.css";
import {
  ActivityIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  CreditCardIcon,
  DoctorIcon,
  FileTextIcon,
  HeartPulseIcon,
  HomeIcon,
  LogOutIcon,
  PillIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserIcon,
  VideoIcon,
  XIcon,
} from "../components/Icons";
import { API_URL } from "../config";

function DoctorDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    pendingRequests: 0,
    totalEarnings: 0,
    paidAppointments: 0,
  });

  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected patient for dossier inspection modal
  const [selectedPatientDossier, setSelectedPatientDossier] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Fetch stats and recent appointments
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        const [statsRes, apptsRes] = await Promise.all([
          fetch(`${API_URL}/appointments/doctor/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/appointments/doctor`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (statsRes.status === 401 || apptsRes.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (apptsRes.ok) {
          const apptsData = await apptsRes.json();
          setRecentAppointments(Array.isArray(apptsData) ? apptsData : []);
        }
      } catch (err) {
        console.error("Failed to load doctor dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadDashboardData();
    } else {
      navigate("/login");
    }
  }, [token, navigate]);

  // Handle appointment status update
  async function handleStatusUpdate(id, newStatus) {
    try {
      setActionLoading(id);
      const res = await fetch(`${API_URL}/appointments/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setRecentAppointments((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: newStatus } : item
          )
        );
        // Refresh stats
        const statsRes = await fetch(`${API_URL}/appointments/doctor/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setActionLoading(null);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  const doctorName = user?.name || "Doctor";
  const pendingQueue = recentAppointments.filter((a) => a.status === "Pending");
  const confirmedQueue = recentAppointments.filter(
    (a) => a.status === "Confirmed" || a.status === "Completed"
  );

  return (
    <div className="doctor-dashboard-page">
      {/* SIDEBAR */}
      <aside className="doctor-sidebar">
        <div className="doctor-brand" onClick={() => navigate("/doctor-dashboard")}>
          <div className="brand-mark">+</div>
          <div>
            <h2>MediCare<span>+</span></h2>
            <small>CLINICAL INTELLIGENCE</small>
          </div>
        </div>

        <div className="sidebar-section-title">
          <span>CLINICAL WORKSPACE</span>
        </div>

        <nav className="doctor-nav">
          <button className="nav-item active" onClick={() => navigate("/doctor-dashboard")}>
            <HomeIcon size={18} />
            <span>Command Center</span>
          </button>

          <button className="nav-item" onClick={() => navigate("/doctor-appointments")}>
            <CalendarIcon size={18} />
            <span>Consultation Schedule</span>
            {stats.pendingRequests > 0 && (
              <span className="nav-badge-alert">{stats.pendingRequests}</span>
            )}
          </button>

          <button className="nav-item" onClick={() => navigate("/doctor-medical-records")}>
            <FileTextIcon size={18} />
            <span>Patient Records</span>
          </button>

          <button className="nav-item" onClick={() => navigate("/doctor-profile")}>
            <SettingsIcon size={18} />
            <span>Physician Profile</span>
          </button>
        </nav>

        <div className="doctor-sidebar-bottom">
          <div className="system-telemetry-badge">
            <span className="pulse-indicator"></span>
            <div>
              <strong>Console Online</strong>
              <small>E2EE Clinical Mesh</small>
            </div>
          </div>

          <button className="doctor-logout-btn" onClick={handleLogout}>
            <LogOutIcon size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONSOLE */}
      <main className="doctor-main">
        {/* TOPBAR */}
        <header className="doctor-topbar">
          <div className="topbar-info">
            <span className="eyebrow-tag">
              <span className="pulse-dot"></span> MEDICARE+ CLINICAL TELEMETRY
            </span>
            <h1>Physician Command Console</h1>
            <p>Real-time patient triage, consultation scheduling, and clinical dossier reviews.</p>
          </div>

          <div className="doctor-profile-chip" onClick={() => navigate("/doctor-profile")} style={{ cursor: "pointer" }}>
            <div className="doctor-avatar">
              {doctorName.charAt(0).toUpperCase()}
            </div>
            <div className="chip-text">
              <strong>Dr. {doctorName}</strong>
              <span>Verified Specialist</span>
            </div>
          </div>
        </header>

        {/* HERO COMMAND CENTER */}
        <section className="doctor-hero-banner">
          <div className="hero-glow glow-cyan"></div>
          <div className="hero-glow glow-blue"></div>

          <div className="hero-content-left">
            <div className="doctor-hero-tag">
              <span className="hero-tag-dot"></span>
              <span className="hero-tag-text">ACTIVE CLINICAL WORKSPACE</span>
            </div>
            <h2>
              Good day, <strong>Dr. {doctorName}</strong>
            </h2>
            <p>
              You have <strong>{stats.pendingRequests} pending patient requests</strong> and{" "}
              <strong>{stats.todayAppointments} consultations scheduled</strong>. Patient consultation fees are automatically escrowed upon your confirmation.
            </p>

            <div className="hero-actions-row">
              <button
                className="btn-primary-action"
                onClick={() => navigate("/doctor-appointments")}
              >
                <CalendarIcon size={16} />
                <span>Manage Appointments</span>
                <ArrowRightIcon size={16} />
              </button>

              <button
                className="btn-secondary-action"
                onClick={() => navigate("/doctor-profile")}
              >
                <SettingsIcon size={16} />
                <span>Manage Profile</span>
              </button>
            </div>
          </div>

          {/* RADAR VISUAL */}
          <div className="hero-radar-visual">
            <div className="radar-circle radar-one"></div>
            <div className="radar-circle radar-two"></div>
            <div className="radar-core">
              <HeartPulseIcon size={28} />
            </div>

            <div className="radar-chip chip-top">
              <ShieldCheckIcon size={16} />
              <div>
                <strong>Encrypted Consults</strong>
                <small>WebRTC Active</small>
              </div>
            </div>

            <div className="radar-chip chip-bottom">
              <CheckCircleIcon size={16} />
              <div>
                <strong>Pay-On-Confirm</strong>
                <small>Guaranteed Settlements</small>
              </div>
            </div>
          </div>
        </section>

        {/* STATS TELEMETRY GRID */}
        <div className="section-header-bar">
          <div>
            <span className="section-label">LIVE TELEMETRY</span>
            <h2>Practice Performance Overview</h2>
          </div>
          <div className="live-status-pill">
            <span className="live-dot-green"></span> Live Sync Active
          </div>
        </div>

        <section className="doctor-stats-grid">
          {/* TOTAL REVENUE */}
          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-label">TOTAL REVENUE</span>
              <div className="stat-icon teal">
                <CreditCardIcon size={18} />
              </div>
            </div>
            <div className="stat-number">
              {loading ? "..." : `₹${stats.totalEarnings || 0}`}
            </div>
            <div className="stat-subtext">
              Total consultation fees settled ({stats.paidAppointments || 0} paid)
            </div>
            <div className="stat-bar teal"></div>
          </div>

          {/* SCHEDULED TODAY */}
          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-label">SCHEDULED TODAY</span>
              <div className="stat-icon blue">
                <ClockIcon size={18} />
              </div>
            </div>
            <div className="stat-number">
              {loading ? "..." : stats.todayAppointments}
            </div>
            <div className="stat-subtext">
              Active consultations for today's roster
            </div>
            <div className="stat-bar blue"></div>
          </div>

          {/* TOTAL PATIENTS */}
          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-label">PATIENT ROSTER</span>
              <div className="stat-icon purple">
                <UserIcon size={18} />
              </div>
            </div>
            <div className="stat-number">
              {loading ? "..." : stats.totalPatients}
            </div>
            <div className="stat-subtext">
              Total unique patients registered in care
            </div>
            <div className="stat-bar purple"></div>
          </div>

          {/* PENDING REQUESTS */}
          <div className="stat-card">
            <div className="stat-card-top">
              <span className="stat-label">PENDING REQUESTS</span>
              <div className="stat-icon orange">
                <AlertCircleIcon size={18} />
              </div>
            </div>
            <div className="stat-number" style={{ color: stats.pendingRequests > 0 ? "#fbbf24" : "#ffffff" }}>
              {loading ? "..." : stats.pendingRequests}
            </div>
            <div className="stat-subtext">
              Appointments awaiting your slot confirmation
            </div>
            <div className="stat-bar orange"></div>
          </div>
        </section>

        {/* CLINICAL QUEUE SECTION WITH PATIENT PROFILE DOSSIER */}
        <section className="dashboard-queue-container">
          {/* PENDING REQUESTS RADAR */}
          <div className="queue-box">
            <div className="queue-box-header">
              <div className="queue-box-title">
                <div className="queue-icon-box orange">
                  <ClockIcon size={18} />
                </div>
                <div>
                  <h3>Pending Confirmation Requests</h3>
                  <small>Review patient symptoms & medical dossier before confirming</small>
                </div>
              </div>
              <span className="queue-counter orange">{pendingQueue.length} Pending</span>
            </div>

            {pendingQueue.length === 0 ? (
              <div className="queue-empty-box">
                <CheckCircleIcon size={28} />
                <p>No pending appointment requests. All slots are confirmed or processed.</p>
              </div>
            ) : (
              <div className="queue-list">
                {pendingQueue.map((item) => (
                  <div key={item.id} className="queue-item-card">
                    <div className="queue-item-main">
                      <div className="queue-patient-avatar">
                        {item.patient_name?.charAt(0).toUpperCase() || "P"}
                      </div>
                      <div className="queue-patient-info">
                        <strong>{item.patient_name || "Patient"}</strong>
                        <span>{item.patient_email}</span>
                        <div className="queue-tags-row">
                          <span className="queue-badge date">
                            <CalendarIcon size={12} /> {item.appointment_date} at {item.appointment_time}
                          </span>
                          <span className={`queue-badge mode ${item.consultation_mode === "Online" ? "online" : "offline"}`}>
                            {item.consultation_mode === "Online" ? <VideoIcon size={12} /> : <HomeIcon size={12} />}
                            {item.consultation_mode || "Offline"}
                          </span>
                          {item.patient_blood_group && (
                            <span className="queue-badge blood">
                              Blood: {item.patient_blood_group}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {item.symptoms && (
                      <div className="queue-symptom-strip">
                        <strong>Chief Complaint:</strong> {item.symptoms}
                      </div>
                    )}

                    <div className="queue-actions-row">
                      <button
                        type="button"
                        className="btn-view-dossier"
                        onClick={() => setSelectedPatientDossier(item)}
                      >
                        <FileTextIcon size={14} />
                        <span>Inspect Patient Dossier</span>
                      </button>

                      <div className="confirm-btn-group">
                        <button
                          type="button"
                          className="btn-confirm-slot"
                          disabled={actionLoading === item.id}
                          onClick={() => handleStatusUpdate(item.id, "Confirmed")}
                        >
                          <CheckIcon size={14} />
                          <span>Confirm Slot</span>
                        </button>
                        <button
                          type="button"
                          className="btn-decline-slot"
                          disabled={actionLoading === item.id}
                          onClick={() => handleStatusUpdate(item.id, "Rejected")}
                        >
                          <XIcon size={14} />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* UPCOMING / CONFIRMED CONSULTATIONS */}
          <div className="queue-box">
            <div className="queue-box-header">
              <div className="queue-box-title">
                <div className="queue-icon-box teal">
                  <CalendarIcon size={18} />
                </div>
                <div>
                  <h3>Confirmed Consultations & Video Room</h3>
                  <small>Access live telehealth rooms or complete in-person records</small>
                </div>
              </div>
              <span className="queue-counter teal">{confirmedQueue.length} Active</span>
            </div>

            {confirmedQueue.length === 0 ? (
              <div className="queue-empty-box">
                <CalendarIcon size={28} />
                <p>No confirmed appointments yet. Confirm pending requests to unlock consultation rooms.</p>
              </div>
            ) : (
              <div className="queue-list">
                {confirmedQueue.slice(0, 5).map((item) => (
                  <div key={item.id} className="queue-item-card confirmed-card">
                    <div className="queue-item-main">
                      <div className="queue-patient-avatar teal">
                        {item.patient_name?.charAt(0).toUpperCase() || "P"}
                      </div>
                      <div className="queue-patient-info">
                        <div className="name-and-status">
                          <strong>{item.patient_name || "Patient"}</strong>
                          <span className={`status-pill ${item.payment_status === "Paid" ? "paid" : "unpaid"}`}>
                            {item.payment_status === "Paid"
                              ? "✓ Fee Paid (Settled)"
                              : "Payment Pending"}
                          </span>
                        </div>
                        <div className="queue-tags-row">
                          <span className="queue-badge date">
                            <CalendarIcon size={12} /> {item.appointment_date} at {item.appointment_time}
                          </span>
                          <span className={`queue-badge mode ${item.consultation_mode === "Online" ? "online" : "offline"}`}>
                            {item.consultation_mode === "Online" ? <VideoIcon size={12} /> : <HomeIcon size={12} />}
                            {item.consultation_mode || "Offline"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="queue-actions-row">
                      <button
                        type="button"
                        className="btn-view-dossier"
                        onClick={() => setSelectedPatientDossier(item)}
                      >
                        <FileTextIcon size={14} />
                        <span>Patient Dossier</span>
                      </button>

                      {item.consultation_mode === "Online" ? (
                        item.payment_status === "Paid" ? (
                          <button
                            type="button"
                            className="btn-join-telehealth"
                            onClick={() => navigate(`/online-consultation/${item.id}`)}
                          >
                            <VideoIcon size={15} />
                            <span>Launch Video Studio</span>
                          </button>
                        ) : (
                          <span className="waiting-fee-tag">
                            <ClockIcon size={13} /> Awaiting Fee (₹{item.payment_amount || 500})
                          </span>
                        )
                      ) : (
                        <button
                          type="button"
                          className="btn-complete-offline"
                          onClick={() => navigate("/doctor-appointments")}
                        >
                          <CheckCircleIcon size={14} />
                          <span>Manage Consultation</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* WORKSPACE ACTION CARDS */}
        <div className="section-header-bar" style={{ marginTop: "32px" }}>
          <div>
            <span className="section-label">CLINICAL SUITE</span>
            <h2>Essential Workflows</h2>
          </div>
        </div>

        <section className="doctor-action-grid">
          <div className="doctor-action-card primary" onClick={() => navigate("/doctor-appointments")}>
            <div className="action-card-icon teal">
              <CalendarIcon size={24} />
            </div>
            <div className="action-card-content">
              <span className="action-code">01 / CALENDAR</span>
              <h3>Consultation Calendar</h3>
              <p>Review comprehensive appointment histories, patient messages, and consultation status.</p>
              <div className="action-link">Open Appointments →</div>
            </div>
          </div>

          <div className="doctor-action-card" onClick={() => navigate("/doctor-medical-records")}>
            <div className="action-card-icon blue">
              <FileTextIcon size={24} />
            </div>
            <div className="action-card-content">
              <span className="action-code">02 / RECORDS</span>
              <h3>Clinical Medical Records</h3>
              <p>Issue digital prescriptions, diagnostic notes, and view past patient treatment records.</p>
              <div className="action-link">Access Records →</div>
            </div>
          </div>

          <div className="doctor-action-card" onClick={() => navigate("/doctor-profile")}>
            <div className="action-card-icon orange">
              <SettingsIcon size={24} />
            </div>
            <div className="action-card-content">
              <span className="action-code">03 / CREDENTIALS</span>
              <h3>Physician Profile</h3>
              <p>Configure clinical specialties, consultation fees, hospital affiliations, and active hours.</p>
              <div className="action-link">Edit Profile →</div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="doctor-footer">
          <span>MediCare+ Clinical Intelligence Tele-Presence Suite</span>
          <span>End-to-End Encrypted Medical Platform</span>
        </footer>
      </main>

      {/* PATIENT MEDICAL DOSSIER MODAL */}
      {selectedPatientDossier && (
        <div className="modal-backdrop" onClick={() => setSelectedPatientDossier(null)}>
          <div className="patient-dossier-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dossier-modal-header">
              <div className="dossier-header-title">
                <div className="dossier-avatar">
                  {selectedPatientDossier.patient_name?.charAt(0).toUpperCase() || "P"}
                </div>
                <div>
                  <h3>{selectedPatientDossier.patient_name || "Patient Name"}</h3>
                  <span className="dossier-email">{selectedPatientDossier.patient_email}</span>
                </div>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setSelectedPatientDossier(null)}
              >
                <XIcon size={20} />
              </button>
            </div>

            <div className="dossier-modal-body">
              {/* VITAL BIOMETRICS */}
              <div className="dossier-card">
                <h4>
                  <HeartPulseIcon size={16} /> Physical Biometrics & Vitals
                </h4>
                <div className="dossier-metrics-grid">
                  <div className="dossier-metric-item">
                    <small>AGE</small>
                    <strong>{selectedPatientDossier.patient_age ? `${selectedPatientDossier.patient_age} yrs` : "Not provided"}</strong>
                  </div>
                  <div className="dossier-metric-item">
                    <small>GENDER</small>
                    <strong>{selectedPatientDossier.patient_gender || "Not specified"}</strong>
                  </div>
                  <div className="dossier-metric-item">
                    <small>BLOOD GROUP</small>
                    <strong style={{ color: "#f87171" }}>
                      {selectedPatientDossier.patient_blood_group || "Unknown"}
                    </strong>
                  </div>
                  <div className="dossier-metric-item">
                    <small>HEIGHT</small>
                    <strong>{selectedPatientDossier.patient_height ? `${selectedPatientDossier.patient_height} cm` : "--"}</strong>
                  </div>
                  <div className="dossier-metric-item">
                    <small>WEIGHT</small>
                    <strong>{selectedPatientDossier.patient_weight ? `${selectedPatientDossier.patient_weight} kg` : "--"}</strong>
                  </div>
                  <div className="dossier-metric-item">
                    <small>CALCULATED BMI</small>
                    <strong>
                      {selectedPatientDossier.patient_height && selectedPatientDossier.patient_weight
                        ? `${(selectedPatientDossier.patient_weight / Math.pow(selectedPatientDossier.patient_height / 100, 2)).toFixed(1)} kg/m²`
                        : "--"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* ALLERGIES & CHRONIC CONDITIONS */}
              <div className="dossier-card">
                <h4>
                  <AlertCircleIcon size={16} /> Clinical Warnings & Allergies
                </h4>
                <div className="dossier-alert-box danger">
                  <strong>KNOWN ALLERGIES:</strong>
                  <p>
                    {selectedPatientDossier.patient_allergies || "No known drug/food allergies recorded."}
                  </p>
                </div>
                <div className="dossier-alert-box warning" style={{ marginTop: "10px" }}>
                  <strong>CHRONIC CONDITIONS:</strong>
                  <p>
                    {selectedPatientDossier.patient_chronic_conditions || "None reported by patient."}
                  </p>
                </div>
              </div>

              {/* MEDICATIONS & SURGERIES */}
              <div className="dossier-card">
                <h4>
                  <PillIcon size={16} /> Ongoing Medications & Surgical History
                </h4>
                <div className="dossier-info-row">
                  <div>
                    <small>CURRENT MEDICATIONS</small>
                    <p>{selectedPatientDossier.patient_current_medications || "No active medications listed."}</p>
                  </div>
                  <div style={{ marginTop: "12px" }}>
                    <small>PAST SURGERIES & HOSPITALIZATIONS</small>
                    <p>{selectedPatientDossier.patient_past_surgeries || "No prior surgical interventions recorded."}</p>
                  </div>
                </div>
              </div>

              {/* EMERGENCY CONTACT */}
              <div className="dossier-card">
                <h4>
                  <ShieldCheckIcon size={16} /> Emergency Contact
                </h4>
                <div className="dossier-emergency-grid">
                  <div>
                    <small>NAME</small>
                    <strong>{selectedPatientDossier.patient_emergency_contact_name || "Not provided"}</strong>
                  </div>
                  <div>
                    <small>RELATION</small>
                    <strong>{selectedPatientDossier.patient_emergency_contact_relation || "--"}</strong>
                  </div>
                  <div>
                    <small>PHONE</small>
                    <strong style={{ color: "#2dd4bf" }}>
                      {selectedPatientDossier.patient_emergency_contact_phone || "--"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* APPOINTMENT CHIEF COMPLAINT */}
              {selectedPatientDossier.symptoms && (
                <div className="dossier-card symptom-highlight">
                  <h4>
                    <SparklesIcon size={16} /> Current Appointment Chief Complaint
                  </h4>
                  <p>{selectedPatientDossier.symptoms}</p>
                </div>
              )}
            </div>

            <div className="dossier-modal-footer">
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setSelectedPatientDossier(null)}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorDashboard;