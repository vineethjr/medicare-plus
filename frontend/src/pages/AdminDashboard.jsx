import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  SearchIcon,
  DoctorIcon,
  HospitalIcon,
  AwardIcon,
  EyeIcon,
  XIcon,
  CheckIcon,
  LogOutIcon,
  FileTextIcon,
  SparklesIcon,
} from "../components/Icons";
import { API_URL } from "../config";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [stats, setStats] = useState({
    totalDoctors: 0,
    verifiedDoctors: 0,
    pendingDoctors: 0,
    fraudDoctors: 0,
    rejectedDoctors: 0,
    totalDocuments: 0,
    pendingDocuments: 0,
    verifiedDocuments: 0,
    rejectedDocuments: 0,
  });

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Selected Doctor for Detailed Dossier / Audit Drawer
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Document Inspection Viewer Modal
  const [inspectingDoc, setInspectingDoc] = useState(null);

  // Status Update & Badge Action Modal
  const [statusModalDoctor, setStatusModalDoctor] = useState(null);
  const [verificationForm, setVerificationForm] = useState({
    verification_status: "Verified",
    admin_notes: "",
  });
  const [updating, setUpdating] = useState(false);

  // Quick Preset Reasons
  const PRESET_VERIFIED_NOTES = [
    "State Medical Council registration certificate verified against National Medical Commission active registry.",
    "Specialist qualifications and university degrees cross-verified with institutional records.",
    "Full clinical compliance validated. Official verification badge granted.",
  ];

  const PRESET_FRAUD_NOTES = [
    "ALERT: Medical license serial number does not exist on State Medical Council or NMC registry.",
    "CRITICAL: Forged qualification certificate detected with counterfeit council watermark.",
    "SUSPENDED: Imposter practitioner detected. Account flagged for patient safety and clinical privileges revoked.",
  ];

  // Auth Guard: Only Admin
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (user.role !== "admin") {
      alert("Access denied. Administrator privileges required.");
      if (user.role === "doctor") {
        navigate("/doctor-dashboard");
      } else {
        navigate("/patient-dashboard");
      }
    }
  }, [token, user.role, navigate]);

  // Load Admin Data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsRes, doctorsRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/admin/doctors?status=${statusFilter}&search=${encodeURIComponent(searchTerm)}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.status === 401 || doctorsRes.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (doctorsRes.ok) {
        const doctorsData = await doctorsRes.json();
        setDoctors(Array.isArray(doctorsData) ? doctorsData : []);

        // Refresh selected doctor dossier if open
        if (selectedDoctor) {
          const refreshed = doctorsData.find((d) => d.id === selectedDoctor.id);
          if (refreshed) setSelectedDoctor(refreshed);
        }
      } else {
        const errData = await doctorsRes.json();
        setError(errData.message || "Failed to load doctor verification queue.");
      }
    } catch (err) {
      console.error("Admin dashboard fetch error:", err);
      setError("Unable to connect to MediCare+ service. Please verify backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user.role === "admin") {
      fetchDashboardData();
    }
  }, [statusFilter, searchTerm]);

  // Handle Verification Status Submit (Grant / Revoke Badge)
  const handleUpdateDoctorStatus = async (e) => {
    e.preventDefault();
    if (!statusModalDoctor) return;

    try {
      setUpdating(true);
      const res = await fetch(`${API_URL}/admin/doctors/${statusModalDoctor.id}/verify`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(verificationForm),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to update verification status.");
        return;
      }

      setActionMessage(data.message);
      setTimeout(() => setActionMessage(""), 5000);

      setStatusModalDoctor(null);
      await fetchDashboardData();
    } catch (err) {
      console.error("Status update error:", err);
      alert("Failed to communicate with verification registry.");
    } finally {
      setUpdating(false);
    }
  };

  // Handle Individual Document Status Change
  const handleUpdateDocumentStatus = async (docId, newDocStatus, docNote = "") => {
    try {
      const res = await fetch(`${API_URL}/admin/documents/${docId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newDocStatus,
          admin_notes: docNote || `Document marked as ${newDocStatus} by Administrator.`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to update document status.");
        return;
      }

      setActionMessage(data.message);
      setTimeout(() => setActionMessage(""), 4000);

      await fetchDashboardData();
    } catch (err) {
      console.error("Document update error:", err);
      alert("Error updating document review.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const openStatusModal = (doctor, defaultStatus = "Verified") => {
    setStatusModalDoctor(doctor);
    setVerificationForm({
      verification_status: defaultStatus,
      admin_notes:
        defaultStatus === "Verified"
          ? PRESET_VERIFIED_NOTES[0]
          : defaultStatus === "Fraud"
          ? PRESET_FRAUD_NOTES[0]
          : doctor.admin_notes || "",
    });
  };

  return (
    <div className="admin-portal-layout">
      {/* TOPBAR */}
      <header className="admin-topbar">
        <div className="admin-brand" onClick={() => navigate("/admin-dashboard")}>
          <div className="admin-brand-icon">
            <ShieldCheckIcon size={22} />
          </div>
          <div className="admin-brand-text">
            <h2>
              MediCare<span>+</span> ADMIN COMMAND
            </h2>
            <span>PRACTITIONER VERIFICATION & FRAUD PREVENTION REGISTRY</span>
          </div>
        </div>

        <div className="topbar-right-controls">
          <div className="council-sync-indicator">
            <span className="live-pulse-dot"></span>
            <span>National Medical Council Sync Active</span>
          </div>

          <div className="admin-profile-pill">
            <div className="admin-avatar">AD</div>
            <div className="admin-meta">
              <strong>{user.name || "Administrator"}</strong>
              <small>Root Security Authority</small>
            </div>
          </div>

          <button className="btn-admin-logout" onClick={handleLogout} title="Sign Out">
            <LogOutIcon size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* NOTIFICATION BANNER */}
      {actionMessage && (
        <div className="admin-alert-banner success">
          <CheckCircleIcon size={18} />
          <span>{actionMessage}</span>
          <button className="close-banner-btn" onClick={() => setActionMessage("")}>
            <XIcon size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="admin-alert-banner error">
          <AlertCircleIcon size={18} />
          <span>{error}</span>
          <button className="close-banner-btn" onClick={() => setError("")}>
            <XIcon size={14} />
          </button>
        </div>
      )}

      {/* HERO BANNER */}
      <section className="admin-hero">
        <div className="admin-hero-glow"></div>
        <div className="admin-hero-content">
          <div className="hero-eyebrow">
            <ShieldCheckIcon size={14} />
            <span>OFFICIAL PRACTITIONER AUDIT VAULT</span>
          </div>
          <h1>Doctor Credential Verification & Fraud Detection</h1>
          <p>
            Review medical licenses, inspect uploaded degree certifications, and award official{" "}
            <strong>"Verified Genuine Specialist"</strong> badges. Instantly flag and suspend fraudulent
            practitioners to protect patients from malpractice and unlicensed imposters.
          </p>
        </div>
      </section>

      {/* METRICS HUD */}
      <section className="admin-metrics-grid">
        <div className="admin-metric-card total">
          <div className="metric-header">
            <span>TOTAL DOCTORS</span>
            <DoctorIcon size={20} className="text-blue" />
          </div>
          <div className="metric-val">{loading ? "..." : stats.totalDoctors}</div>
          <div className="metric-sub">Registered medical practitioners</div>
          <div className="metric-bar blue"></div>
        </div>

        <div className="admin-metric-card pending">
          <div className="metric-header">
            <span>PENDING AUDIT</span>
            <ClockIcon size={20} className="text-amber" />
          </div>
          <div className="metric-val text-amber">{loading ? "..." : stats.pendingDoctors}</div>
          <div className="metric-sub">Awaiting document verification</div>
          <div className="metric-bar amber"></div>
        </div>

        <div className="admin-metric-card verified">
          <div className="metric-header">
            <span>VERIFIED GENUINE</span>
            <ShieldCheckIcon size={20} className="text-teal" />
          </div>
          <div className="metric-val text-teal">{loading ? "..." : stats.verifiedDoctors}</div>
          <div className="metric-sub">Official verification badge active</div>
          <div className="metric-bar teal"></div>
        </div>

        <div className="admin-metric-card fraud">
          <div className="metric-header">
            <span>FLAGGED AS FRAUD</span>
            <AlertCircleIcon size={20} className="text-red" />
          </div>
          <div className="metric-val text-red">{loading ? "..." : stats.fraudDoctors}</div>
          <div className="metric-sub">Imposter / Suspended accounts</div>
          <div className="metric-bar red"></div>
        </div>

        <div className="admin-metric-card docs">
          <div className="metric-header">
            <span>DOCUMENTS AUDITED</span>
            <FileTextIcon size={20} className="text-purple" />
          </div>
          <div className="metric-val text-purple">{loading ? "..." : stats.totalDocuments}</div>
          <div className="metric-sub">
            {stats.pendingDocuments} pending inspection
          </div>
          <div className="metric-bar purple"></div>
        </div>
      </section>

      {/* CONTROLS BAR: SEARCH & STATUS TABS */}
      <section className="admin-controls-card">
        <div className="controls-tabs-row">
          <button
            type="button"
            className={`tab-filter-btn ${statusFilter === "all" ? "active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All Practitioners ({stats.totalDoctors})
          </button>

          <button
            type="button"
            className={`tab-filter-btn pending ${statusFilter === "pending" ? "active" : ""}`}
            onClick={() => setStatusFilter("pending")}
          >
            <ClockIcon size={14} />
            <span>Pending Review ({stats.pendingDoctors})</span>
          </button>

          <button
            type="button"
            className={`tab-filter-btn verified ${statusFilter === "verified" ? "active" : ""}`}
            onClick={() => setStatusFilter("verified")}
          >
            <ShieldCheckIcon size={14} />
            <span>Verified Genuine ({stats.verifiedDoctors})</span>
          </button>

          <button
            type="button"
            className={`tab-filter-btn fraud ${statusFilter === "fraud" ? "active" : ""}`}
            onClick={() => setStatusFilter("fraud")}
          >
            <AlertCircleIcon size={14} />
            <span>Flagged Fraud ({stats.fraudDoctors})</span>
          </button>

          <button
            type="button"
            className={`tab-filter-btn rejected ${statusFilter === "rejected" ? "active" : ""}`}
            onClick={() => setStatusFilter("rejected")}
          >
            <XIcon size={14} />
            <span>Rejected ({stats.rejectedDoctors})</span>
          </button>
        </div>

        <div className="admin-search-wrapper">
          <SearchIcon size={18} className="search-icon-hint" />
          <input
            type="text"
            placeholder="Search by doctor name, email, medical council registration, or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm("")}>
              ✕
            </button>
          )}
        </div>
      </section>

      {/* DOCTOR VERIFICATION QUEUE GRID */}
      <main className="admin-content-area">
        {loading && (
          <div className="admin-loading-screen">
            <div className="admin-spinner"></div>
            <p>Accessing MediCare+ Medical Council Verification Registry...</p>
          </div>
        )}

        {!loading && doctors.length === 0 && (
          <div className="admin-empty-queue">
            <ShieldCheckIcon size={44} className="text-teal" />
            <h3>No Doctors Match Current Filter</h3>
            <p>All doctors under this category have been processed or no results matched your search.</p>
            <button className="btn-reset-filters" onClick={() => { setStatusFilter("all"); setSearchTerm(""); }}>
              Reset Filters
            </button>
          </div>
        )}

        {!loading && doctors.length > 0 && (
          <div className="doctor-audit-grid">
            {doctors.map((doctor) => {
              const status = doctor.verification_status || "Pending";
              const isVerified = status === "Verified";
              const isFraud = status === "Fraud";
              const isPending = status === "Pending";
              const isRejected = status === "Rejected";

              return (
                <div key={doctor.id} className={`doctor-audit-card ${status.toLowerCase()}`}>
                  {/* CARD TOP */}
                  <div className="audit-card-top">
                    <div className="doc-avatar-large">
                      {doctor.name?.charAt(0).toUpperCase() || "D"}
                      <span className={`status-indicator-dot ${status.toLowerCase()}`}></span>
                    </div>

                    <div className="doc-header-meta">
                      <div className="doc-name-badge-row">
                        <h3>Dr. {doctor.name}</h3>
                        {isVerified && (
                          <span className="badge-pill verified">
                            <ShieldCheckIcon size={13} /> Verified Genuine
                          </span>
                        )}
                        {isPending && (
                          <span className="badge-pill pending">
                            <ClockIcon size={13} /> Under Review
                          </span>
                        )}
                        {isFraud && (
                          <span className="badge-pill fraud">
                            <AlertCircleIcon size={13} /> FLAGGED AS FRAUD
                          </span>
                        )}
                        {isRejected && (
                          <span className="badge-pill rejected">
                            <XIcon size={13} /> Credentials Rejected
                          </span>
                        )}
                      </div>

                      <div className="doc-specialty-line">
                        <strong>{doctor.specialization || "General Physician"}</strong>
                        <span>•</span>
                        <span>{doctor.qualification || "MBBS"}</span>
                      </div>
                      <div className="doc-email-line">{doctor.email}</div>
                    </div>
                  </div>

                  {/* CLINICAL METRICS GRID */}
                  <div className="audit-metrics-grid">
                    <div className="audit-metric-item">
                      <span className="metric-label">Registration / License</span>
                      <strong className={`metric-code ${isFraud ? "text-red" : "text-teal"}`}>
                        {doctor.medical_license || "NOT PROVIDED"}
                      </strong>
                    </div>

                    <div className="audit-metric-item">
                      <span className="metric-label">Hospital Affiliation</span>
                      <strong>{doctor.hospital || "Independent Practice"}</strong>
                    </div>

                    <div className="audit-metric-item">
                      <span className="metric-label">Practice Experience</span>
                      <strong>{doctor.experience || 0} Years Active</strong>
                    </div>

                    <div className="audit-metric-item">
                      <span className="metric-label">Consultation Rate</span>
                      <strong className="text-emerald">₹{doctor.consultation_fee || 500}</strong>
                    </div>
                  </div>

                  {/* UPLOADED DOCUMENTS AUDIT SUMMARY */}
                  <div className="audit-docs-summary">
                    <div className="docs-summary-header">
                      <div className="summary-title">
                        <AwardIcon size={16} />
                        <span>Uploaded Qualification Documents</span>
                      </div>
                      <span className="docs-badge-count">
                        {doctor.documents?.length || 0} File(s)
                      </span>
                    </div>

                    {doctor.documents && doctor.documents.length > 0 ? (
                      <div className="docs-pills-list">
                        {doctor.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className={`doc-item-pill ${doc.status?.toLowerCase() || "pending"}`}
                            onClick={() => setInspectingDoc(doc)}
                            title="Click to inspect full document"
                          >
                            <FileTextIcon size={14} />
                            <span className="pill-name">{doc.document_name}</span>
                            <span className="pill-status">{doc.status || "Pending"}</span>
                            <EyeIcon size={12} className="inspect-icon" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-docs-warning">
                        <AlertCircleIcon size={14} className="text-amber" />
                        <span>No qualification documents uploaded yet by this practitioner.</span>
                      </div>
                    )}
                  </div>

                  {/* ADMIN REVIEW AUDIT LOG */}
                  {doctor.admin_notes && (
                    <div className={`admin-notes-preview ${isFraud ? "danger" : ""}`}>
                      <strong>Audit Note:</strong>
                      <p>{doctor.admin_notes}</p>
                    </div>
                  )}

                  {/* CARD ACTIONS */}
                  <div className="audit-card-actions">
                    <button
                      type="button"
                      className="btn-inspect-dossier"
                      onClick={() => setSelectedDoctor(doctor)}
                    >
                      <EyeIcon size={15} />
                      <span>Audit Dossier & Files</span>
                    </button>

                    <div className="decision-actions-row">
                      {!isVerified && (
                        <button
                          type="button"
                          className="btn-action-grant"
                          onClick={() => openStatusModal(doctor, "Verified")}
                          title="Verify Doctor as Genuine"
                        >
                          <ShieldCheckIcon size={14} />
                          <span>Grant Genuine Badge</span>
                        </button>
                      )}

                      {!isFraud && (
                        <button
                          type="button"
                          className="btn-action-flag-fraud"
                          onClick={() => openStatusModal(doctor, "Fraud")}
                          title="Flag Doctor as Fraud / Imposter"
                        >
                          <AlertCircleIcon size={14} />
                          <span>Flag as Fraud</span>
                        </button>
                      )}

                      {isVerified && (
                        <button
                          type="button"
                          className="btn-action-revoke"
                          onClick={() => openStatusModal(doctor, "Pending")}
                          title="Revoke Badge / Set to Pending"
                        >
                          <span>Revoke Badge</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FULL DOCTOR DOSSIER DRAWER / MODAL */}
      {selectedDoctor && (
        <div className="admin-modal-overlay" onClick={() => setSelectedDoctor(null)}>
          <div className="admin-dossier-drawer" onClick={(e) => e.stopPropagation()}>
            {/* DRAWER HEADER */}
            <div className="drawer-header">
              <div className="drawer-title-group">
                <div className="drawer-avatar">
                  {selectedDoctor.name?.charAt(0).toUpperCase() || "D"}
                </div>
                <div>
                  <div className="name-and-status-row">
                    <h2>Dr. {selectedDoctor.name}</h2>
                    <span className={`badge-pill ${selectedDoctor.verification_status?.toLowerCase() || "pending"}`}>
                      {selectedDoctor.verification_status || "Pending Review"}
                    </span>
                  </div>
                  <span className="drawer-subtitle">
                    {selectedDoctor.specialization} • {selectedDoctor.qualification} • {selectedDoctor.hospital}
                  </span>
                </div>
              </div>

              <button className="btn-close-drawer" onClick={() => setSelectedDoctor(null)}>
                <XIcon size={20} />
              </button>
            </div>

            {/* DRAWER BODY */}
            <div className="drawer-body">
              {/* STATUS ACTION BAR */}
              <div className="dossier-decision-box">
                <div>
                  <h4>Verification Decision Protocol</h4>
                  <p>Grant official genuine badge, request re-upload, or flag imposter.</p>
                </div>
                <div className="decision-buttons">
                  <button
                    type="button"
                    className="btn-modal-grant"
                    onClick={() => openStatusModal(selectedDoctor, "Verified")}
                  >
                    <ShieldCheckIcon size={16} /> Grant Genuine Badge
                  </button>
                  <button
                    type="button"
                    className="btn-modal-flag"
                    onClick={() => openStatusModal(selectedDoctor, "Fraud")}
                  >
                    <AlertCircleIcon size={16} /> Flag as Fraud
                  </button>
                  <button
                    type="button"
                    className="btn-modal-reject"
                    onClick={() => openStatusModal(selectedDoctor, "Rejected")}
                  >
                    <XIcon size={16} /> Reject
                  </button>
                </div>
              </div>

              {/* MEDICAL IDENTITY DATA */}
              <div className="dossier-section-card">
                <h3>
                  <DoctorIcon size={18} /> Official Medical Council Identity
                </h3>
                <div className="dossier-grid-2">
                  <div className="dossier-item">
                    <small>MEDICAL COUNCIL REGISTRATION NUMBER</small>
                    <strong className="text-teal font-mono">
                      {selectedDoctor.medical_license || "Not Provided"}
                    </strong>
                  </div>
                  <div className="dossier-item">
                    <small>CONTACT EMAIL</small>
                    <strong>{selectedDoctor.email}</strong>
                  </div>
                  <div className="dossier-item">
                    <small>CLINICAL SPECIALIZATION</small>
                    <strong>{selectedDoctor.specialization}</strong>
                  </div>
                  <div className="dossier-item">
                    <small>DEGREES & QUALIFICATIONS</small>
                    <strong>{selectedDoctor.qualification}</strong>
                  </div>
                  <div className="dossier-item">
                    <small>HOSPITAL / AFFILIATED CLINIC</small>
                    <strong>{selectedDoctor.hospital}</strong>
                  </div>
                  <div className="dossier-item">
                    <small>ACTIVE CLINICAL EXPERIENCE</small>
                    <strong>{selectedDoctor.experience || 0} Years</strong>
                  </div>
                  <div className="dossier-item">
                    <small>CONSULTATION RATE</small>
                    <strong>₹{selectedDoctor.consultation_fee || 500}</strong>
                  </div>
                  <div className="dossier-item">
                    <small>WEEKLY SCHEDULE</small>
                    <strong>{selectedDoctor.availability || "Standard Clinical Hours"}</strong>
                  </div>
                </div>

                {selectedDoctor.bio && (
                  <div className="dossier-bio-block">
                    <small>PRACTITIONER BACKGROUND & SCOPE OF PRACTICE</small>
                    <p>{selectedDoctor.bio}</p>
                  </div>
                )}
              </div>

              {/* UPLOADED DOCUMENTS AUDIT GALLERY */}
              <div className="dossier-section-card">
                <div className="card-header-flex">
                  <h3>
                    <AwardIcon size={18} /> Supporting Medical Documents & Certificates (
                    {selectedDoctor.documents?.length || 0})
                  </h3>
                  <small>Inspect individual certificates below</small>
                </div>

                {!selectedDoctor.documents || selectedDoctor.documents.length === 0 ? (
                  <div className="empty-docs-dossier">
                    <AlertCircleIcon size={24} className="text-amber" />
                    <p>No qualification documents have been uploaded by this practitioner.</p>
                  </div>
                ) : (
                  <div className="dossier-docs-list">
                    {selectedDoctor.documents.map((doc) => (
                      <div key={doc.id} className="dossier-doc-card">
                        <div className="doc-card-header">
                          <div className="doc-header-left">
                            <AwardIcon size={22} className="text-teal" />
                            <div>
                              <h4>{doc.document_name}</h4>
                              <span className="doc-type-sub">
                                {doc.document_type} • Issued by {doc.issuer || "Accreditation Board"} ({doc.issue_year || "Verified"})
                              </span>
                            </div>
                          </div>
                          <span className={`doc-status-badge ${doc.status?.toLowerCase() || "pending"}`}>
                            {doc.status || "Pending"}
                          </span>
                        </div>

                        {doc.admin_notes && (
                          <div className="doc-notes-callout">
                            <strong>Audit Remarks:</strong> {doc.admin_notes}
                          </div>
                        )}

                        <div className="doc-card-actions-bar">
                          <button
                            type="button"
                            className="btn-preview-file"
                            onClick={() => setInspectingDoc(doc)}
                          >
                            <EyeIcon size={14} /> Inspect Full Document
                          </button>

                          <div className="doc-individual-controls">
                            {doc.status !== "Verified" && (
                              <button
                                type="button"
                                className="btn-doc-verify"
                                onClick={() => handleUpdateDocumentStatus(doc.id, "Verified")}
                              >
                                <CheckIcon size={14} /> Approve Document
                              </button>
                            )}

                            {doc.status !== "Rejected" && (
                              <button
                                type="button"
                                className="btn-doc-reject"
                                onClick={() => {
                                  const reason = prompt("Enter rejection reason for this document:", "Document is unreadable or forged.");
                                  if (reason) handleUpdateDocumentStatus(doc.id, "Rejected", reason);
                                }}
                              >
                                <XIcon size={14} /> Reject Document
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT HIGH-RES INSPECTION VIEWER MODAL */}
      {inspectingDoc && (
        <div className="admin-modal-overlay viewer-overlay" onClick={() => setInspectingDoc(null)}>
          <div className="doc-inspection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="viewer-header">
              <div className="viewer-title">
                <AwardIcon size={22} className="text-teal" />
                <div>
                  <h3>{inspectingDoc.document_name}</h3>
                  <small>
                    {inspectingDoc.document_type} • {inspectingDoc.issuer || "Accredited Body"} ({inspectingDoc.issue_year || "Year"})
                  </small>
                </div>
              </div>
              <button className="close-viewer-btn" onClick={() => setInspectingDoc(null)}>
                <XIcon size={18} />
              </button>
            </div>

            <div className="viewer-body">
              <div className="inspection-watermark">
                <ShieldCheckIcon size={16} />
                <span>MEDICARE+ ADMINISTRATIVE AUDIT PROTOCOL</span>
              </div>

              {inspectingDoc.file_url && inspectingDoc.file_url.startsWith("data:image") ? (
                <img
                  src={inspectingDoc.file_url}
                  alt={inspectingDoc.document_name}
                  className="full-cert-img"
                />
              ) : inspectingDoc.file_url && inspectingDoc.file_url.startsWith("data:application/pdf") ? (
                <iframe
                  src={inspectingDoc.file_url}
                  title={inspectingDoc.document_name}
                  className="full-cert-iframe"
                />
              ) : (
                <div className="cert-rendered-preview">
                  <div className="cert-border-outer">
                    <div className="cert-border-inner">
                      <AwardIcon size={46} className="text-teal" />
                      <h2>OFFICIAL QUALIFICATION CREDENTIAL</h2>
                      <h3>{inspectingDoc.document_name}</h3>
                      <p className="cert-recipient">
                        Issued to accredited specialist Dr. {selectedDoctor?.name || "Doctor"}
                      </p>
                      <p className="cert-text">
                        Issued by <strong>{inspectingDoc.issuer || "Medical Authority"}</strong>.
                        Document is currently under review in the MediCare+ Verification Registry.
                      </p>
                      <div className="cert-footer-meta">
                        <span>Issued: {inspectingDoc.issue_year || "Verified"}</span>
                        <span className="status-pill-modal">STATUS: {inspectingDoc.status || "Pending"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="viewer-footer">
              <div className="viewer-footer-left">
                <span>Registry Record ID: DOC-{inspectingDoc.id}</span>
              </div>
              <div className="viewer-footer-actions">
                <button
                  type="button"
                  className="btn-viewer-verify"
                  onClick={() => {
                    handleUpdateDocumentStatus(inspectingDoc.id, "Verified");
                    setInspectingDoc(null);
                  }}
                >
                  <CheckIcon size={14} /> Approve Document
                </button>
                <button
                  type="button"
                  className="btn-viewer-reject"
                  onClick={() => {
                    const reason = prompt("Enter rejection reason for this document:", "Document is unreadable or forged.");
                    if (reason) {
                      handleUpdateDocumentStatus(inspectingDoc.id, "Rejected", reason);
                      setInspectingDoc(null);
                    }
                  }}
                >
                  <XIcon size={14} /> Reject Document
                </button>
                <button
                  type="button"
                  className="btn-viewer-close"
                  onClick={() => setInspectingDoc(null)}
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE STATUS & BADGE DECISION MODAL */}
      {statusModalDoctor && (
        <div className="admin-modal-overlay" onClick={() => setStatusModalDoctor(null)}>
          <div className="status-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="status-modal-header">
              <div className="modal-title-with-icon">
                <div className={`modal-icon-badge ${verificationForm.verification_status.toLowerCase()}`}>
                  {verificationForm.verification_status === "Verified" ? (
                    <ShieldCheckIcon size={22} />
                  ) : verificationForm.verification_status === "Fraud" ? (
                    <AlertCircleIcon size={22} />
                  ) : (
                    <ClockIcon size={22} />
                  )}
                </div>
                <div>
                  <h3>Verification Decision: Dr. {statusModalDoctor.name}</h3>
                  <small>License: {statusModalDoctor.medical_license || "Unregistered"}</small>
                </div>
              </div>
              <button className="close-modal-x" onClick={() => setStatusModalDoctor(null)}>
                <XIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateDoctorStatus} className="status-modal-form">
              <div className="field-group">
                <label>Verification Decision *</label>
                <div className="status-option-pills">
                  <button
                    type="button"
                    className={`status-pill-btn verified ${verificationForm.verification_status === "Verified" ? "active" : ""}`}
                    onClick={() =>
                      setVerificationForm({
                        verification_status: "Verified",
                        admin_notes: PRESET_VERIFIED_NOTES[0],
                      })
                    }
                  >
                    <ShieldCheckIcon size={16} />
                    <div>
                      <strong>Genuine Doctor</strong>
                      <small>Grant Verification Badge</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`status-pill-btn fraud ${verificationForm.verification_status === "Fraud" ? "active" : ""}`}
                    onClick={() =>
                      setVerificationForm({
                        verification_status: "Fraud",
                        admin_notes: PRESET_FRAUD_NOTES[0],
                      })
                    }
                  >
                    <AlertCircleIcon size={16} />
                    <div>
                      <strong>Flag as Fraud</strong>
                      <small>Revoke Badge & Suspend</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`status-pill-btn rejected ${verificationForm.verification_status === "Rejected" ? "active" : ""}`}
                    onClick={() =>
                      setVerificationForm({
                        ...verificationForm,
                        verification_status: "Rejected",
                      })
                    }
                  >
                    <XIcon size={16} />
                    <div>
                      <strong>Reject Credentials</strong>
                      <small>Request Re-submission</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`status-pill-btn pending ${verificationForm.verification_status === "Pending" ? "active" : ""}`}
                    onClick={() =>
                      setVerificationForm({
                        ...verificationForm,
                        verification_status: "Pending",
                      })
                    }
                  >
                    <ClockIcon size={16} />
                    <div>
                      <strong>Set as Pending</strong>
                      <small>Keep in Review Queue</small>
                    </div>
                  </button>
                </div>
              </div>

              {/* QUICK REASONS PICKER */}
              <div className="field-group">
                <label>Select Audit Reason Template</label>
                <div className="quick-reasons-row">
                  {(verificationForm.verification_status === "Fraud"
                    ? PRESET_FRAUD_NOTES
                    : PRESET_VERIFIED_NOTES
                  ).map((note, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="quick-note-pill"
                      onClick={() =>
                        setVerificationForm((prev) => ({ ...prev, admin_notes: note }))
                      }
                    >
                      Template #{idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field-group">
                <label>Official Administrator Notes & Audit Log *</label>
                <textarea
                  rows={4}
                  value={verificationForm.admin_notes}
                  onChange={(e) =>
                    setVerificationForm({ ...verificationForm, admin_notes: e.target.value })
                  }
                  placeholder="Enter detailed review remarks, council registry verification reference, or reasons for flagging..."
                  required
                />
                <small className="field-hint">
                  {verificationForm.verification_status === "Verified"
                    ? "✓ Doctor will be granted the official 'Verified Genuine Specialist' badge visible to all patients."
                    : verificationForm.verification_status === "Fraud"
                    ? "⚠ Doctor will be flagged as fraudulent. Verification badge will be revoked and appointment booking disabled for patient protection."
                    : "Doctor's profile status will be updated accordingly."}
                </small>
              </div>

              <div className="status-modal-actions">
                <button
                  type="button"
                  className="btn-cancel-modal"
                  onClick={() => setStatusModalDoctor(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn-confirm-decision ${verificationForm.verification_status.toLowerCase()}`}
                  disabled={updating}
                >
                  {updating ? (
                    "Recording Decision..."
                  ) : verificationForm.verification_status === "Verified" ? (
                    "Confirm & Grant Verification Badge"
                  ) : verificationForm.verification_status === "Fraud" ? (
                    "Confirm & Flag Doctor as Fraud"
                  ) : (
                    "Save Verification Decision"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
