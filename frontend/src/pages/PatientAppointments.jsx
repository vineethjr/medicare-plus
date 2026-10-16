import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PatientAppointments.css";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  DoctorIcon,
  FileTextIcon,
  HospitalIcon,
  LockIcon,
  MailIcon,
  PrinterIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  VideoIcon,
  XIcon,
} from "../components/Icons";

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
  const [filter, setFilter] = useState("all"); // 'all', 'action_required', 'confirmed', 'pending', 'completed'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  // Chat modal state
  const [chatAppointment, setChatAppointment] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");

  // Payment checkout modal state
  const [payAppointment, setPayAppointment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("UPI"); // 'UPI', 'Card', 'NetBanking'
  const [upiId, setUpiId] = useState("");
  const [cardData, setCardData] = useState({
    cardNumber: "4532 8920 1204 9812",
    holderName: user.name || "Patient Name",
    expiry: "12/28",
    cvv: "345",
  });
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [receiptData, setReceiptData] = useState(null);
  const [selectedBank, setSelectedBank] = useState("HDFC");
  const [promoApplied, setPromoApplied] = useState(false);

  // Fetch appointments
  const fetchAppointments = useCallback(
    async (showLoading = false) => {
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

  // Chat messages polling
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
      await fetchMessages();
    } catch (err) {
      setChatError(err.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  // Open payment checkout
  function openPaymentModal(appointment) {
    setPayAppointment(appointment);
    setPaymentMethod("UPI");
    setPaymentError("");
    setReceiptData(null);
  }

  // Process payment
  async function handleProcessPayment(e) {
    e.preventDefault();
    if (!payAppointment || paying) return;

    try {
      setPaying(true);
      setPaymentError("");

      const response = await fetch(
        `${API_URL}/appointments/${payAppointment.id}/pay`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payment_method: paymentMethod,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Payment processing failed.");
      }

      setReceiptData(data.receipt || {
        transactionId: data.transaction_id,
        amount: data.payment_amount,
        paymentMethod: data.payment_method,
        paidAt: data.paid_at,
        doctorName: payAppointment.doctor_name,
        specialization: payAppointment.specialization,
        hospital: payAppointment.hospital,
        appointmentDate: payAppointment.appointment_date,
        appointmentTime: payAppointment.appointment_time,
        consultationMode: payAppointment.consultation_mode,
      });

      // Refresh appointments list to update status in place
      await fetchAppointments(false);
    } catch (err) {
      setPaymentError(err.message || "Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  function printReceipt(receipt) {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
      alert("Please allow pop-ups to print your payment receipt.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt - MediCare+</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { border-bottom: 2px solid #0d9488; padding-bottom: 15px; margin-bottom: 25px; }
            .header h1 { color: #0d9488; margin: 0; }
            .badge { background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 999px; font-weight: bold; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
            .total { font-size: 20px; font-weight: bold; color: #0d9488; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MediCare+</h1>
            <p>Official Consultation Payment Receipt</p>
          </div>
          <p><span class="badge">STATUS: PAID & CONFIRMED</span></p>
          <table class="table">
            <tr><td><strong>Transaction ID:</strong></td><td>${receipt.transactionId}</td></tr>
            <tr><td><strong>Doctor:</strong></td><td>Dr. ${receipt.doctorName} (${receipt.specialization || "Specialist"})</td></tr>
            <tr><td><strong>Hospital/Clinic:</strong></td><td>${receipt.hospital || "MediCare+ Clinical Center"}</td></tr>
            <tr><td><strong>Appointment Date & Time:</strong></td><td>${receipt.appointmentDate} at ${receipt.appointmentTime}</td></tr>
            <tr><td><strong>Consultation Mode:</strong></td><td>${receipt.consultationMode || "Offline"}</td></tr>
            <tr><td><strong>Payment Method:</strong></td><td>${receipt.paymentMethod}</td></tr>
            <tr><td><strong>Payment Timestamp:</strong></td><td>${new Date(receipt.paidAt).toLocaleString()}</td></tr>
            <tr><td><strong>Total Amount Paid:</strong></td><td class="total">₹${receipt.amount}</td></tr>
          </table>
          <p style="margin-top: 30px; font-size: 12px; color: #64748b;">
            This is an electronically generated receipt for your medical consultation booking. MediCare+ Telehealth Platform.
          </p>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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

    if (appointment.payment_status !== "Paid") {
      const proceed = window.confirm(
        `Consultation fee of ₹${appointment.consultation_fee || appointment.payment_amount || 500} has not been paid yet. Would you like to pay now to secure your slot?`
      );
      if (proceed) {
        openPaymentModal(appointment);
        return;
      }
    }

    navigate(`/online-consultation/${appointment.id}`);
  }

  function formatDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  }

  // Filtered Appointments
  const filteredAppointments = appointments.filter((appointment) => {
    if (filter === "action_required") {
      return (
        appointment.status === "Confirmed" &&
        appointment.payment_status !== "Paid"
      );
    }
    if (filter === "confirmed") return appointment.status === "Confirmed";
    if (filter === "pending") return appointment.status === "Pending";
    if (filter === "completed") return appointment.status === "Completed";
    return true;
  });

  const unpaidCount = appointments.filter(
    (a) => a.status === "Confirmed" && a.payment_status !== "Paid"
  ).length;

  return (
    <div className="patient-appointments-page">
      <header className="appointments-header">
        <div>
          <h1>My Appointments & Consultations</h1>
          <p>Track doctor confirmations, complete consultation fee payments, and join video calls.</p>
        </div>

        <button
          className="back-dashboard-button"
          onClick={() => navigate("/patient-dashboard")}
        >
          ← Dashboard
        </button>
      </header>

      {/* FILTER TABS */}
      <div className="appointments-filter-bar">
        <button
          className={`filter-tab-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All Bookings <span className="filter-count">{appointments.length}</span>
        </button>

        {unpaidCount > 0 && (
          <button
            className={`filter-tab-btn ${filter === "action_required" ? "active" : ""}`}
            onClick={() => setFilter("action_required")}
            style={{
              background: filter === "action_required" ? "#d97706" : "#fffbeb",
              color: filter === "action_required" ? "white" : "#b45309",
              borderColor: "#fde68a",
            }}
          >
            <CreditCardIcon size={14} /> Pay Fee Needed <span className="filter-count">{unpaidCount}</span>
          </button>
        )}

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
          className={`filter-tab-btn ${filter === "pending" ? "active" : ""}`}
          onClick={() => setFilter("pending")}
        >
          Pending Doctor Review{" "}
          <span className="filter-count">
            {appointments.filter((a) => a.status === "Pending").length}
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
          <AlertCircleIcon size={16} /> {error}
        </div>
      )}

      {loading && <p className="appointments-message">Loading appointments...</p>}

      {!loading && filteredAppointments.length === 0 && (
        <div className="empty-appointments">
          <div className="empty-icon">
            <CalendarIcon size={36} />
          </div>
          <h2>No matching appointments</h2>
          <p>Book a consultation with our verified doctors to get started.</p>
          <button onClick={() => navigate("/find-doctor")}>Find a Doctor</button>
        </div>
      )}

      <div className="patient-appointments-list">
        {filteredAppointments.map((appointment) => {
          const status = appointment.status || "Pending";
          const isBusy = busyId === appointment.id;
          const canCancel = ["Pending", "Confirmed"].includes(status);
          const canChat = ["Confirmed", "Completed"].includes(status);
          const isPaid = appointment.payment_status === "Paid";
          const fee =
            appointment.payment_amount > 0
              ? appointment.payment_amount
              : appointment.consultation_fee || 500;

          return (
            <article className="patient-appointment-card" key={appointment.id}>
              <div className="appointment-card-top">
                <div className="doctor-avatar">
                  {appointment.doctor_name?.charAt(0).toUpperCase() || "D"}
                </div>

                <div className="doctor-info">
                  <h2>Dr. {appointment.doctor_name || "Doctor"}</h2>
                  <p>{appointment.specialization || "General Physician"}</p>
                  <small style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <HospitalIcon size={13} /> {appointment.hospital || "MediCare+ Healthcare"}
                  </small>
                </div>

                <div className="card-top-badges">
                  {/* PAYMENT BADGE */}
                  {isPaid ? (
                    <span className="payment-badge paid">
                      <CheckCircleIcon size={12} /> Paid ₹{fee}
                    </span>
                  ) : status === "Confirmed" ? (
                    <span className="payment-badge unpaid">
                      <CreditCardIcon size={12} /> Fee Due: ₹{fee}
                    </span>
                  ) : null}

                  {/* STATUS BADGE */}
                  <span className={`appointment-status ${status.toLowerCase()}`}>
                    {status}
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
                  <strong style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
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

              {/* PAYMENT CALLOUT BANNER - REQUIRED WHEN CONFIRMED & UNPAID */}
              {status === "Confirmed" && !isPaid && (
                <div className="payment-required-box">
                  <div className="payment-required-info">
                    <div className="payment-required-icon">
                      <CreditCardIcon size={24} />
                    </div>
                    <div className="payment-required-text">
                      <strong>Appointment Confirmed by Dr. {appointment.doctor_name}!</strong>
                      <p>
                        Please pay the doctor's consultation fee of ₹{fee} to complete your
                        booking and unlock your consultation room.
                      </p>
                    </div>
                  </div>

                  <button
                    className="btn-pay-consultation"
                    onClick={() => openPaymentModal(appointment)}
                  >
                    <span>Pay Consultation Fee (₹{fee})</span>
                    <ArrowRightIcon size={16} />
                  </button>
                </div>
              )}

              {/* PAYMENT SETTLED BADGE */}
              {isPaid && (
                <div className="payment-settled-box">
                  <div className="payment-settled-info">
                    <span style={{ color: "#10b981", display: "inline-flex" }}>
                      <CheckCircleIcon size={20} />
                    </span>
                    <div>
                      <strong>Consultation Fee Settled: ₹{fee}</strong>
                      <span style={{ display: "block", fontSize: "12px", color: "var(--slate-500)" }}>
                        Paid via {appointment.payment_method || "UPI"} · Ref: {appointment.transaction_id || "TXN-VERIFIED"}
                      </span>
                    </div>
                  </div>

                  <button
                    className="btn-view-receipt"
                    onClick={() =>
                      printReceipt({
                        transactionId: appointment.transaction_id || "TXN-VERIFIED",
                        amount: fee,
                        paymentMethod: appointment.payment_method || "UPI",
                        paidAt: appointment.paid_at || new Date().toISOString(),
                        doctorName: appointment.doctor_name,
                        specialization: appointment.specialization,
                        hospital: appointment.hospital,
                        appointmentDate: appointment.appointment_date,
                        appointmentTime: appointment.appointment_time,
                        consultationMode: appointment.consultation_mode,
                      })
                    }
                  >
                    <PrinterIcon size={16} />
                    <span>View & Print Receipt</span>
                  </button>
                </div>
              )}

              {/* ONLINE VIDEO CALLOUT */}
              {appointment.consultation_mode === "Online" && status === "Confirmed" && (
                <div className="online-consultation-box">
                  <div>
                    <strong style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <VideoIcon size={16} /> Telehealth Video Consultation
                    </strong>
                    <p>
                      {isPaid
                        ? "Fee paid. You can join the video consultation room when your session begins."
                        : "Please pay the consultation fee above to unlock video access."}
                    </p>
                  </div>

                  <button
                    className="join-consultation-btn"
                    onClick={() => joinConsultation(appointment)}
                  >
                    <VideoIcon size={16} />
                    <span>Join Video Consultation</span>
                  </button>
                </div>
              )}

              {appointment.consultation_started_at && (
                <p className="consultation-timestamp">
                  <strong>Actual session start:</strong>{" "}
                  {formatDateTime(appointment.consultation_started_at)}
                </p>
              )}

              {appointment.symptoms && (
                <div className="appointment-symptoms">
                  <strong>Submitted Symptoms:</strong>
                  <p>{appointment.symptoms}</p>
                </div>
              )}

              {status === "Pending" && (
                <p className="waiting-consultation" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <ClockIcon size={15} /> Waiting for Dr. {appointment.doctor_name} to confirm the appointment. You will be prompted to pay once accepted.
                </p>
              )}

              {status === "Completed" && (
                <p className="completed-consultation" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircleIcon size={15} /> Consultation completed. View your diagnosis and prescriptions in Medical Records.
                </p>
              )}

              {status === "Cancelled" && (
                <p className="rejected-consultation" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <XIcon size={15} /> This appointment has been cancelled.
                </p>
              )}

              <div className="patient-appointment-actions">
                {canChat && (
                  <button
                    className="patient-chat-button"
                    onClick={() => openChat(appointment)}
                  >
                    <MailIcon size={16} />
                    <span>Message Doctor</span>
                  </button>
                )}

                {canCancel && (
                  <button
                    className="patient-cancel-button"
                    disabled={isBusy}
                    onClick={() => cancelAppointment(appointment)}
                  >
                    {isBusy ? "Processing..." : "Cancel Appointment"}
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

      {/* =========================================================
          CHECKOUT & PAYMENT MODAL
          ========================================================= */}
      {payAppointment && (
        <div
          className="checkout-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !paying) {
              setPayAppointment(null);
            }
          }}
        >
          <div className="checkout-modal">
            <header className="checkout-modal-header">
              <div>
                <h2>Secure Consultation Fee Payment</h2>
                <p>MediCare+ Encrypted Clinical Checkout</p>
              </div>
              <button
                type="button"
                className="close-checkout-btn"
                onClick={() => setPayAppointment(null)}
                disabled={paying}
              >
                ✕
              </button>
            </header>

            <div className="checkout-modal-body">
              {!receiptData ? (
                /* CHECKOUT FORM VIEW */
                <form onSubmit={handleProcessPayment}>
                  {/* INVOICE CARD */}
                  <div className="checkout-invoice-card">
                    <div className="invoice-doctor-row">
                      <div>
                        <strong>Dr. {payAppointment.doctor_name}</strong>
                        <span style={{ display: "block" }}>
                          {payAppointment.specialization || "Medical Specialist"}
                        </span>
                      </div>
                      <span className="visual-badge">Verified Doctor</span>
                    </div>

                    <div className="invoice-detail-grid">
                      <div>
                        <span>Date & Time</span>
                        <strong>{payAppointment.appointment_date} · {payAppointment.appointment_time}</strong>
                      </div>
                      <div>
                        <span>Mode</span>
                        <strong>{payAppointment.consultation_mode || "Offline"}</strong>
                      </div>
                    </div>

                    <div className="invoice-total-row">
                      <div>
                        <span>Consultation Fee</span>
                        <small style={{ display: "block", color: "var(--slate-400)" }}>Inclusive of digital prescription</small>
                      </div>
                      <strong>
                        ₹
                        {payAppointment.payment_amount > 0
                          ? payAppointment.payment_amount
                          : payAppointment.consultation_fee || 500}
                      </strong>
                    </div>
                  </div>

                  {/* PAYMENT METHOD SELECTOR */}
                  <div className="payment-methods-selector">
                    <label>Select Payment Method</label>
                    <div className="payment-tabs">
                      <button
                        type="button"
                        className={`payment-tab ${paymentMethod === "UPI" ? "active" : ""}`}
                        onClick={() => setPaymentMethod("UPI")}
                      >
                        <span className="payment-tab-icon">
                          <QrCodeIcon size={18} />
                        </span>
                        <strong>UPI / QR</strong>
                      </button>

                      <button
                        type="button"
                        className={`payment-tab ${paymentMethod === "Card" ? "active" : ""}`}
                        onClick={() => setPaymentMethod("Card")}
                      >
                        <span className="payment-tab-icon">
                          <CreditCardIcon size={18} />
                        </span>
                        <strong>Debit/Credit</strong>
                      </button>

                      <button
                        type="button"
                        className={`payment-tab ${paymentMethod === "NetBanking" ? "active" : ""}`}
                        onClick={() => setPaymentMethod("NetBanking")}
                      >
                        <span className="payment-tab-icon">
                          <HospitalIcon size={18} />
                        </span>
                        <strong>Net Banking</strong>
                      </button>
                    </div>
                  </div>

                  {/* METHOD DETAILS */}
                  {paymentMethod === "UPI" && (
                    <div className="upi-form-panel">
                      <div className="upi-qr-preview-box">
                        <div className="upi-qr-laser-line"></div>
                        <svg className="upi-qr-svg" viewBox="0 0 120 120">
                          {/* Outer frame & position detection patterns */}
                          <rect x="10" y="10" width="30" height="30" fill="none" stroke="#0f172a" strokeWidth="5" rx="4" />
                          <rect x="18" y="18" width="14" height="14" fill="#0d9488" rx="2" />
                          <rect x="80" y="10" width="30" height="30" fill="none" stroke="#0f172a" strokeWidth="5" rx="4" />
                          <rect x="88" y="18" width="14" height="14" fill="#0d9488" rx="2" />
                          <rect x="10" y="80" width="30" height="30" fill="none" stroke="#0f172a" strokeWidth="5" rx="4" />
                          <rect x="18" y="88" width="14" height="14" fill="#0d9488" rx="2" />
                          {/* Mock QR data pixels */}
                          <rect x="50" y="15" width="6" height="6" fill="#0f172a" />
                          <rect x="62" y="15" width="6" height="6" fill="#0f172a" />
                          <rect x="50" y="27" width="6" height="6" fill="#0f172a" />
                          <rect x="62" y="39" width="6" height="6" fill="#0f172a" />
                          <rect x="20" y="52" width="6" height="6" fill="#0f172a" />
                          <rect x="35" y="52" width="6" height="6" fill="#0f172a" />
                          <rect x="50" y="52" width="20" height="20" fill="#0d9488" rx="3" />
                          <rect x="80" y="52" width="6" height="6" fill="#0f172a" />
                          <rect x="95" y="52" width="6" height="6" fill="#0f172a" />
                          <rect x="50" y="80" width="6" height="6" fill="#0f172a" />
                          <rect x="62" y="80" width="6" height="6" fill="#0f172a" />
                          <rect x="50" y="95" width="6" height="6" fill="#0f172a" />
                          <rect x="80" y="80" width="12" height="6" fill="#0f172a" />
                          <rect x="98" y="92" width="12" height="12" fill="#0f172a" />
                        </svg>
                        <span className="qr-badge">Point Camera to Pay</span>
                      </div>

                      <div className="quick-upi-apps">
                        <span className="quick-apps-label">Instant UPI 1-Tap Apps:</span>
                        <div className="upi-app-buttons">
                          {[
                            { name: "Google Pay", handle: "patient@oksbi" },
                            { name: "PhonePe", handle: "patient@ybl" },
                            { name: "Paytm", handle: "patient@paytm" },
                            { name: "CRED", handle: "patient@cred" },
                          ].map((app) => (
                            <button
                              key={app.name}
                              type="button"
                              className={`upi-quick-btn ${upiId === app.handle ? "selected" : ""}`}
                              onClick={() => setUpiId(app.handle)}
                            >
                              <span>{app.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="upi-input-group">
                        <label>Or enter your Virtual Payment Address (VPA):</label>
                        <input
                          type="text"
                          placeholder="username@okhdfcbank or 9876543210@upi"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === "Card" && (
                    <div className="card-form-panel">
                      {/* REAL-TIME INTERACTIVE CARD VISUALIZATION */}
                      <div className="interactive-card-preview">
                        <div className="card-preview-top">
                          <div className="card-emv-chip"></div>
                          <span className="card-contactless-icon">))))</span>
                          <span className="card-network-name">VISA / Platinum</span>
                        </div>

                        <div className="card-preview-number">
                          {cardData.cardNumber || "•••• •••• •••• ••••"}
                        </div>

                        <div className="card-preview-bottom">
                          <div className="card-preview-holder">
                            <small>CARDHOLDER</small>
                            <strong>{(cardData.holderName || "PATIENT NAME").toUpperCase()}</strong>
                          </div>
                          <div className="card-preview-expiry">
                            <small>EXPIRES</small>
                            <strong>{cardData.expiry || "MM/YY"}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="card-field">
                        <label>Card Number</label>
                        <input
                          type="text"
                          value={cardData.cardNumber}
                          onChange={(e) =>
                            setCardData({ ...cardData, cardNumber: e.target.value })
                          }
                          placeholder="4532 0000 0000 0000"
                          maxLength={19}
                          required
                        />
                      </div>

                      <div className="card-field">
                        <label>Cardholder Name</label>
                        <input
                          type="text"
                          value={cardData.holderName}
                          onChange={(e) =>
                            setCardData({ ...cardData, holderName: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="card-input-row">
                        <div className="card-field">
                          <label>Expiry (MM/YY)</label>
                          <input
                            type="text"
                            value={cardData.expiry}
                            onChange={(e) =>
                              setCardData({ ...cardData, expiry: e.target.value })
                            }
                            maxLength={5}
                            required
                          />
                        </div>

                        <div className="card-field">
                          <label>CVV / CVC</label>
                          <input
                            type="password"
                            value={cardData.cvv}
                            onChange={(e) =>
                              setCardData({ ...cardData, cvv: e.target.value })
                            }
                            maxLength={4}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "NetBanking" && (
                    <div className="netbanking-form-panel">
                      <label className="netbanking-label">Select Your Banking Institution:</label>
                      <div className="bank-selection-grid">
                        {[
                          { id: "HDFC", name: "HDFC Bank", code: "HDFC" },
                          { id: "ICICI", name: "ICICI Bank", code: "ICICI" },
                          { id: "SBI", name: "State Bank of India", code: "SBI" },
                          { id: "AXIS", name: "Axis Bank", code: "AXIS" },
                          { id: "KOTAK", name: "Kotak Mahindra", code: "KOTAK" },
                          { id: "PNB", name: "Punjab National Bank", code: "PNB" },
                        ].map((bank) => (
                          <button
                            key={bank.id}
                            type="button"
                            className={`bank-card-option ${selectedBank === bank.id ? "active" : ""}`}
                            onClick={() => setSelectedBank(bank.id)}
                          >
                            <span className="bank-logo">
                              <HospitalIcon size={20} />
                            </span>
                            <strong>{bank.name}</strong>
                            {selectedBank === bank.id && (
                              <span className="bank-check">
                                <CheckCircleIcon size={14} />
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                      <p className="bank-security-notice" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <LockIcon size={14} /> Encrypted connection to {selectedBank} 3D-Secure 2.0 gateway.
                      </p>
                    </div>
                  )}

                  {/* PROMO / TELEHEALTH SUBSIDY TOGGLE */}
                  <div className="subsidy-toggle-box">
                    <label className="subsidy-label">
                      <input
                        type="checkbox"
                        checked={promoApplied}
                        onChange={(e) => setPromoApplied(e.target.checked)}
                      />
                      <span>Apply ₹50 MediCare+ Telehealth Assistance Grant</span>
                    </label>
                    {promoApplied && <span className="subsidy-badge">-₹50 Applied</span>}
                  </div>

                  {paymentError && (
                    <p className="appointments-error" style={{ marginTop: "16px" }}>
                      {paymentError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="btn-submit-payment"
                    disabled={paying}
                  >
                    {paying ? (
                      <span className="payment-loading-text">
                        <span className="btn-spinner"></span>
                        Bank 3D-Secure Authorizing...
                      </span>
                    ) : (
                      `Authorize & Pay ₹${Math.max(
                        0,
                        (payAppointment.payment_amount > 0
                          ? payAppointment.payment_amount
                          : payAppointment.consultation_fee || 500) - (promoApplied ? 50 : 0)
                      )} to Dr. ${payAppointment.doctor_name}`
                    )}
                  </button>
                </form>
              ) : (
                /* LUXURY DIGITAL RECEIPT VIEW */
                <div className="receipt-success-view">
                  <div className="receipt-celebration-badge">
                    <div className="celebration-check-icon">✓</div>
                  </div>
                  <h3>Consultation Fee Settled!</h3>
                  <p>Your appointment is locked in with Dr. {receiptData.doctorName}.</p>

                  <div className="luxury-receipt-card">
                    <div className="receipt-watermark-stamp">VERIFIED & PAID</div>

                    <div className="receipt-header-row">
                      <div>
                        <h4>MediCare+ Telehealth Platform</h4>
                        <small>Official Clinical Consultation Invoice</small>
                      </div>
                      <span className="receipt-paid-pill">✓ PAID IN FULL</span>
                    </div>

                    <div className="receipt-details-list">
                      <div className="receipt-row">
                        <span>Transaction Reference:</span>
                        <strong>{receiptData.transactionId}</strong>
                      </div>
                      <div className="receipt-row">
                        <span>Attending Specialist:</span>
                        <strong>Dr. {receiptData.doctorName} ({receiptData.specialization || "Doctor"})</strong>
                      </div>
                      <div className="receipt-row">
                        <span>Clinic / Hospital:</span>
                        <strong>{receiptData.hospital || "MediCare+ Clinical Center"}</strong>
                      </div>
                      <div className="receipt-row">
                        <span>Scheduled Date & Time:</span>
                        <strong>{receiptData.appointmentDate} · {receiptData.appointmentTime}</strong>
                      </div>
                      <div className="receipt-row">
                        <span>Consultation Mode:</span>
                        <strong>{receiptData.consultationMode || "Offline"}</strong>
                      </div>
                      <div className="receipt-row">
                        <span>Payment Method:</span>
                        <strong>{receiptData.paymentMethod} (Encrypted)</strong>
                      </div>
                      <div className="receipt-row">
                        <span>Settlement Timestamp:</span>
                        <strong>{new Date(receiptData.paidAt).toLocaleString()}</strong>
                      </div>
                    </div>

                    <div className="receipt-total-bar">
                      <span>Total Amount Settled:</span>
                      <strong>₹{receiptData.amount}</strong>
                    </div>

                    {/* BARCODE GRAPHIC */}
                    <div className="receipt-barcode-box">
                      <div className="barcode-lines">
                        <span style={{ width: "3px" }}></span>
                        <span style={{ width: "1px" }}></span>
                        <span style={{ width: "4px" }}></span>
                        <span style={{ width: "2px" }}></span>
                        <span style={{ width: "1px" }}></span>
                        <span style={{ width: "3px" }}></span>
                        <span style={{ width: "2px" }}></span>
                        <span style={{ width: "4px" }}></span>
                        <span style={{ width: "1px" }}></span>
                        <span style={{ width: "3px" }}></span>
                        <span style={{ width: "2px" }}></span>
                        <span style={{ width: "1px" }}></span>
                        <span style={{ width: "4px" }}></span>
                        <span style={{ width: "2px" }}></span>
                        <span style={{ width: "3px" }}></span>
                        <span style={{ width: "1px" }}></span>
                        <span style={{ width: "2px" }}></span>
                        <span style={{ width: "4px" }}></span>
                      </div>
                      <small className="barcode-code">{receiptData.transactionId}</small>
                    </div>
                  </div>

                  <div className="receipt-actions">
                    <button
                      type="button"
                      className="btn-print-receipt"
                      onClick={() => printReceipt(receiptData)}
                    >
                      <PrinterIcon size={16} />
                      <span>Print / Download PDF</span>
                    </button>
                    {receiptData.consultationMode === "Online" && (
                      <button
                        type="button"
                        className="btn-join-telehealth-now"
                        onClick={() => {
                          setPayAppointment(null);
                          navigate(`/consultation/${payAppointment.id}`);
                        }}
                      >
                        <VideoIcon size={16} />
                        <span>Enter Video Consultation Room</span>
                        <ArrowRightIcon size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-close-receipt"
                      onClick={() => setPayAppointment(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
            aria-label="Chat with doctor"
          >
            <header className="appointment-chat-header">
              <div>
                <h2>Chat with Dr. {chatAppointment.doctor_name}</h2>
                <p>Appointment #{chatAppointment.id} · Secured Medical Chat</p>
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
                      {ownMessage ? "You" : message.sender_name || "Doctor"}
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
                {sending ? "..." : "Send"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default PatientAppointments;
