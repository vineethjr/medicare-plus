import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./FindDoctor.css";

function FindDoctor() {
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("");

  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [symptoms, setSymptoms] = useState("");

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    async function fetchDoctors() {
      try {
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
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDoctors();
  }, [token]);

  const specializations = [
    ...new Set(
      doctors
        .map((doctor) => doctor.specialization)
        .filter((item) => item)
    ),
  ];

  const filteredDoctors = doctors.filter((doctor) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      doctor.name?.toLowerCase().includes(searchText) ||
      doctor.specialization?.toLowerCase().includes(searchText) ||
      doctor.hospital?.toLowerCase().includes(searchText);

    const matchesSpecialization =
      specialization === "" ||
      doctor.specialization === specialization;

    return matchesSearch && matchesSpecialization;
  });

  function openBookingForm(doctor) {
    setSelectedDoctor(doctor);
    setAppointmentDate("");
    setAppointmentTime("");
    setSymptoms("");
    setError("");
    setSuccess("");
  }

  function closeBookingForm() {
    if (!booking) {
      setSelectedDoctor(null);
    }
  }

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
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to book appointment");
      }

      setSuccess(data.message);

      setTimeout(() => {
        setSelectedDoctor(null);
        setSuccess("");
      }, 1800);
    } catch (error) {
      setError(error.message);
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className="find-doctor-page">
      <header className="find-doctor-header">
        <div>
          <h1>Find a Doctor</h1>
          <p>
            Search and choose the right doctor for your consultation.
          </p>
        </div>

        <button
          className="back-dashboard-btn"
          onClick={() => navigate("/patient-dashboard")}
        >
          Back to Dashboard
        </button>
      </header>

      <section className="doctor-search-section">
        <input
          type="text"
          placeholder="Search by doctor name, specialization or hospital..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          value={specialization}
          onChange={(event) => setSpecialization(event.target.value)}
        >
          <option value="">All Specializations</option>

          {specializations.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </section>

      {loading && <p className="status-message">Loading doctors...</p>}

      {error && !selectedDoctor && (
        <p className="error-message">{error}</p>
      )}

      {!loading && !error && filteredDoctors.length === 0 && (
        <p className="status-message">
          No doctors found. Try another search.
        </p>
      )}

      <section className="doctor-grid">
        {filteredDoctors.map((doctor) => (
          <div className="doctor-card" key={doctor.id}>
            <div className="doctor-avatar">
              {doctor.name?.charAt(0).toUpperCase()}
            </div>

            <h2>{doctor.name}</h2>

            <p className="doctor-specialization">
              {doctor.specialization || "Specialization not added"}
            </p>

            <div className="doctor-details">
              <p>
                <strong>Qualification:</strong>{" "}
                {doctor.qualification || "Not provided"}
              </p>

              <p>
                <strong>Experience:</strong>{" "}
                {doctor.experience || 0} years
              </p>

              <p>
                <strong>Hospital:</strong>{" "}
                {doctor.hospital || "Not provided"}
              </p>

              <p>
                <strong>Consultation Fee:</strong> ₹
                {doctor.consultation_fee || 0}
              </p>

              <p>
                <strong>Availability:</strong>{" "}
                {doctor.availability || "Not updated"}
              </p>
            </div>

            <button
              className="consult-btn"
              onClick={() => openBookingForm(doctor)}
            >
              Book Consultation
            </button>
          </div>
        ))}
      </section>

      {/* Booking Modal */}
      {selectedDoctor && (
        <div className="booking-overlay">
          <div className="booking-modal">
            <button
              className="close-modal-btn"
              onClick={closeBookingForm}
              disabled={booking}
            >
              ✕
            </button>

            <h2>Book Consultation</h2>

            <p className="booking-doctor-name">
              Dr. {selectedDoctor.name}
            </p>

            <p className="booking-doctor-specialization">
              {selectedDoctor.specialization}
            </p>

            <form onSubmit={handleBooking}>
              <label htmlFor="appointment-date">
                Appointment Date
              </label>

              <input
                id="appointment-date"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={appointmentDate}
                onChange={(event) =>
                  setAppointmentDate(event.target.value)
                }
                required
              />

              <label htmlFor="appointment-time">
                Appointment Time
              </label>

              <input
                id="appointment-time"
                type="time"
                value={appointmentTime}
                onChange={(event) =>
                  setAppointmentTime(event.target.value)
                }
                required
              />

              <label htmlFor="symptoms">
                Symptoms / Reason for Consultation
              </label>

              <textarea
                id="symptoms"
                placeholder="Describe your symptoms or consultation reason..."
                value={symptoms}
                onChange={(event) => setSymptoms(event.target.value)}
                rows="4"
              />

              {error && (
                <p className="booking-error-message">{error}</p>
              )}

              {success && (
                <p className="booking-success-message">{success}</p>
              )}

              <button
                className="submit-booking-btn"
                type="submit"
                disabled={booking}
              >
                {booking ? "Submitting..." : "Submit Appointment Request"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FindDoctor;