import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./FindDoctor.css";

function FindDoctor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Specialization received from AI recommendation
  const specializationFromAI =
    searchParams.get("specialization") || "";

  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("");

  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [symptoms, setSymptoms] = useState("");

  // NEW: Consultation mode
  const [consultationMode, setConsultationMode] =
    useState("Offline");

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  // ================================
  // FETCH DOCTORS
  // ================================

  useEffect(() => {
    async function fetchDoctors() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:5000/api/doctors",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load doctors"
          );
        }

        setDoctors(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDoctors();
  }, [token]);

  // ================================
  // GET SPECIALIZATIONS
  // ================================

  const specializations = [
    ...new Set(
      doctors
        .map((doctor) => doctor.specialization)
        .filter((item) => item)
    ),
  ];

  // ================================
  // FILTER DOCTORS
  // ================================

  const filteredDoctors = doctors.filter((doctor) => {
    const searchText = search.toLowerCase().trim();

    const doctorName =
      doctor.name?.toLowerCase() || "";

    const doctorSpecialization =
      doctor.specialization?.toLowerCase() || "";

    const doctorHospital =
      doctor.hospital?.toLowerCase() || "";

    const matchesSearch =
      !searchText ||
      doctorName.includes(searchText) ||
      doctorSpecialization.includes(searchText) ||
      doctorHospital.includes(searchText);

    const matchesManualSpecialization =
      !specialization ||
      doctorSpecialization ===
        specialization.toLowerCase();

    const matchesAISpecialization =
      !specializationFromAI ||
      doctorSpecialization ===
        specializationFromAI.toLowerCase();

    return (
      matchesSearch &&
      matchesManualSpecialization &&
      matchesAISpecialization
    );
  });

  // ================================
  // OPEN BOOKING FORM
  // ================================

  function openBookingForm(doctor) {
    setSelectedDoctor(doctor);

    setAppointmentDate("");
    setAppointmentTime("");
    setSymptoms("");

    // Default consultation mode
    setConsultationMode("Offline");

    setError("");
    setSuccess("");
  }

  // ================================
  // CLOSE BOOKING FORM
  // ================================

  function closeBookingForm() {
    if (!booking) {
      setSelectedDoctor(null);
      setError("");
      setSuccess("");
    }
  }

  // ================================
  // BOOK APPOINTMENT
  // ================================

  async function handleBooking(event) {
    event.preventDefault();

    if (!appointmentDate || !appointmentTime) {
      setError(
        "Please select appointment date and time."
      );
      return;
    }

    try {
      setBooking(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "http://localhost:5000/api/appointments",
        {
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
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to book appointment"
        );
      }

      setSuccess(
        data.message ||
          "Appointment request submitted successfully."
      );

      // Close modal after successful booking
      setTimeout(() => {
        setSelectedDoctor(null);
        setSuccess("");
        setConsultationMode("Offline");
      }, 1800);
    } catch (error) {
      setError(error.message);
    } finally {
      setBooking(false);
    }
  }

  // ================================
  // RENDER
  // ================================

  return (
    <div className="find-doctor-page">

      {/* ================================
          HEADER
      ================================= */}

      <header className="find-doctor-header">
        <div>
          <h1>Find a Doctor</h1>

          <p>
            Search and choose the right doctor for your
            consultation.
          </p>
        </div>

        <button
          className="back-dashboard-btn"
          onClick={() =>
            navigate("/patient-dashboard")
          }
        >
          ← Back to Dashboard
        </button>
      </header>

      {/* ================================
          AI RECOMMENDATION BANNER
      ================================= */}

      {specializationFromAI && (
        <div className="ai-filter-banner">
          <div className="ai-filter-icon">
            🤖
          </div>

          <div className="ai-filter-content">
            <strong>
              AI Recommendation Applied
            </strong>

            <p>
              Showing doctors specializing in{" "}
              <strong>
                {specializationFromAI}
              </strong>
            </p>
          </div>

          <button
            className="clear-ai-filter-btn"
            onClick={() =>
              navigate("/find-doctor")
            }
          >
            Clear
          </button>
        </div>
      )}

      {/* ================================
          SEARCH & FILTER
      ================================= */}

      <section className="doctor-search-section">

        <input
          type="text"
          placeholder="Search by doctor name, specialization or hospital..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <select
          value={specialization}
          onChange={(event) =>
            setSpecialization(event.target.value)
          }
        >
          <option value="">
            All Specializations
          </option>

          {specializations.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>

      </section>

      {/* ================================
          LOADING
      ================================= */}

      {loading && (
        <p className="status-message">
          Loading doctors...
        </p>
      )}

      {/* ================================
          ERROR
      ================================= */}

      {error && !selectedDoctor && (
        <p className="error-message">
          {error}
        </p>
      )}

      {/* ================================
          NO DOCTORS
      ================================= */}

      {!loading &&
        !error &&
        filteredDoctors.length === 0 && (
          <p className="status-message">
            No doctors found. Try another search or
            specialization.
          </p>
        )}

      {/* ================================
          DOCTOR GRID
      ================================= */}

      <section className="doctor-grid">

        {filteredDoctors.map((doctor) => (
          <div
            className="doctor-card"
            key={doctor.id}
          >

            {/* Doctor Avatar */}

            <div className="doctor-avatar">
              {doctor.name
                ?.charAt(0)
                .toUpperCase() || "D"}
            </div>

            {/* Doctor Name */}

            <h2>
              Dr. {doctor.name}
            </h2>

            {/* Specialization */}

            <p className="doctor-specialization">
              {doctor.specialization ||
                "Specialization not added"}
            </p>

            {/* Doctor Details */}

            <div className="doctor-details">

              <p>
                <strong>
                  Qualification:
                </strong>{" "}
                {doctor.qualification ||
                  "Not provided"}
              </p>

              <p>
                <strong>
                  Experience:
                </strong>{" "}
                {doctor.experience || 0} years
              </p>

              <p>
                <strong>
                  Hospital:
                </strong>{" "}
                {doctor.hospital ||
                  "Not provided"}
              </p>

              <p>
                <strong>
                  Consultation Fee:
                </strong>{" "}
                ₹
                {doctor.consultation_fee || 0}
              </p>

              <p>
                <strong>
                  Availability:
                </strong>{" "}
                {doctor.availability ||
                  "Not updated"}
              </p>

            </div>

            {/* Booking Button */}

            <button
              className="consult-btn"
              onClick={() =>
                openBookingForm(doctor)
              }
            >
              Book Consultation
            </button>

          </div>
        ))}

      </section>

      {/* ================================
          BOOKING MODAL
      ================================= */}

      {selectedDoctor && (
        <div className="booking-overlay">

          <div className="booking-modal">

            {/* Close */}

            <button
              className="close-modal-btn"
              onClick={closeBookingForm}
              disabled={booking}
            >
              ✕
            </button>

            <h2>
              Book Consultation
            </h2>

            <p className="booking-doctor-name">
              Dr. {selectedDoctor.name}
            </p>

            <p className="booking-doctor-specialization">
              {selectedDoctor.specialization}
            </p>

            <form onSubmit={handleBooking}>

              {/* Date */}

              <label htmlFor="appointment-date">
                Appointment Date
              </label>

              <input
                id="appointment-date"
                type="date"
                min={
                  new Date()
                    .toISOString()
                    .split("T")[0]
                }
                value={appointmentDate}
                onChange={(event) =>
                  setAppointmentDate(
                    event.target.value
                  )
                }
                required
              />

              {/* Time */}

              <label htmlFor="appointment-time">
                Appointment Time
              </label>

              <input
                id="appointment-time"
                type="time"
                value={appointmentTime}
                onChange={(event) =>
                  setAppointmentTime(
                    event.target.value
                  )
                }
                required
              />

              {/* =================================
                  CONSULTATION MODE
              ================================== */}

              <div className="consultation-mode-section">

                <label>
                  Consultation Mode
                </label>

                <div className="consultation-mode-options">

                  {/* ONLINE */}

                  <button
                    type="button"
                    className={`mode-option ${
                      consultationMode === "Online"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setConsultationMode("Online")
                    }
                  >
                    <span className="mode-icon">
                      💻
                    </span>

                    <div>
                      <strong>
                        Online
                      </strong>

                      <small>
                        Consult from anywhere
                      </small>
                    </div>
                  </button>

                  {/* OFFLINE */}

                  <button
                    type="button"
                    className={`mode-option ${
                      consultationMode === "Offline"
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setConsultationMode("Offline")
                    }
                  >
                    <span className="mode-icon">
                      🏥
                    </span>

                    <div>
                      <strong>
                        Offline
                      </strong>

                      <small>
                        Visit the hospital
                      </small>
                    </div>
                  </button>

                </div>

              </div>

              {/* Symptoms */}

              <label htmlFor="symptoms">
                Symptoms / Reason for Consultation
              </label>

              <textarea
                id="symptoms"
                placeholder="Describe your symptoms or consultation reason..."
                value={symptoms}
                onChange={(event) =>
                  setSymptoms(event.target.value)
                }
                rows="4"
              />

              {/* Booking Error */}

              {error && (
                <p className="booking-error-message">
                  {error}
                </p>
              )}

              {/* Booking Success */}

              {success && (
                <p className="booking-success-message">
                  {success}
                </p>
              )}

              {/* Submit */}

              <button
                className="submit-booking-btn"
                type="submit"
                disabled={booking}
              >
                {booking
                  ? "Submitting..."
                  : "Submit Appointment Request"}
              </button>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default FindDoctor;