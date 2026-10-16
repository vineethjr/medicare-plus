import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./FindDoctor.css";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  BabyIcon,
  BoneIcon,
  BrainIcon,
  CheckCircleIcon,
  DoctorIcon,
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

function FindDoctor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Specialization received from AI recommendation
  const specializationFromAI = searchParams.get("specialization") || "";

  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("");

  const [selectedDoctor, setSelectedDoctor] = useState(null);

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

  // Fetch doctors
  useEffect(() => {
    async function fetchDoctors() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("http://localhost:5000/api/doctors", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load doctors");
        }

        setDoctors(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDoctors();
  }, [token]);

  // Specialization list
  const specializations = [
    ...new Set(
      doctors
        .map((doctor) => doctor.specialization)
        .filter(Boolean)
    ),
  ];

  // Filter doctors
  const filteredDoctors = doctors.filter((doctor) => {
    const searchText = search.toLowerCase().trim();

    const doctorName = doctor.name?.toLowerCase() || "";
    const doctorSpecialization = doctor.specialization?.toLowerCase() || "";
    const doctorHospital = doctor.hospital?.toLowerCase() || "";

    const matchesSearch =
      !searchText ||
      doctorName.includes(searchText) ||
      doctorSpecialization.includes(searchText) ||
      doctorHospital.includes(searchText);

    const matchesManualSpecialization =
      !specialization ||
      doctorSpecialization === specialization.toLowerCase();

    const matchesAISpecialization =
      !specializationFromAI ||
      doctorSpecialization === specializationFromAI.toLowerCase();

    return (
      matchesSearch &&
      matchesManualSpecialization &&
      matchesAISpecialization
    );
  });

  // Open booking form
  function openBookingForm(doctor) {
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

      const response = await fetch("http://localhost:5000/api/appointments", {
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
          <SparklesIcon size={14} /> All Doctors
        </button>
        {[
          { name: "Cardiology", icon: HeartPulseIcon },
          { name: "Neurology", icon: BrainIcon },
          { name: "General Physician", icon: DoctorIcon },
          { name: "Pediatrics", icon: BabyIcon },
          { name: "Dermatology", icon: PillIcon },
          { name: "Orthopedics", icon: BoneIcon },
          { name: "Dentistry", icon: ToothIcon },
        ].map((item) => {
          const ItemIcon = item.icon;
          return (
            <button
              key={item.name}
              type="button"
              className={`specialty-pill-btn ${
                specialization.toLowerCase() === item.name.toLowerCase() ||
                specializationFromAI.toLowerCase() === item.name.toLowerCase()
                  ? "active"
                  : ""
              }`}
              onClick={() => setSpecialization(item.name)}
            >
              <ItemIcon size={15} />
              <span>{item.name}</span>
            </button>
          );
        })}
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

              <button
                className="consult-btn"
                onClick={() => openBookingForm(doctor)}
              >
                <span>Book Appointment</span>
                <ArrowRightIcon size={16} />
              </button>
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
    </div>
  );
}

export default FindDoctor;