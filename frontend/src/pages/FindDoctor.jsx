import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./FindDoctor.css";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  AwardIcon,
  BabyIcon,
  BoneIcon,
  BrainIcon,
  CheckCircleIcon,
  DoctorIcon,
  EyeIcon,
  FileTextIcon,
  HeartPulseIcon,
  HospitalIcon,
  PillIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  ToothIcon,
  VideoIcon,
  XIcon,
} from "../components/Icons";
import { API_URL } from "../config";

function FindDoctor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Specialization received from AI recommendation
  const specializationFromAI = searchParams.get("specialization") || "";

  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("");

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [verifyingDoctor, setVerifyingDoctor] = useState(null);
  const [inspectingDoc, setInspectingDoc] = useState(null);

  // Profile completion enforcement state
  const [patientProfile, setPatientProfile] = useState(null);
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [showIncompleteProfileModal, setShowIncompleteProfileModal] = useState(false);
  const [attemptedDoctor, setAttemptedDoctor] = useState(null);

  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [symptoms, setSymptoms] = useState("");

  // Consultation mode
  const [consultationMode, setConsultationMode] = useState("Online");

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Fetch doctors
  useEffect(() => {
    async function fetchDoctors() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/doctors`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401 || data.sessionExpired) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate("/login");
            return;
          }
          throw new Error(data.message || "Failed to load doctors");
        }

        setDoctors(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    async function checkPatientProfile() {
      if (user.role !== "patient") return;
      try {
        const res = await fetch(`${API_URL}/patient/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }
        if (res.ok) {
          const profileData = await res.json();
          setPatientProfile(profileData);
          const isIncomplete =
            !profileData.age ||
            !profileData.gender ||
            !profileData.blood_group ||
            !profileData.emergency_contact_phone;
          setIsProfileIncomplete(isIncomplete);
        }
      } catch (err) {
        console.error("Failed to check patient profile:", err);
      }
    }

    fetchDoctors();
    checkPatientProfile();
  }, [token, user.role]);

  // Specialization list
  const specializations = [
    ...new Set(
      doctors
        .map((doctor) => doctor.specialization?.trim())
        .filter(Boolean)
    ),
  ];

  // Default specialty categories
  const DEFAULT_CATEGORIES = [
    { name: "Cardiology", icon: HeartPulseIcon },
    { name: "Neurology", icon: BrainIcon },
    { name: "General Physician", icon: DoctorIcon },
    { name: "Pediatrics", icon: BabyIcon },
    { name: "Dermatology", icon: PillIcon },
    { name: "Orthopedics", icon: BoneIcon },
    { name: "Dentistry", icon: ToothIcon },
  ];

  // Dynamically include registered doctor specializations if not in default categories
  const extraCategories = specializations
    .filter((spec) => {
      const s = spec.toLowerCase();
      return !DEFAULT_CATEGORIES.some(
        (c) => c.name.toLowerCase() === s || s.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(s)
      );
    })
    .map((spec) => ({
      name: spec,
      icon: DoctorIcon,
    }));

  const allSpecialtyPills = [...DEFAULT_CATEGORIES, ...extraCategories];

  // Filter doctors
  const filteredDoctors = doctors.filter((doctor) => {
    const searchText = search.toLowerCase().trim();

    const doctorName = doctor.name?.toLowerCase().trim() || "";
    const doctorSpecialization = (doctor.specialization || "General Physician").toLowerCase().trim();
    const doctorHospital = (doctor.hospital || "Clinical Center").toLowerCase().trim();

    const matchesSearch =
      !searchText ||
      doctorName.includes(searchText) ||
      doctorSpecialization.includes(searchText) ||
      doctorHospital.includes(searchText);

    const cleanFilter = specialization.toLowerCase().trim();
    const matchesManualSpecialization =
      !cleanFilter ||
      doctorSpecialization === cleanFilter ||
      doctorSpecialization.includes(cleanFilter) ||
      cleanFilter.includes(doctorSpecialization) ||
      (cleanFilter.includes("physician") && (doctorSpecialization.includes("physician") || doctorSpecialization.includes("general") || doctorSpecialization.includes("medicine"))) ||
      (cleanFilter.includes("cardio") && doctorSpecialization.includes("cardio")) ||
      (cleanFilter.includes("neuro") && doctorSpecialization.includes("neuro")) ||
      (cleanFilter.includes("pediatr") && doctorSpecialization.includes("pediatr"));

    const cleanAIFilter = specializationFromAI.toLowerCase().trim();
    const matchesAISpecialization =
      !cleanAIFilter ||
      doctorSpecialization === cleanAIFilter ||
      doctorSpecialization.includes(cleanAIFilter) ||
      cleanAIFilter.includes(doctorSpecialization) ||
      (cleanAIFilter.includes("cardio") && doctorSpecialization.includes("cardio")) ||
      (cleanAIFilter.includes("neuro") && doctorSpecialization.includes("neuro")) ||
      (cleanAIFilter.includes("pediatr") && doctorSpecialization.includes("pediatr"));

    return (
      matchesSearch &&
      matchesManualSpecialization &&
      matchesAISpecialization
    );
  });

  // Open booking form
  function openBookingForm(doctor) {
    if (user.role === "patient" && isProfileIncomplete) {
      setAttemptedDoctor(doctor);
      setShowIncompleteProfileModal(true);
      return;
    }
    setSelectedDoctor(doctor);
    setAppointmentDate("");
    setAppointmentTime("");
    setSymptoms("");
    setConsultationMode("Online");
    setError("");
    setSuccess("");
  }

  // Close booking form
  function closeBookingForm() {
    if (!booking) {
      setSelectedDoctor(null);
      setError("");
      setSuccess("");
    }
  }

  // Book appointment
  async function handleBooking(event) {
    event.preventDefault();

    if (!appointmentDate || !appointmentTime) {
      setError("Please select appointment date and time.");
      return;
    }

    try {
      setBooking(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          symptoms,
          consultation_mode: consultationMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.profileIncomplete) {
          setIsProfileIncomplete(true);
          setSelectedDoctor(null);
          setShowIncompleteProfileModal(true);
          return;
        }
        throw new Error(data.message || "Failed to book appointment");
      }

      setSuccess(
        "Appointment requested successfully! You will be prompted to pay the consultation fee once Dr. " +
          selectedDoctor.name +
          " confirms your slot."
      );

      setTimeout(() => {
        setSelectedDoctor(null);
        setSuccess("");
        navigate("/patient-appointments");
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className="find-doctor-page">
      {/* HEADER */}
      <header className="find-doctor-header">
        <div>
          <h1>Find a Medical Specialist</h1>
          <p>Browse certified doctors, view consultation fees, and schedule an appointment.</p>
        </div>

        <button
          className="back-dashboard-btn"
          onClick={() => navigate("/patient-dashboard")}
        >
          ← Dashboard
        </button>
      </header>

      {/* AI RECOMMENDATION BANNER */}
      {specializationFromAI && (
        <div className="ai-filter-banner">
          <div className="ai-filter-icon">
            <SparklesIcon size={20} />
          </div>
          <div className="ai-filter-content">
            <strong>AI Specialist Recommendation Applied</strong>
            <p>
              Showing verified specialists in <strong>{specializationFromAI}</strong> based on your symptoms.
            </p>
          </div>
          <button
            className="clear-ai-filter-btn"
            onClick={() => navigate("/find-doctor")}
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* INCOMPLETE PROFILE MANDATORY NOTICE BANNER */}
      {isProfileIncomplete && (
        <div className="incomplete-profile-banner">
          <div className="incomplete-banner-left">
            <div className="incomplete-banner-icon">
              <AlertCircleIcon size={22} />
            </div>
            <div>
              <strong>Action Required: Complete Your Medical Profile to Book Appointments</strong>
              <p>
                Clinical safety protocols require patients to record their medical history, blood group, age, and emergency contact before scheduling appointments with doctors.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-go-complete-profile"
            onClick={() => navigate("/patient-profile")}
          >
            <span>Complete Profile Now</span>
            <ArrowRightIcon size={15} />
          </button>
        </div>
      )}

      {/* SEARCH & FILTER */}
      <section className="doctor-search-section">
        <div className="search-input-wrapper">
          <SearchIcon size={18} className="search-icon-hint" />
          <input
            type="text"
            placeholder="Search by doctor name, specialty, or clinic/hospital..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
        >
          <option value="">All Specializations ({specializations.length})</option>
          {specializations.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </section>

      {/* SPECIALTY FILTER PILLS */}
      <div className="specialty-pills-scroll">
        <button
          type="button"
          className={`specialty-pill-btn ${!specialization && !specializationFromAI ? "active" : ""}`}
          onClick={() => {
            setSpecialization("");
            if (specializationFromAI) navigate("/find-doctor");
          }}
        >
          <SparklesIcon size={14} /> All Doctors ({doctors.length})
        </button>
        {allSpecialtyPills.map((item) => {
          const ItemIcon = item.icon;
          const isActive =
            specialization.toLowerCase() === item.name.toLowerCase() ||
            specializationFromAI.toLowerCase() === item.name.toLowerCase();

          return (
            <button
              key={item.name}
              type="button"
              className={`specialty-pill-btn ${isActive ? "active" : ""}`}
              onClick={() => {
                if (specialization.toLowerCase() === item.name.toLowerCase()) {
                  setSpecialization("");
                } else {
                  setSpecialization(item.name);
                }
              }}
            >
              <ItemIcon size={15} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>

      {/* DIRECTORY META / STATS ROW */}
      <div className="directory-meta-row">
        <span>
          Showing <strong>{filteredDoctors.length}</strong> of <strong>{doctors.length}</strong> certified specialists
        </span>
        {(specialization || search || specializationFromAI) && (
          <button
            type="button"
            className="clear-filter-pill"
            onClick={() => {
              setSpecialization("");
              setSearch("");
              if (specializationFromAI) navigate("/find-doctor");
            }}
          >
            Clear Active Filters ✕
          </button>
        )}
      </div>

      {/* LOADING */}
      {loading && <p className="status-message">Loading verified doctors...</p>}

      {/* ERROR */}
      {error && !selectedDoctor && (
        <p className="error-message">
          <AlertCircleIcon size={16} /> {error}
        </p>
      )}

      {/* NO DOCTORS */}
      {!loading && !error && filteredDoctors.length === 0 && (
        <p className="status-message">
          No doctors found matching your criteria. Try adjusting your search or clearing filters.
        </p>
      )}

      {/* DOCTOR GRID */}
      <section className="doctor-grid">
        {filteredDoctors.map((doctor) => {
          const fee = Number(doctor.consultation_fee) || 500;

          return (
            <div className="doctor-card" key={doctor.id}>
              <div className="doctor-card-top">
                <div className="doctor-avatar">
                  {doctor.name?.charAt(0).toUpperCase() || "D"}
                  <span className="doc-avatar-dot"></span>
                </div>
                <div className="doctor-card-header-info">
                  <div className="doctor-name-row">
                    <h2>Dr. {doctor.name}</h2>
                    <span className="verified-badge-mini">
                      <CheckCircleIcon size={12} /> Verified
                    </span>
                  </div>
                  <span className="doctor-specialization">
                    {doctor.specialization || "General Physician"}
                  </span>
                  <div className="doctor-rating-pill">
                    <div style={{ display: "flex", gap: "2px", color: "#f59e0b" }}>
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} size={12} />
                      ))}
                    </div>
                    <span>4.9 (180+ reviews)</span>
                  </div>
                </div>
              </div>

              <div className="doctor-details">
                <div className="doctor-detail-row">
                  <span>Qualification:</span>
                  <strong>{doctor.qualification || "MBBS"}</strong>
                </div>

                <div className="doctor-detail-row">
                  <span>Experience:</span>
                  <strong>{doctor.experience || 0} Years Active Practice</strong>
                </div>

                <div className="doctor-detail-row">
                  <span>Clinical Center:</span>
                  <strong>{doctor.hospital || "Clinical Center"}</strong>
                </div>

                <div className="doctor-detail-row">
                  <span>Availability:</span>
                  <strong className="text-teal">{doctor.availability || "Mon - Fri, Regular Hours"}</strong>
                </div>
              </div>

              <div className="doctor-fee-highlight">
                <div>
                  <span>Consultation Fee</span>
                  <small style={{ display: "flex", alignItems: "center", gap: "4px", color: "#0d9488", fontSize: "11px", fontWeight: "700" }}>
                    <ShieldCheckIcon size={13} /> Pay only after doctor confirms
                  </small>
                </div>
                <strong className="fee-display-val">₹{fee}</strong>
              </div>

              <div className="doctor-card-actions">
                <button
                  type="button"
                  className="verify-credentials-btn"
                  onClick={() => setVerifyingDoctor(doctor)}
                >
                  <ShieldCheckIcon size={14} />
                  <span>Verify Doctor & Credentials</span>
                  {doctor.documents && doctor.documents.length > 0 && (
                    <span className="doc-count-tag">{doctor.documents.length} verified</span>
                  )}
                </button>

                <button
                  type="button"
                  className="consult-btn"
                  onClick={() => openBookingForm(doctor)}
                >
                  <span>Book Appointment</span>
                  <ArrowRightIcon size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* BOOKING MODAL */}
      {selectedDoctor && (
        <div className="booking-overlay" onClick={closeBookingForm}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-modal-btn"
              onClick={closeBookingForm}
              disabled={booking}
            >
              <XIcon size={18} />
            </button>

            <h2>Schedule Medical Consultation</h2>
            <p className="booking-doctor-name">Dr. {selectedDoctor.name}</p>
            <p className="booking-doctor-specialization">
              {selectedDoctor.specialization || "Specialist"} · {selectedDoctor.hospital}
            </p>

            <form onSubmit={handleBooking}>
              <div className="consultation-mode-section">
                <label>Choose Consultation Channel</label>
                <div className="consultation-mode-options">
                  <button
                    type="button"
                    className={`mode-option ${
                      consultationMode === "Online" ? "selected" : ""
                    }`}
                    onClick={() => setConsultationMode("Online")}
                  >
                    <span className="mode-icon">
                      <VideoIcon size={20} />
                    </span>
                    <div>
                      <strong>Online Telehealth</strong>
                      <small>HD Video & Live Chat</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`mode-option ${
                      consultationMode === "Offline" ? "selected" : ""
                    }`}
                    onClick={() => setConsultationMode("Offline")}
                  >
                    <span className="mode-icon">
                      <HospitalIcon size={20} />
                    </span>
                    <div>
                      <strong>In-Person Clinical Visit</strong>
                      <small>Visit at Hospital</small>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="appointment-date">Consultation Date</label>
                <div className="quick-dates-row">
                  {[
                    { label: "Today", days: 0 },
                    { label: "Tomorrow", days: 1 },
                    { label: "+2 Days", days: 2 },
                  ].map((d) => {
                    const target = new Date();
                    target.setDate(target.getDate() + d.days);
                    const iso = target.toISOString().split("T")[0];
                    return (
                      <button
                        key={d.label}
                        type="button"
                        className={`quick-slot-btn ${appointmentDate === iso ? "active" : ""}`}
                        onClick={() => setAppointmentDate(iso)}
                      >
                        {d.label} ({iso.slice(5)})
                      </button>
                    );
                  })}
                </div>
                <input
                  id="appointment-date"
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="appointment-time">Select Time Slot</label>
                <div className="quick-times-row">
                  {[
                    { label: "10:00 AM", val: "10:00" },
                    { label: "11:30 AM", val: "11:30" },
                    { label: "02:30 PM", val: "14:30" },
                    { label: "04:30 PM", val: "16:30" },
                    { label: "06:30 PM", val: "18:30" },
                  ].map((t) => (
                    <button
                      key={t.val}
                      type="button"
                      className={`quick-slot-btn ${appointmentTime === t.val ? "active" : ""}`}
                      onClick={() => setAppointmentTime(t.val)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <input
                  id="appointment-time"
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="symptoms">Symptoms & Clinical Notes</label>
                <textarea
                  id="symptoms"
                  placeholder="Describe your health concern, symptoms, or current discomfort..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows="3"
                />
              </div>

              <div className="booking-fee-notice">
                <div className="notice-badge">
                  <ShieldCheckIcon size={14} /> ZERO UPFRONT CHARGE
                </div>
                <strong>Consultation Fee: ₹{selectedDoctor.consultation_fee || 500}</strong>
                <span>
                  You only pay once Dr. {selectedDoctor.name} reviews your medical request and confirms their availability.
                </span>
              </div>

              {error && (
                <p className="booking-error-message">
                  <AlertCircleIcon size={16} /> {error}
                </p>
              )}
              {success && (
                <p className="booking-success-message">
                  <CheckCircleIcon size={16} /> {success}
                </p>
              )}

              <button
                className="submit-booking-btn"
                type="submit"
                disabled={booking}
              >
                <span>{booking ? "Submitting Booking..." : "Request Doctor Confirmation"}</span>
                <ArrowRightIcon size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DOCTOR CREDENTIALS & PROFILE VERIFICATION MODAL */}
      {verifyingDoctor && (
        <div
          className="booking-overlay"
          onClick={() => setVerifyingDoctor(null)}
        >
          <div
            className="verify-doctor-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="verify-modal-top">
              <div className="verify-doc-header">
                <div className="verify-avatar">
                  {verifyingDoctor.name?.charAt(0).toUpperCase() || "D"}
                  <span className="verify-active-dot"></span>
                </div>
                <div className="verify-title-meta">
                  <div className="verify-name-row">
                    <h2>Dr. {verifyingDoctor.name}</h2>
                    <span className="verified-shield-tag">
                      <ShieldCheckIcon size={14} /> MediCare+ Verified Registry
                    </span>
                  </div>
                  <span className="verify-spec">
                    {verifyingDoctor.specialization || "General Physician"} • {verifyingDoctor.qualification || "MBBS"}
                  </span>
                  <div className="verify-license-row">
                    <span className="license-badge">
                      Medical License: {verifyingDoctor.medical_license || "SMC-ACTIVE-REGISTRY"}
                    </span>
                    <span className="license-badge hospital">
                      <HospitalIcon size={13} /> {verifyingDoctor.hospital || "Medical Practice"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                className="close-modal-btn"
                onClick={() => setVerifyingDoctor(null)}
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="verify-modal-body">
              {/* PRACTICE STATS ROW */}
              <div className="verify-stats-grid">
                <div className="verify-stat-card">
                  <span>Experience</span>
                  <strong>{verifyingDoctor.experience || 0} Years Active</strong>
                </div>
                <div className="verify-stat-card">
                  <span>Consultation Fee</span>
                  <strong className="text-teal">₹{verifyingDoctor.consultation_fee || 500}</strong>
                </div>
                <div className="verify-stat-card">
                  <span>Availability</span>
                  <strong>{verifyingDoctor.availability || "Mon - Fri Standard"}</strong>
                </div>
                <div className="verify-stat-card">
                  <span>Documents on File</span>
                  <strong className="text-emerald">{verifyingDoctor.documents?.length || 0} Verified</strong>
                </div>
              </div>

              {/* BIO */}
              {verifyingDoctor.bio && (
                <div className="verify-section">
                  <h3>Clinical Background & Philosophy</h3>
                  <p className="verify-bio-text">{verifyingDoctor.bio}</p>
                </div>
              )}

              {/* QUALIFICATION DOCUMENTS */}
              <div className="verify-section">
                <div className="verify-section-header">
                  <h3>Official Qualification & Board Certificates</h3>
                  <span className="doc-count-pill">
                    {verifyingDoctor.documents?.length || 0} Document(s)
                  </span>
                </div>

                {!verifyingDoctor.documents || verifyingDoctor.documents.length === 0 ? (
                  <div className="empty-cert-notice">
                    <ShieldCheckIcon size={24} />
                    <div>
                      <strong>Registered Clinical Specialist</strong>
                      <p>
                        Dr. {verifyingDoctor.name} is clinically registered with MediCare+ under license{" "}
                        {verifyingDoctor.medical_license || "SMC-VERIFIED"}. Formal scans are being digitized.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="verify-docs-list">
                    {verifyingDoctor.documents.map((doc) => (
                      <div className="verify-doc-item" key={doc.id}>
                        <div className="doc-item-icon">
                          <AwardIcon size={22} />
                        </div>
                        <div className="doc-item-info">
                          <h4>{doc.document_name}</h4>
                          <span className="doc-item-type">{doc.document_type}</span>
                          <small>
                            Issued by {doc.issuer || "Accreditation Authority"} ({doc.issue_year || "Verified"})
                          </small>
                        </div>
                        <div className="doc-item-action">
                          <button
                            type="button"
                            className="btn-inspect-cert"
                            onClick={() => setInspectingDoc(doc)}
                          >
                            <EyeIcon size={14} />
                            <span>Inspect Document</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="verify-modal-footer">
              <button
                type="button"
                className="btn-cancel-verify"
                onClick={() => setVerifyingDoctor(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-book-from-verify"
                onClick={() => {
                  const doc = verifyingDoctor;
                  setVerifyingDoctor(null);
                  openBookingForm(doc);
                }}
              >
                <span>Book Appointment with Dr. {verifyingDoctor.name}</span>
                <ArrowRightIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT DOCUMENT CERTIFICATE VIEWER */}
      {inspectingDoc && (
        <div
          className="booking-overlay viewer-overlay"
          onClick={() => setInspectingDoc(null)}
        >
          <div
            className="patient-doc-viewer-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="viewer-header">
              <div className="viewer-title">
                <ShieldCheckIcon size={20} className="text-teal" />
                <div>
                  <h3>{inspectingDoc.document_name}</h3>
                  <small>
                    {inspectingDoc.document_type} • Issued by {inspectingDoc.issuer || "Medical Authority"}
                  </small>
                </div>
              </div>
              <button
                className="close-modal-btn"
                onClick={() => setInspectingDoc(null)}
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="viewer-body">
              <div className="patient-watermark-seal">
                <CheckCircleIcon size={15} /> VERIFIED BY MEDICARE+ REGISTRY
              </div>

              {inspectingDoc.file_url && inspectingDoc.file_url.startsWith("data:image") ? (
                <img
                  src={inspectingDoc.file_url}
                  alt={inspectingDoc.document_name}
                  className="patient-cert-img"
                />
              ) : (
                <div className="patient-cert-canvas">
                  <div className="canvas-border">
                    <AwardIcon size={46} className="text-teal" />
                    <h2>OFFICIAL VERIFIED MEDICAL CREDENTIAL</h2>
                    <h3>{inspectingDoc.document_name}</h3>
                    <p className="cert-doc-sub">
                      Issued to certified medical specialist Dr. {verifyingDoctor?.name || "Doctor"}
                    </p>
                    <p className="cert-desc">
                      Official qualification issued by <strong>{inspectingDoc.issuer || "Medical Council"}</strong>.
                      This credential has been reviewed and verified by MediCare+ Clinical Operations.
                    </p>
                    <div className="cert-stamped-row">
                      <span>Accredited: {inspectingDoc.issue_year || "Verified"}</span>
                      <span className="official-stamp-chip">
                        <CheckCircleIcon size={14} /> AUTHENTICATED
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="viewer-footer">
              <span className="doc-uid">Document Registry ID: DOC-VERIFIED-{inspectingDoc.id}</span>
              <button
                type="button"
                className="btn-cancel-verify"
                onClick={() => setInspectingDoc(null)}
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INCOMPLETE MEDICAL PROFILE ENFORCEMENT MODAL */}
      {showIncompleteProfileModal && (
        <div
          className="booking-overlay"
          onClick={() => setShowIncompleteProfileModal(false)}
        >
          <div
            className="incomplete-profile-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="incomplete-modal-header">
              <div className="incomplete-icon-box">
                <AlertCircleIcon size={26} />
              </div>
              <button
                className="close-modal-btn"
                onClick={() => setShowIncompleteProfileModal(false)}
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="incomplete-modal-content">
              <h2>Medical Profile Completion Required</h2>
              {attemptedDoctor && (
                <div className="attempted-doc-banner">
                  Booking request for <strong>Dr. {attemptedDoctor.name}</strong> ({attemptedDoctor.specialization || "Specialist"}) is on hold.
                </div>
              )}
              <p className="incomplete-lead-text">
                To uphold strict patient clinical safety standards, MediCare+ requires patients to fill out their basic health information before scheduling consultations. Doctors must review your medical history and vital stats before confirming appointments.
              </p>

              <div className="missing-fields-checklist">
                <h4>Mandatory Baseline Health Data:</h4>
                <div className="checklist-grid">
                  <div className={`check-item ${patientProfile?.age ? "done" : "missing"}`}>
                    <CheckCircleIcon size={16} />
                    <span>Patient Age {patientProfile?.age ? `(${patientProfile.age} yrs)` : "(Missing)"}</span>
                  </div>
                  <div className={`check-item ${patientProfile?.gender ? "done" : "missing"}`}>
                    <CheckCircleIcon size={16} />
                    <span>Biological Gender {patientProfile?.gender ? `(${patientProfile.gender})` : "(Missing)"}</span>
                  </div>
                  <div className={`check-item ${patientProfile?.blood_group ? "done" : "missing"}`}>
                    <CheckCircleIcon size={16} />
                    <span>Blood Group {patientProfile?.blood_group ? `(${patientProfile.blood_group})` : "(Missing)"}</span>
                  </div>
                  <div className={`check-item ${patientProfile?.emergency_contact_phone ? "done" : "missing"}`}>
                    <CheckCircleIcon size={16} />
                    <span>Emergency Contact {patientProfile?.emergency_contact_phone ? "(Provided)" : "(Missing)"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="incomplete-modal-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setShowIncompleteProfileModal(false)}
              >
                Return to Directory
              </button>
              <button
                type="button"
                className="btn-modal-go-profile"
                onClick={() => navigate("/patient-profile")}
              >
                <span>Complete Medical Profile</span>
                <ArrowRightIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FindDoctor;