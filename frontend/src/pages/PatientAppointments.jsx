
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PatientAppointments.css";

const API_URL = "http://localhost:5000/api";

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function PatientAppointments() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [user] = useState(readUser);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [chatAppointment, setChatAppointment] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");

  const fetchAppointments = useCallback(async (showLoading = false) => {
    if (!token) {
      setError("Please log in again.");
      setLoading(false);
      return;
    }

    try {
      if (showLoading) setLoading(true);

      const response = await fetch(`${API_URL}/appointments/patient`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load appointments.");
      }

      setAppointments(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAppointments(true);

    const timer = setInterval(() => {
      fetchAppointments(false);
    }, 10000);

    return () => clearInterval(timer);
  }, [fetchAppointments]);

  const fetchMessages = useCallback(async () => {
    if (!chatAppointment || !token) return;

    try {
      const response = await fetch(
        `${API_URL}/appointments/${chatAppointment.id}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load messages.");
      }

      // Fetch the complete message list so both participants see the
      // same persistent conversation after opening or refreshing chat.
      setMessages(Array.isArray(data) ? data : data.messages || []);
      setChatError("");
    } catch (err) {
      setChatError(err.message || "Unable to load messages.");
    } finally {
      setChatLoading(false);
    }
  }, [chatAppointment, token]);

  useEffect(() => {
    if (!chatAppointment) return;

    setChatLoading(true);
    fetchMessages();

    const timer = setInterval(fetchMessages, 3000);
    return () => clearInterval(timer);
  }, [chatAppointment, fetchMessages]);

  function openChat(appointment) {
    setMessages([]);
    setChatText("");
    setChatError("");
    setChatAppointment(appointment);
  }

  async function sendMessage(event) {
    event.preventDefault();

    const message = chatText.trim();
    if (!message || !chatAppointment || sending) return;

    try {
      setSending(true);
      setChatError("");

      const response = await fetch(
        `${API_URL}/appointments/${chatAppointment.id}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        }
      );

      const saved = await response.json();

      if (!response.ok) {
        throw new Error(saved.message || "Failed to send message.");
      }

      setChatText("");

      // Reload from SQLite instead of relying on a local-only message.
      await fetchMessages();
    } catch (err) {
      setChatError(err.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  async function cancelAppointment(appointment) {
    const confirmed = window.confirm(
      `Cancel the appointment with Dr. ${appointment.doctor_name}?`
    );

    if (!confirmed) return;

    try {
      setBusyId(appointment.id);
      setError("");

      const response = await fetch(
        `${API_URL}/appointments/${appointment.id}/cancel`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not cancel appointment.");
      }

      await fetchAppointments(false);

      if (chatAppointment?.id === appointment.id) {
        setChatAppointment(null);
      }
    } catch (err) {
      setError(err.message || "Could not cancel appointment.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeFromHistory(appointment) {
    const confirmed = window.confirm(
      "Remove this appointment from your history? Medical records will be preserved."
    );

    if (!confirmed) return;

    try {
      setBusyId(appointment.id);
      setError("");

      const response = await fetch(
        `${API_URL}/appointments/${appointment.id}/history`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not remove appointment.");
      }

      setAppointments((previous) =>
        previous.filter((item) => item.id !== appointment.id)
      );

      if (chatAppointment?.id === appointment.id) {
        setChatAppointment(null);
      }
    } catch (err) {
      setError(err.message || "Could not remove appointment.");
    } finally {
      setBusyId(null);
    }
  }

  function joinConsultation(appointment) {
    if (!appointment.meeting_link) {
      setError("The online consultation room is unavailable.");
      return;
    }

    navigate(`/online-consultation/${appointment.id}`);
  }

  function formatDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleString();
  }

  function statusClass(status) {
    return (status || "pending").toLowerCase();
  }

  return (
    <div className="patient-appointments-page">
      <header className="appointments-header">
        <div>
          <h1>My Appointments</h1>
          <p>Manage appointments and communicate with your doctor.</p>
        </div>

        <button
          className="back-dashboard-button"
          onClick={() => navigate("/patient-dashboard")}
        >
          ← Dashboard
        </button>
      </header>

      {error && (
        <div className="appointments-error" role="alert">
          {error}
        </div>
      )}

      {loading && <p className="appointments-message">Loading appointments...</p>}

      {!loading && appointments.length === 0 && (
        <div className="empty-appointments">
          <div className="empty-icon">📅</div>
          <h2>No Appointments</h2>
          <p>Your appointments will appear here.</p>
          <button onClick={() => navigate("/find-doctor")}>
            Find a Doctor
          </button>
        </div>
      )}

      <div className="patient-appointments-list">
        {appointments.map((appointment) => {
          const status = appointment.status || "Pending";
          const isBusy = busyId === appointment.id;
          const canCancel = ["Pending", "Confirmed"].includes(status);
          const canChat = ["Confirmed", "Completed"].includes(status);

          return (
            <article className="patient-appointment-card" key={appointment.id}>
              <div className="appointment-card-top">
                <div className="doctor-avatar">
                  {appointment.doctor_name?.charAt(0).toUpperCase() || "D"}
                </div>

                <div className="doctor-info">
                  <h2>Dr. {appointment.doctor_name || "Doctor"}</h2>
                  <p>{appointment.specialization || "General Physician"}</p>
                </div>

                <span className={`appointment-status ${statusClass(status)}`}>
                  {status}
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
                  <span>Consultation mode</span>
                  <strong>{appointment.consultation_mode || "Offline"}</strong>
                </div>
              </div>

              {appointment.consultation_started_at && (
                <p className="consultation-timestamp">
                  <strong>Actual start:</strong>{" "}
                  {formatDateTime(appointment.consultation_started_at)}
                </p>
              )}

              {appointment.consultation_ended_at && (
                <p className="consultation-timestamp">
                  <strong>Actual end:</strong>{" "}
                  {formatDateTime(appointment.consultation_ended_at)}
                </p>
              )}

              {appointment.symptoms && (
                <div className="appointment-symptoms">
                  <strong>Symptoms:</strong>
                  <p>{appointment.symptoms}</p>
                </div>
              )}

              {appointment.consultation_mode === "Online" &&
                status === "Confirmed" && (
                  <div className="online-consultation-box">
                    <strong>💻 Online Consultation</strong>
                    <p>The doctor may start the consultation early. Check your chat for updates.</p>
                    <button
                      className="join-consultation-btn"
                      onClick={() => joinConsultation(appointment)}
                    >
                      🎥 Join Consultation
                    </button>
                  </div>
                )}

              {status === "Pending" && (
                <p className="waiting-consultation">
                  ⏳ Waiting for doctor confirmation
                </p>
              )}

              {status === "Completed" && (
                <p className="completed-consultation">
                  ✓ Consultation completed
                </p>
              )}

              {status === "Cancelled" && (
                <p className="rejected-consultation">
                  Appointment cancelled
                </p>
              )}

              <div className="patient-appointment-actions">
                {canChat && (
                  <button
                    className="patient-chat-button"
                    onClick={() => openChat(appointment)}
                  >
                    💬 Chat with Doctor
                  </button>
                )}

                {canCancel && (
                  <button
                    className="patient-cancel-button"
                    disabled={isBusy}
                    onClick={() => cancelAppointment(appointment)}
                  >
                    {isBusy ? "Please wait..." : "Cancel Appointment"}
                  </button>
                )}

                <button
                  className="patient-history-delete-button"
                  disabled={isBusy}
                  onClick={() => removeFromHistory(appointment)}
                >
                  Remove from History
                </button>
              </div>
            </article>
          );
        })}
      </div>

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
            aria-label="Chat with doctor"
          >
            <header className="appointment-chat-header">
              <div>
                <h2>Chat with Dr. {chatAppointment.doctor_name}</h2>
                <p>Appointment #{chatAppointment.id}</p>
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
              <p className="appointments-error" role="alert">
                {chatError}
              </p>
            )}

            <div className="appointment-chat-messages">
              {chatLoading && messages.length === 0 && (
                <p>Loading messages...</p>
              )}

              {!chatLoading && messages.length === 0 && (
                <p className="appointment-chat-empty">
                  No messages yet. Send a message to your doctor.
                </p>
              )}

              {messages.map((message) => {
                const ownMessage =
                  Number(message.sender_id) === Number(user.id);

                return (
                  <div
                    key={message.id}
                    className={`appointment-chat-message ${
                      ownMessage ? "own-message" : "other-message"
                    }`}
                  >
                    <strong>
                      {ownMessage
                        ? "You"
                        : message.sender_name || "Doctor"}
                    </strong>
                    <p>{message.message}</p>
                    <small>{formatDateTime(message.created_at)}</small>
                  </div>
                );
              })}
            </div>

            <form className="appointment-chat-form" onSubmit={sendMessage}>
              <input
                value={chatText}
                onChange={(event) => setChatText(event.target.value)}
                placeholder="Message your doctor..."
                maxLength={2000}
                aria-label="Chat message"
              />
              <button type="submit" disabled={!chatText.trim() || sending}>
                {sending ? "Sending..." : "Send"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default PatientAppointments;
