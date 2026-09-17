import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DoctorAppointments.css";

function DoctorAppointments() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const token = localStorage.getItem("token");

  async function fetchAppointments() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5000/api/appointments/doctor",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load appointments"
        );
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

  async function updateStatus(appointmentId, status) {
    try {
      setUpdatingId(appointmentId);
      setError("");

      const response = await fetch(
        `http://localhost:5000/api/appointments/${appointmentId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update appointment"
        );
      }

      setAppointments((previousAppointments) =>
        previousAppointments.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, status }
            : appointment
        )
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setUpdatingId(null);
    }
  }

  function getStatusClass(status) {
    return status.toLowerCase();
  }

  return (
    <div className="doctor-appointments-page">
      <header className="appointments-header">
        <div>
          <h1>Appointment Requests</h1>
          <p>Manage your patient consultation requests.</p>
        </div>

        <button
          className="back-dashboard-btn"
          onClick={() => navigate("/doctor-dashboard")}
        >
          Back to Dashboard
        </button>
      </header>

      {loading && (
        <p className="appointments-status">
          Loading appointment requests...
        </p>
      )}

      {error && <p className="appointments-error">{error}</p>}

      {!loading && !error && appointments.length === 0 && (
        <div className="empty-appointments">
          <div className="empty-icon">📅</div>
          <h2>No appointment requests yet</h2>
          <p>
            Patient appointment requests will appear here.
          </p>
        </div>
      )}

      <section className="appointments-list">
        {appointments.map((appointment) => (
          <article
            className="appointment-card"
            key={appointment.id}
          >
            <div className="appointment-card-header">
              <div className="patient-avatar">
                {appointment.patient_name
                  ?.charAt(0)
                  .toUpperCase() || "P"}
              </div>

              <div className="patient-info">
                <h2>{appointment.patient_name}</h2>
                <p>{appointment.patient_email}</p>
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
                <span>Date</span>
                <strong>{appointment.appointment_date}</strong>
              </div>

              <div>
                <span>Time</span>
                <strong>{appointment.appointment_time}</strong>
              </div>
            </div>

            <div className="symptoms-section">
              <h3>Symptoms / Reason</h3>
              <p>
                {appointment.symptoms ||
                  "No symptoms provided."}
              </p>
            </div>

            <div className="appointment-actions">
              {appointment.status === "Pending" && (
                <>
                  <button
                    className="confirm-btn"
                    disabled={updatingId === appointment.id}
                    onClick={() =>
                      updateStatus(
                        appointment.id,
                        "Confirmed"
                      )
                    }
                  >
                    Confirm
                  </button>

                  <button
                    className="reject-btn"
                    disabled={updatingId === appointment.id}
                    onClick={() =>
                      updateStatus(
                        appointment.id,
                        "Rejected"
                      )
                    }
                  >
                    Reject
                  </button>
                </>
              )}

              {appointment.status === "Confirmed" && (
                <button
                  className="complete-btn"
                  disabled={updatingId === appointment.id}
                  onClick={() =>
                    updateStatus(
                      appointment.id,
                      "Completed"
                    )
                  }
                >
                  Mark as Completed
                </button>
              )}

              {appointment.status === "Completed" && (
                <span className="completed-text">
                  Consultation completed
                </span>
              )}

              {appointment.status === "Rejected" && (
                <span className="rejected-text">
                  Appointment rejected
                </span>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default DoctorAppointments;