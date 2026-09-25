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

  function openConsultationForm(appointment) {
    navigate("/doctor-consultation", {
      state: {
        appointment,
      },
    });
  }

  // ========================================
  // START ONLINE CONSULTATION
  // ========================================

  function startOnlineConsultation(appointment) {
    if (!appointment.meeting_link) {
      setError(
        "Online consultation room is not available."
      );
      return;
    }

    navigate(
      `/online-consultation/${appointment.id}`
    );
  }

  return (
    <div className="doctor-appointments-page">

      {/* ========================================
          HEADER
      ======================================== */}

      <header className="appointments-header">

        <div>
          <h1>Appointment Requests</h1>

          <p>
            Manage your patient consultation requests.
          </p>
        </div>

        <button
          className="back-dashboard-btn"
          onClick={() =>
            navigate("/doctor-dashboard")
          }
        >
          Back to Dashboard
        </button>

      </header>

      {/* ========================================
          LOADING
      ======================================== */}

      {loading && (
        <p className="appointments-status">
          Loading appointment requests...
        </p>
      )}

      {/* ========================================
          ERROR
      ======================================== */}

      {error && (
        <p className="appointments-error">
          {error}
        </p>
      )}

      {/* ========================================
          EMPTY
      ======================================== */}

      {!loading &&
        !error &&
        appointments.length === 0 && (

          <div className="empty-appointments">

            <div className="empty-icon">
              📅
            </div>

            <h2>
              No appointment requests yet
            </h2>

            <p>
              Patient appointment requests will appear here.
            </p>

          </div>
        )}

      {/* ========================================
          APPOINTMENTS
      ======================================== */}

      <section className="appointments-list">

        {appointments.map((appointment) => (

          <article
            className="appointment-card"
            key={appointment.id}
          >

            {/* ==================================
                PATIENT HEADER
            ================================== */}

            <div className="appointment-card-header">

              <div className="patient-avatar">
                {appointment.patient_name
                  ?.charAt(0)
                  .toUpperCase() || "P"}
              </div>

              <div className="patient-info">

                <h2>
                  {appointment.patient_name}
                </h2>

                <p>
                  {appointment.patient_email}
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

            {/* ==================================
                DATE / TIME / MODE
            ================================== */}

            <div className="appointment-details">

              <div>
                <span>
                  Date
                </span>

                <strong>
                  {appointment.appointment_date}
                </strong>
              </div>

              <div>
                <span>
                  Time
                </span>

                <strong>
                  {appointment.appointment_time}
                </strong>
              </div>

              <div>
                <span>
                  Consultation
                </span>

                <strong
                  className={
                    appointment.consultation_mode ===
                    "Online"
                      ? "doctor-online-mode"
                      : "doctor-offline-mode"
                  }
                >
                  {appointment.consultation_mode ||
                    "Offline"}
                </strong>
              </div>

            </div>

            {/* ==================================
                ONLINE CONSULTATION INFO
            ================================== */}

            {appointment.consultation_mode ===
              "Online" && (

              <div className="doctor-online-box">

                <div className="doctor-online-info">

                  <div className="doctor-online-icon">
                    💻
                  </div>

                  <div>

                    <strong>
                      Online Consultation
                    </strong>

                    <p>
                      Patient will join through the
                      MediCare+ consultation room.
                    </p>

                  </div>

                </div>

                {appointment.status ===
                  "Confirmed" && (

                  <button
                    className="start-consultation-btn"
                    onClick={() =>
                      startOnlineConsultation(
                        appointment
                      )
                    }
                  >
                    🎥 Start Consultation
                  </button>

                )}

                {appointment.status ===
                  "Pending" && (

                  <span className="doctor-waiting-text">
                    ⏳ Waiting for confirmation
                  </span>

                )}

                {appointment.status ===
                  "Completed" && (

                  <span className="doctor-completed-text">
                    ✓ Consultation completed
                  </span>

                )}

              </div>
            )}

            {/* ==================================
                OFFLINE CONSULTATION INFO
            ================================== */}

            {appointment.consultation_mode !==
              "Online" && (

              <div className="doctor-offline-box">

                <div className="doctor-offline-icon">
                  🏥
                </div>

                <div>

                  <strong>
                    Offline Consultation
                  </strong>

                  <p>
                    Patient will visit the hospital
                    for the consultation.
                  </p>

                </div>

              </div>
            )}

            {/* ==================================
                SYMPTOMS
            ================================== */}

            <div className="symptoms-section">

              <h3>
                Symptoms / Reason
              </h3>

              <p>
                {appointment.symptoms ||
                  "No symptoms provided."}
              </p>

            </div>

            {/* ==================================
                ACTIONS
            ================================== */}

            <div className="appointment-actions">

              {/* PENDING */}

              {appointment.status ===
                "Pending" && (
                <>

                  <button
                    className="confirm-btn"
                    disabled={
                      updatingId ===
                      appointment.id
                    }
                    onClick={() =>
                      updateStatus(
                        appointment.id,
                        "Confirmed"
                      )
                    }
                  >
                    {updatingId ===
                    appointment.id
                      ? "Updating..."
                      : "Confirm"}
                  </button>

                  <button
                    className="reject-btn"
                    disabled={
                      updatingId ===
                      appointment.id
                    }
                    onClick={() =>
                      updateStatus(
                        appointment.id,
                        "Rejected"
                      )
                    }
                  >
                    {updatingId ===
                    appointment.id
                      ? "Updating..."
                      : "Reject"}
                  </button>

                </>
              )}

              {/* CONFIRMED */}

              {appointment.status ===
                "Confirmed" && (

                <>

                  {appointment.consultation_mode ===
                    "Online" && (

                    <button
                      className="start-consultation-btn action-start-btn"
                      onClick={() =>
                        startOnlineConsultation(
                          appointment
                        )
                      }
                    >
                      🎥 Start Consultation
                    </button>

                  )}

                  <button
                    className="complete-btn"
                    disabled={
                      updatingId ===
                      appointment.id
                    }
                    onClick={() =>
                      updateStatus(
                        appointment.id,
                        "Completed"
                      )
                    }
                  >
                    {updatingId ===
                    appointment.id
                      ? "Updating..."
                      : "Mark as Completed"}
                  </button>

                </>
              )}

              {/* COMPLETED */}

              {appointment.status ===
                "Completed" && (
                <>

                  <span className="completed-text">
                    Consultation completed
                  </span>

                  <button
                    className="consultation-btn"
                    onClick={() =>
                      openConsultationForm(
                        appointment
                      )
                    }
                  >
                    📝 Add Consultation
                  </button>

                </>
              )}

              {/* REJECTED */}

              {appointment.status ===
                "Rejected" && (

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