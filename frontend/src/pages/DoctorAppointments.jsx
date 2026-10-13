
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DoctorAppointments.css";

const API_URL = "http://localhost:5000/api";

function DoctorAppointments() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  let storedUser = {};
  try {
    storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    storedUser = {};
  }

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const [chatAppointment, setChatAppointment] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const fetchAppointments = useCallback(
    async (showLoading = false) => {
      try {
        if (!token) {
          setError("Please log in again.");
          setLoading(false);
          return;
        }

        if (showLoading) setLoading(true);

        const response = await fetch(
          `${API_URL}/appointments/doctor`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load appointments."
          );
        }

        setAppointments(Array.isArray(data) ? data : []);
        setError("");
      } catch (err) {
        setError(err.message || "Failed to load appointments.");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchAppointments(true);

    const timer = setInterval(() => {
      fetchAppointments(false);
    }, 10000);

    return () => clearInterval(timer);
  }, [fetchAppointments]);

  async function updateStatus(appointmentId, status) {
    try {
      setUpdatingId(appointmentId);
      setError("");

      const response = await fetch(
        `${API_URL}/appointments/${appointmentId}/status`,
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
          data.message || "Failed to update appointment."
        );
      }

      await fetchAppointments(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function startOnlineConsultation(appointment) {
    try {
      setUpdatingId(appointment.id);
      setError("");

      if (appointment.status !== "Confirmed") {
        throw new Error(
          "Only confirmed appointments can be started."
        );
      }

      if (appointment.consultation_mode !== "Online") {
        throw new Error("This is not an online consultation.");
      }

      if (!appointment.meeting_link) {
        throw new Error(
          "The online consultation room is unavailable."
        );
      }

      const response = await fetch(
        `${API_URL}/appointments/${appointment.id}/start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not start consultation."
        );
      }

      await fetchAppointments(false);

      navigate(`/online-consultation/${appointment.id}`, {
        state: {
          appointment: {
            ...appointment,
            consultation_started_at:
              data.consultation_started_at,
          },
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  function openChat(appointment) {
    setChatAppointment(appointment);
    setMessages([]);
    setChatMessage("");
    setChatError("");
    setChatLoading(true);
  }

  const fetchMessages = useCallback(async () => {
    if (!chatAppointment || !token) return;

    try {
      const response = await fetch(
        `${API_URL}/appointments/${chatAppointment.id}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load chat.");
      }

      if (Array.isArray(data)) {
        setMessages(data);
      }

      setChatError("");
    } catch (err) {
      setChatError(err.message);
    } finally {
      setChatLoading(false);
    }
  }, [chatAppointment, token]);

  useEffect(() => {
    if (!chatAppointment) return;

    fetchMessages();

    const timer = setInterval(fetchMessages, 3000);

    return () => clearInterval(timer);
  }, [chatAppointment, fetchMessages]);

  async function sendMessage(event) {
    event.preventDefault();

    const message = chatMessage.trim();

    if (!message || !chatAppointment || sendingMessage) return;

    try {
      setSendingMessage(true);
      setChatError("");

      const response = await fetch(
        `${API_URL}/appointments/${chatAppointment.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to send message."
        );
      }

      setMessages((previous) => {
        if (previous.some((item) => item.id === data.id)) {
          return previous;
        }

        return [...previous, data];
      });

      setChatMessage("");
    } catch (err) {
      setChatError(err.message);
    } finally {
      setSendingMessage(false);
    }
  }

  async function cancelAppointment(appointment) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );

    if (!confirmed) return;

    try {
      setUpdatingId(appointment.id);
      setError("");

      const response = await fetch(
        `${API_URL}/appointments/${appointment.id}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to cancel appointment."
        );
      }

      await fetchAppointments(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeFromHistory(appointment) {
    const confirmed = window.confirm(
      "Remove this appointment from your history? This will not delete the patient's medical records."
    );

    if (!confirmed) return;

    try {
      setUpdatingId(appointment.id);
      setError("");

      const response = await fetch(
        `${API_URL}/appointments/${appointment.id}/history`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to remove appointment history."
        );
      }

      setAppointments((previous) =>
        previous.filter((item) => item.id !== appointment.id)
      );

      if (chatAppointment?.id === appointment.id) {
        setChatAppointment(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  function openConsultationForm(appointment) {
    navigate("/doctor-consultation", {
      state: { appointment },
    });
  }

  function formatDateTime(value) {
    if (!value) return "Not started";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString();
  }

  function getStatusClass(status) {
    return (status || "pending")
      .toLowerCase()
      .replace(/\s+/g, "-");
  }

  return (
    <div className="doctor-appointments-page">
      <header className="appointments-header">
        <div>
          <h1>Appointment Requests</h1>
          <p>Manage patient appointments and consultations.</p>
        </div>

        <button
          type="button"
          className="back-dashboard-btn"
          onClick={() => navigate("/doctor-dashboard")}
        >
          Back to Dashboard
        </button>
      </header>

      {error && (
        <div className="appointments-error" role="alert">
          {error}
        </div>
      )}

      {loading && (
        <p className="appointments-status">
          Loading appointment requests...
        </p>
      )}

      {!loading && appointments.length === 0 && !error && (
        <div className="empty-appointments">
          <div className="empty-icon">📅</div>
          <h2>No appointment requests yet</h2>
          <p>Patient appointment requests will appear here.</p>
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
                {appointment.patient_name?.charAt(0).toUpperCase() ||
                  "P"}
              </div>

              <div className="patient-info">
                <h2>{appointment.patient_name || "Patient"}</h2>
                <p>{appointment.patient_email || ""}</p>
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
                <span>Scheduled date</span>
                <strong>{appointment.appointment_date}</strong>
              </div>

              <div>
                <span>Scheduled time</span>
                <strong>{appointment.appointment_time}</strong>
              </div>

              <div>
                <span>Consultation mode</span>
                <strong
                  className={
                    appointment.consultation_mode === "Online"
                      ? "doctor-online-mode"
                      : "doctor-offline-mode"
                  }
                >
                  {appointment.consultation_mode || "Offline"}
                </strong>
              </div>
            </div>

            {appointment.consultation_started_at && (
              <p className="consultation-timestamp">
                <strong>Actual start:</strong>{" "}
                {formatDateTime(
                  appointment.consultation_started_at
                )}
              </p>
            )}

            {appointment.consultation_ended_at && (
              <p className="consultation-timestamp">
                <strong>Actual end:</strong>{" "}
                {formatDateTime(
                  appointment.consultation_ended_at
                )}
              </p>
            )}

            {appointment.consultation_mode === "Online" ? (
              <div className="doctor-online-box">
                <div className="doctor-online-info">
                  <div className="doctor-online-icon">💻</div>
                  <div>
                    <strong>Online Consultation</strong>
                    <p>
                      Start the consultation to open the online
                      consultation room.
                    </p>
                  </div>
                </div>

                {appointment.status === "Confirmed" && (
                  <button
                    type="button"
                    className="start-consultation-btn"
                    disabled={updatingId === appointment.id}
                    onClick={() =>
                      startOnlineConsultation(appointment)
                    }
                  >
                    {updatingId === appointment.id
                      ? "Opening..."
                      : "🎥 Start Consultation"}
                  </button>
                )}

                {appointment.status === "Pending" && (
                  <span className="doctor-waiting-text">
                    ⏳ Waiting for confirmation
                  </span>
                )}

                {appointment.status === "Completed" && (
                  <span className="doctor-completed-text">
                    ✓ Consultation completed
                  </span>
                )}
              </div>
            ) : (
              <div className="doctor-offline-box">
                <div className="doctor-offline-icon">🏥</div>
                <div>
                  <strong>Offline Consultation</strong>
                  <p>
                    Patient will visit the hospital for the
                    consultation.
                  </p>
                </div>
              </div>
            )}

            <div className="symptoms-section">
              <h3>Symptoms / Reason</h3>
              <p>
                {appointment.symptoms || "No symptoms provided."}
              </p>
            </div>

            <div className="appointment-actions">
              {appointment.status === "Pending" && (
                <>
                  <button
                    type="button"
                    className="confirm-btn"
                    disabled={updatingId === appointment.id}
                    onClick={() =>
                      updateStatus(appointment.id, "Confirmed")
                    }
                  >
                    {updatingId === appointment.id
                      ? "Updating..."
                      : "Confirm"}
                  </button>

                  <button
                    type="button"
                    className="reject-btn"
                    disabled={updatingId === appointment.id}
                    onClick={() =>
                      updateStatus(appointment.id, "Rejected")
                    }
                  >
                    Reject
                  </button>
                </>
              )}

              {appointment.status === "Confirmed" && (
                <>
                  <button
                    type="button"
                    className="consultation-btn"
                    onClick={() => openChat(appointment)}
                  >
                    💬 Chat with Patient
                  </button>

                  <button
                    type="button"
                    className="complete-btn"
                    disabled={updatingId === appointment.id}
                    onClick={() =>
                      updateStatus(appointment.id, "Completed")
                    }
                  >
                    {updatingId === appointment.id
                      ? "Updating..."
                      : "Mark as Completed"}
                  </button>
                </>
              )}

              {appointment.status === "Completed" && (
                <>
                  <span className="completed-text">
                    Consultation completed
                  </span>

                  <button
                    type="button"
                    className="consultation-btn"
                    onClick={() => openChat(appointment)}
                  >
                    💬 View Chat
                  </button>

                  <button
                    type="button"
                    className="consultation-btn"
                    onClick={() =>
                      openConsultationForm(appointment)
                    }
                  >
                    📝 Add Consultation
                  </button>
                </>
              )}

              {appointment.status === "Rejected" && (
                <span className="rejected-text">
                  Appointment rejected
                </span>
              )}

              {["Pending", "Confirmed"].includes(
                appointment.status
              ) && (
                <button
                  type="button"
                  className="reject-btn"
                  disabled={updatingId === appointment.id}
                  onClick={() => cancelAppointment(appointment)}
                >
                  Cancel Appointment
                </button>
              )}

              <button
                type="button"
                className="consultation-btn"
                disabled={updatingId === appointment.id}
                onClick={() => removeFromHistory(appointment)}
              >
                Remove from History
              </button>
            </div>
          </article>
        ))}
      </section>

      {chatAppointment && (
        <div
          className="appointment-chat-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setChatAppointment(null);
            }
          }}
        >
          <section
            className="appointment-chat-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Chat with patient"
          >
            <header className="appointment-chat-header">
              <div>
                <h2>
                  Chat with {chatAppointment.patient_name || "Patient"}
                </h2>
                <p>
                  Appointment #{chatAppointment.id} · Messages are saved
                </p>
              </div>

              <button
                type="button"
                onClick={() => setChatAppointment(null)}
                aria-label="Close chat"
              >
                ✕
              </button>
            </header>

            {chatError && (
              <p className="appointments-error">{chatError}</p>
            )}

            <div className="appointment-chat-messages">
              {chatLoading && messages.length === 0 && (
                <p>Loading messages...</p>
              )}

              {!chatLoading && messages.length === 0 && (
                <p className="appointment-chat-empty">
                  No messages yet. Send a message to discuss the
                  appointment or consultation arrangements.
                </p>
              )}

              {messages.map((message) => {
                const ownMessage =
                  Number(message.sender_id) === Number(storedUser.id);

                return (
                  <div
                    key={message.id}
                    className={`appointment-chat-message ${
                      ownMessage ? "own-message" : "other-message"
                    }`}
                  >
                    <strong>
                      {message.sender_name ||
                        (ownMessage ? "You" : "Patient")}
                    </strong>
                    <p>{message.message}</p>
                    <small>
                      {formatDateTime(message.created_at)}
                    </small>
                  </div>
                );
              })}
            </div>

            <form
              className="appointment-chat-form"
              onSubmit={sendMessage}
            >
              <input
                type="text"
                value={chatMessage}
                onChange={(event) =>
                  setChatMessage(event.target.value)
                }
                placeholder="Message the patient..."
                maxLength={2000}
                aria-label="Chat message"
              />

              <button
                type="submit"
                disabled={!chatMessage.trim() || sendingMessage}
              >
                {sendingMessage ? "Sending..." : "Send"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default DoctorAppointments;
