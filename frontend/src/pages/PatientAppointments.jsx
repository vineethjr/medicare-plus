import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PatientAppointments.css";

function PatientAppointments() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Used to refresh the UI when the consultation time is reached
  const [currentTime, setCurrentTime] = useState(new Date());

  const token = localStorage.getItem("token");

  // ========================================
  // FETCH APPOINTMENTS
  // ========================================

  async function fetchAppointments() {
    try {
      setLoading(true);
      setError("");

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

  // ========================================
  // INITIAL FETCH
  // ========================================

  useEffect(() => {
    fetchAppointments();
  }, []);

  // ========================================
  // LIVE CLOCK
  // Checks every 30 seconds whether the
  // consultation time has been reached
  // ========================================

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  // ========================================
  // STATUS CLASS
  // ========================================

  function getStatusClass(status) {
    return status.toLowerCase();
  }

  // ========================================
  // CHECK CONSULTATION TIME
  // ========================================

  function isConsultationTimeReached(appointment) {
    if (
      !appointment.appointment_date ||
      !appointment.appointment_time
    ) {
      return false;
    }

    const appointmentDateTime = new Date(
      `${appointment.appointment_date}T${appointment.appointment_time}`
    );

    return currentTime >= appointmentDateTime;
  }

  // ========================================
  // JOIN ONLINE CONSULTATION
  // ========================================

  function joinConsultation(appointment) {
    if (!appointment.meeting_link) {
      setError(
        "Online consultation room is not available yet."
      );
      return;
    }

    navigate(
      `/online-consultation/${appointment.id}`
    );
  }

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="patient-appointments-page">

      {/* ========================================
          HEADER
      ======================================== */}

      <div className="appointments-header">

        <div>
          <h1>My Appointments</h1>

          <p>
            View and track your doctor consultations
          </p>
        </div>

        <button
          className="back-dashboard-button"
          onClick={() =>
            navigate("/patient-dashboard")
          }
        >
          ← Dashboard
        </button>

      </div>

      {/* ========================================
          LOADING
      ======================================== */}

      {loading && (
        <div className="appointments-message">
          Loading your appointments...
        </div>
      )}

      {/* ========================================
          ERROR
      ======================================== */}

      {error && (
        <div className="appointments-error">
          {error}
        </div>
      )}

      {/* ========================================
          EMPTY APPOINTMENTS
      ======================================== */}

      {!loading &&
        !error &&
        appointments.length === 0 && (

          <div className="empty-appointments">

            <div className="empty-icon">
              📅
            </div>

            <h2>
              No Appointments Yet
            </h2>

            <p>
              You have not booked any doctor appointments.
            </p>

            <button
              onClick={() =>
                navigate("/find-doctor")
              }
            >
              Find a Doctor
            </button>

          </div>
        )}

      {/* ========================================
          APPOINTMENTS LIST
      ======================================== */}

      {!loading &&
        !error &&
        appointments.length > 0 && (

          <div className="patient-appointments-list">

            {appointments.map((appointment) => (

              <div
                className="patient-appointment-card"
                key={appointment.id}
              >

                {/* ==================================
                    TOP SECTION
                ================================== */}

                <div className="appointment-card-top">

                  <div className="doctor-avatar">

                    {appointment.doctor_name
                      ?.charAt(0)
                      .toUpperCase() || "D"}

                  </div>

                  <div className="doctor-info">

                    <h2>
                      Dr.{" "}
                      {appointment.doctor_name ||
                        "Doctor"}
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

                {/* ==================================
                    APPOINTMENT DETAILS
                ================================== */}

                <div className="appointment-details">

                  {/* DATE */}

                  <div>

                    <span>
                      📅 Date
                    </span>

                    <strong>
                      {appointment.appointment_date}
                    </strong>

                  </div>

                  {/* TIME */}

                  <div>

                    <span>
                      ⏰ Time
                    </span>

                    <strong>
                      {appointment.appointment_time}
                    </strong>

                  </div>

                  {/* MODE */}

                  <div>

                    <span>
                      💻 / 🏥 Mode
                    </span>

                    <strong
                      className={
                        appointment.consultation_mode ===
                        "Online"
                          ? "online-mode"
                          : "offline-mode"
                      }
                    >
                      {appointment.consultation_mode ||
                        "Offline"}
                    </strong>

                  </div>

                </div>

                {/* ==================================
                    ONLINE CONSULTATION
                ================================== */}

                {appointment.consultation_mode ===
                  "Online" && (

                  <div className="online-consultation-box">

                    <div className="online-info">

                      <span className="online-icon">
                        💻
                      </span>

                      <div>

                        <strong>
                          Online Consultation
                        </strong>

                        <p>
                          Join the consultation room
                          at your scheduled time.
                        </p>

                      </div>

                    </div>

                    {/* ==============================
                        CONFIRMED
                    ============================== */}

                    {appointment.status ===
                      "Confirmed" && (

                      <div className="confirmed-consultation">

                        <div className="consultation-time">

                          <span className="time-icon">
                            🕐
                          </span>

                          <div>

                            <strong>
                              Consultation starts at
                            </strong>

                            <p>
                              {appointment.appointment_time}
                            </p>

                          </div>

                        </div>

                        {/* ==========================
                            BEFORE CONSULTATION TIME
                        ========================== */}

                        {!isConsultationTimeReached(
                          appointment
                        ) && (

                          <span className="consultation-not-started">
                            ⏳ Available at scheduled time
                          </span>

                        )}

                        {/* ==========================
                            CONSULTATION TIME REACHED
                        ========================== */}

                        {isConsultationTimeReached(
                          appointment
                        ) && (

                          <button
                            className="join-consultation-btn"
                            onClick={() =>
                              joinConsultation(
                                appointment
                              )
                            }
                          >
                            🎥 Join Consultation
                          </button>

                        )}

                      </div>
                    )}

                    {/* ==============================
                        PENDING
                    ============================== */}

                    {appointment.status ===
                      "Pending" && (

                      <span className="waiting-consultation">
                        ⏳ Waiting for doctor confirmation
                      </span>

                    )}

                    {/* ==============================
                        COMPLETED
                    ============================== */}

                    {appointment.status ===
                      "Completed" && (

                      <span className="completed-consultation">
                        ✓ Consultation completed
                      </span>

                    )}

                    {/* ==============================
                        REJECTED
                    ============================== */}

                    {appointment.status ===
                      "Rejected" && (

                      <span className="rejected-consultation">
                        ✕ Consultation request rejected
                      </span>

                    )}

                  </div>
                )}

                {/* ==================================
                    OFFLINE CONSULTATION
                ================================== */}

                {appointment.consultation_mode !==
                  "Online" && (

                  <div className="offline-consultation-box">

                    <span className="offline-icon">
                      🏥
                    </span>

                    <div>

                      <strong>
                        Offline Consultation
                      </strong>

                      <p>
                        Visit the hospital for your
                        scheduled appointment.
                      </p>

                      <span className="hospital-name">
                        📍{" "}
                        {appointment.hospital ||
                          "Hospital details not provided"}
                      </span>

                    </div>

                  </div>
                )}

                {/* ==================================
                    SYMPTOMS
                ================================== */}

                <div className="appointment-symptoms">

                  <strong>
                    Symptoms:
                  </strong>

                  <p>
                    {appointment.symptoms ||
                      "No symptoms provided"}
                  </p>

                </div>

              </div>

            ))}

          </div>
        )}

    </div>
  );
}

export default PatientAppointments;