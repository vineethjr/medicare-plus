import { useEffect, useState } from "react";
import "./PatientAppointments.css";

function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  async function fetchAppointments() {
    try {
      const response = await fetch(
        "http://localhost:5000/api/appointments/patient",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load appointments");
      }

      setAppointments(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

  function getStatusClass(status) {
    return status.toLowerCase();
  }

  return (
    <div className="patient-appointments-page">
      <div className="appointments-header">
        <div>
          <h1>My Appointments</h1>
          <p>View and track your doctor consultations</p>
        </div>

        <button
          className="back-dashboard-button"
          onClick={() => (window.location.href = "/patient-dashboard")}
        >
          ← Dashboard
        </button>
      </div>

      {loading && (
        <div className="appointments-message">
          Loading your appointments...
        </div>
      )}

      {error && (
        <div className="appointments-error">
          {error}
        </div>
      )}

      {!loading && !error && appointments.length === 0 && (
        <div className="empty-appointments">
          <div className="empty-icon">📅</div>
          <h2>No Appointments Yet</h2>
          <p>
            You have not booked any doctor appointments.
          </p>

          <button
            onClick={() => (window.location.href = "/find-doctor")}
          >
            Find a Doctor
          </button>
        </div>
      )}

      <div className="patient-appointments-list">
        {appointments.map((appointment) => (
          <div
            className="patient-appointment-card"
            key={appointment.id}
          >
            <div className="appointment-card-top">
              <div className="doctor-avatar">
                {appointment.doctor_name
                  ?.charAt(0)
                  .toUpperCase() || "D"}
              </div>

              <div className="doctor-info">
                <h2>
                  Dr. {appointment.doctor_name || "Doctor"}
                </h2>

                <p>
                  {appointment.specialization ||
                    "General Physician"}
                </p>
              </div>

              <span
                className={`appointment-status ${getStatusClass(
                  appointment.status
                )}`}
              >
                {appointment.status}
              </span>
            </div>

            <div className="appointment-details">
              <div>
                <span>📅 Date</span>
                <strong>{appointment.appointment_date}</strong>
              </div>

              <div>
                <span>⏰ Time</span>
                <strong>{appointment.appointment_time}</strong>
              </div>

              <div>
                <span>🏥 Hospital</span>
                <strong>
                  {appointment.hospital || "Not specified"}
                </strong>
              </div>
            </div>

            <div className="appointment-symptoms">
              <strong>Symptoms:</strong>
              <p>
                {appointment.symptoms ||
                  "No symptoms provided"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PatientAppointments;