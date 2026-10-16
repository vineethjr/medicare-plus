import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DoctorAppointments.css";
import {
  CalendarIcon,
  ClockIcon,
  CreditCardIcon,
  VideoIcon,
  HospitalIcon,
  FileTextIcon,
  CheckCircleIcon,
  XIcon,
  MailIcon,
  ArrowRightIcon,
  AlertCircleIcon,
} from "../components/Icons";

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
  const [filter, setFilter] = useState("all"); // 'all', 'pending', 'confirmed', 'completed', 'paid', 'unpaid'
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

        const response = await fetch(`${API_URL}/appointments/doctor`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
        throw new Error(data.message || "Failed to update appointment.");
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
        throw new Error("Only confirmed appointments can be started.");
      }

      if (appointment.consultation_mode !== "Online") {
        throw new Error("This is not an online consultation.");
      }

      if (!appointment.meeting_link) {
        throw new Error("The online consultation room is unavailable.");
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
        throw new Error(data.message || "Could not start consultation.");
      }

      await fetchAppointments(false);

      navigate(`/online-consultation/${appointment.id}`, {
        state: {
          appointment: {
            ...appointment,
            consultation_started_at: data.consultation_started_at,
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
        throw new Error(data.message || "Failed to send message.");
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
      `Cancel the appointment with patient ${appointment.patient_name || "Patient"}?`
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
        throw new Error(data.message || "Failed to cancel appointment.");
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
      "Remove this appointment from your workspace history? Patient clinical records will be safely retained."
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
        throw new Error(data.message || "Failed to remove appointment history.");
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
    if (!value) return "Not recorded";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  }

  // Filtered Appointments
  const filteredAppointments = appointments.filter((appointment) => {
    if (filter === "pending") return appointment.status === "Pending";
    if (filter === "confirmed") return appointment.status === "Confirmed";
    if (filter === "completed") return appointment.status === "Completed";
    if (filter === "paid") return appointment.payment_status === "Paid";
    if (filter === "unpaid") {
      return (
        appointment.status === "Confirmed" &&
        appointment.payment_status !== "Paid"
      );
    }
    return true;
  });

  return (
    <div className="doctor-appointments-page">
      <header className="appointments-header">
        <div>
          <h1>Appointment Requests & Consultations</h1>
          <p>Review incoming requests, manage clinical slots, and monitor payment settlements.</p>
        </div>

        <button
          type="button"
          className="back-dashboard-btn"
          onClick={() => navigate("/doctor-dashboard")}
        >
          ← Clinical Dashboard
        </button>
      </header>

      {/* FILTER BAR */}
      <div className="appointments-filter-bar">
        <button
          className={`filter-tab-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All Bookings <span className="filter-count">{appointments.length}</span>
        </button>

        <button
          className={`filter-tab-btn ${filter === "pending" ? "active" : ""}`}
          onClick={() => setFilter("pending")}
        >
          Pending Requests{" "}
          <span className="filter-count">
            {appointments.filter((a) => a.status === "Pending").length}
          </span>
        </button>

        <button
          className={`filter-tab-btn ${filter === "confirmed" ? "active" : ""}`}
          onClick={() => setFilter("confirmed")}
        >
          Confirmed{" "}
          <span className="filter-count">
            {appointments.filter((a) => a.status === "Confirmed").length}
          </span>
        </button>

        <button
          className={`filter-tab-btn ${filter === "unpaid" ? "active" : ""}`}
          onClick={() => setFilter("unpaid")}
        >
          Payment Pending{" "}
          <span className="filter-count">
            {
              appointments.filter(
                (a) => a.status === "Confirmed" && a.payment_status !== "Paid"
              ).length
            }
          </span>
        </button>

        <button
          className={`filter-tab-btn ${filter === "paid" ? "active" : ""}`}
          onClick={() => setFilter("paid")}
        >
          Fee Paid{" "}
          <span className="filter-count">
            {appointments.filter((a) => a.payment_status === "Paid").length}
          </span>
        </button>

        <button
          className={`filter-tab-btn ${filter === "completed" ? "active" : ""}`}
          onClick={() => setFilter("completed")}
        >
          Completed{" "}
          <span className="filter-count">
            {appointments.filter((a) => a.status === "Completed").length}
          </span>
        </button>
      </div>

      {error && (
        <div className="appointments-error" role="alert">
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <p className="appointments-status">Loading clinical appointments...</p>
      )}

      {!loading && filteredAppointments.length === 0 && !error && (
        <div className="empty-appointments">
          <div className="empty-icon">
            <CalendarIcon size={36} />
          </div>
          <h2>No matching appointments</h2>
          <p>There are no appointments under this filter.</p>
        </div>
      )}

      <section className="appointments-list">
        {filteredAppointments.map((appointment) => {
          const isPaid = appointment.payment_status === "Paid";
          const amount = appointment.payment_amount || 0;

          return (
            <article className="appointment-card" key={appointment.id}>
              <div className="appointment-card-header">
                <div className="patient-avatar">
                  {appointment.patient_name?.charAt(0).toUpperCase() || "P"}
                </div>

                <div className="patient-info">
                  <h2>{appointment.patient_name || "Patient"}</h2>
                  <p>{appointment.patient_email || "Patient email unavailable"}</p>
                </div>

                <div className="appointment-header-badges">
                  {/* PAYMENT BADGE */}
                  {isPaid ? (
                    <span className="doctor-payment-pill paid">
                      <CreditCardIcon size={14} /> Fee Paid · ₹{amount}
                    </span>
                  ) : appointment.status === "Confirmed" ? (
                    <span className="doctor-payment-pill unpaid">
                      <ClockIcon size={14} /> Fee Pending · ₹{amount || "Fee set"}
                    </span>
                  ) : null}

                  {/* STATUS BADGE */}
                  <span
                    className={`appointment-status ${appointment.status.toLowerCase()}`}
                  >
                    {appointment.status}
                  </span>
                </div>
              </div>

              <div className="appointment-details">
                <div>
                  <span>Scheduled Date</span>
                  <strong style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <CalendarIcon size={14} /> {appointment.appointment_date}
                  </strong>
                </div>

                <div>
                  <span>Scheduled Time</span>
                  <strong style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <ClockIcon size={14} /> {appointment.appointment_time}
                  </strong>
                </div>

                <div>
                  <span>Consultation Mode</span>
                  <strong
                    className={
                      appointment.consultation_mode === "Online"
                        ? "doctor-online-mode"
                        : "doctor-offline-mode"
                    }
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    {appointment.consultation_mode === "Online" ? (
                      <>
                        <VideoIcon size={14} /> Online Telehealth
                      </>
                    ) : (
                      <>
                        <HospitalIcon size={14} /> In-Person Hospital Visit
                      </>
                    )}
                  </strong>
                </div>
              </div>

              {appointment.consultation_started_at && (
                <div className="consultation-timestamp">
                  <strong>Actual Start:</strong>{" "}
                  {formatDateTime(appointment.consultation_started_at)}
                </div>
              )}

              {appointment.consultation_ended_at && (
                <div className="consultation-timestamp" style={{ marginLeft: "8px" }}>
                  <strong>Actual End:</strong>{" "}
                  {formatDateTime(appointment.consultation_ended_at)}
                </div>
              )}

              {/* ONLINE OR OFFLINE CALLOUT */}
              {appointment.consultation_mode === "Online" ? (
                <div className="doctor-online-box">
                  <div className="doctor-online-info">
                    <div className="doctor-online-icon">
                      <VideoIcon size={24} />
                    </div>
                    <div>
                      <strong>Online WebRTC Telehealth Session</strong>
                      <p>
                        {isPaid
                          ? "Patient has paid consultation fee. Video room is ready."
                          : "Awaiting patient fee settlement. You can start when ready."}
                      </p>
                    </div>
                  </div>

                  {appointment.status === "Confirmed" && (
                    <button
                      type="button"
                      className="start-consultation-btn"
                      disabled={updatingId === appointment.id}
                      onClick={() => startOnlineConsultation(appointment)}
                    >
                      <VideoIcon size={16} />
                      <span>
                        {updatingId === appointment.id
                          ? "Opening room..."
                          : "Start Video Consultation"}
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="doctor-offline-box">
                  <div className="doctor-offline-icon">
                    <HospitalIcon size={24} />
                  </div>
                  <div>
                    <strong>Hospital Visit Consultation</strong>
                    <p>The patient will arrive at your clinic at the scheduled time.</p>
                  </div>
                </div>
              )}

              <div className="symptoms-section">
                <h3>Reason for Visit / Patient Symptoms</h3>
                <p>{appointment.symptoms || "No preliminary symptoms submitted."}</p>
              </div>

              {/* APPOINTMENT ACTIONS */}
              <div className="appointment-actions">
                {appointment.status === "Pending" && (
                  <>
                    <button
                      type="button"
                      className="confirm-btn"
                      disabled={updatingId === appointment.id}
                      onClick={() => updateStatus(appointment.id, "Confirmed")}
                    >
                      <CheckCircleIcon size={16} />
                      <span>{updatingId === appointment.id ? "Updating..." : "Confirm Appointment"}</span>
                    </button>

                    <button
                      type="button"
                      className="reject-btn"
                      disabled={updatingId === appointment.id}
                      onClick={() => updateStatus(appointment.id, "Rejected")}
                    >
                      <XIcon size={16} />
                      <span>Decline</span>
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
                      <MailIcon size={16} />
                      <span>Message Patient</span>
                    </button>

                    <button
                      type="button"
                      className="complete-btn"
                      disabled={updatingId === appointment.id}
                      onClick={() => updateStatus(appointment.id, "Completed")}
                    >
                      <CheckCircleIcon size={16} />
                      <span>
                        {updatingId === appointment.id
                          ? "Completing..."
                          : "Complete Consultation"}
                      </span>
                    </button>
                  </>
                )}

                {appointment.status === "Completed" && (
                  <>
                    <button
                      type="button"
                      className="consultation-btn"
                      onClick={() => openChat(appointment)}
                    >
                      <MailIcon size={16} />
                      <span>View Chat Log</span>
                    </button>

                    <button
                      type="button"
                      className="complete-btn"
                      onClick={() => openConsultationForm(appointment)}
                    >
                      <FileTextIcon size={16} />
                      <span>Issue Prescription & Records</span>
                    </button>
                  </>
                )}

                {["Pending", "Confirmed"].includes(appointment.status) && (
                  <button
                    type="button"
                    className="reject-btn"
                    disabled={updatingId === appointment.id}
                    onClick={() => cancelAppointment(appointment)}
                  >
                    Cancel Booking
                  </button>
                )}

                <button
                  type="button"
                  className="doctor-history-delete-btn"
                  disabled={updatingId === appointment.id}
                  onClick={() => removeFromHistory(appointment)}
                >
                  Remove from History
                </button>
              </div>
            </article>
          );
        })}
      </section>

      {/* CHAT MODAL */}
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
                <h2>Chat with {chatAppointment.patient_name || "Patient"}</h2>
                <p>Appointment #{chatAppointment.id} · Encrypted clinical chat</p>
              </div>

              <button
                type="button"
                onClick={() => setChatAppointment(null)}
                aria-label="Close chat"
              >
                ✕
              </button>
            </header>

            {chatError && <p className="appointments-error">{chatError}</p>}

            <div className="appointment-chat-messages">
              {chatLoading && messages.length === 0 && <p>Loading messages...</p>}

              {!chatLoading && messages.length === 0 && (
                <p className="appointment-chat-empty">
                  No messages yet. Send a message to discuss consultation arrangements.
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
                      {message.sender_name || (ownMessage ? "You" : "Patient")}
                    </strong>
                    <p>{message.message}</p>
                    <small>{formatDateTime(message.created_at)}</small>
                  </div>
                );
              })}
            </div>

            <form className="appointment-chat-form" onSubmit={sendMessage}>
              <input
                type="text"
                value={chatMessage}
                onChange={(event) => setChatMessage(event.target.value)}
                placeholder="Type a clinical message..."
                maxLength={2000}
                aria-label="Chat message"
              />

              <button
                type="submit"
                disabled={!chatMessage.trim() || sendingMessage}
              >
                {sendingMessage ? "..." : "Send"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default DoctorAppointments;
