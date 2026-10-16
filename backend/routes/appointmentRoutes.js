
const express = require("express");
const db = require("../database");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ========================================
// PATIENT BOOKS APPOINTMENT
// POST /api/appointments
// ========================================

router.post("/", protect, (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        message: "Only patients can book appointments.",
      });
    }

    const {
      doctor_id,
      appointment_date,
      appointment_time,
      symptoms,
      consultation_mode,
    } = req.body;

    if (!doctor_id || !appointment_date || !appointment_time) {
      return res.status(400).json({
        message: "Doctor, appointment date and time are required.",
      });
    }

    // STRICT CHECK: Verify patient has completed medical profile
    const patientProfile = db.prepare(`
      SELECT age, gender, blood_group, emergency_contact_phone
      FROM users
      WHERE id = ? AND role = 'patient'
    `).get(req.user.id);

    if (
      !patientProfile ||
      !patientProfile.age ||
      !patientProfile.gender ||
      !patientProfile.blood_group ||
      !patientProfile.emergency_contact_phone
    ) {
      return res.status(403).json({
        message:
          "Incomplete patient profile. Clinical safety protocol requires you to complete your medical profile (age, gender, blood group, emergency contact) before booking an appointment with any doctor.",
        profileIncomplete: true,
      });
    }

    const mode =
      consultation_mode === "Online" ? "Online" : "Offline";

    const doctor = db.prepare(`
      SELECT id, consultation_fee
      FROM users
      WHERE id = ? AND role = 'doctor'
    `).get(doctor_id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found.",
      });
    }

    const fee = Number(doctor.consultation_fee) || 0;

    const result = db.prepare(`
      INSERT INTO appointments (
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        symptoms,
        status,
        consultation_mode,
        payment_status,
        payment_amount
      )
      VALUES (?, ?, ?, ?, ?, 'Pending', ?, 'Unpaid', ?)
    `).run(
      req.user.id,
      doctor_id,
      appointment_date,
      appointment_time,
      symptoms || "",
      mode,
      fee
    );

    const appointmentId = result.lastInsertRowid;

    let meetingLink = null;

    if (mode === "Online") {
      const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
      meetingLink = `${clientUrl}/online-consultation/${appointmentId}`;

      db.prepare(`
        UPDATE appointments
        SET meeting_link = ?
        WHERE id = ?
      `).run(meetingLink, appointmentId);
    }

    res.status(201).json({
      message: "Appointment request submitted successfully.",
      appointmentId,
      consultationMode: mode,
      meetingLink,
      consultationFee: fee,
      paymentStatus: "Unpaid",
    });
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({
      message: "Failed to book appointment.",
    });
  }
});

// ========================================
// PATIENT APPOINTMENTS
// GET /api/appointments/patient
// ========================================

router.get("/patient", protect, (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        message: "Only patients can access this.",
      });
    }

    const appointments = db.prepare(`
      SELECT
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.symptoms,
        a.status,
        a.consultation_mode,
        a.meeting_link,
        a.consultation_started_at,
        a.consultation_ended_at,
        a.created_at,
        a.payment_status,
        a.payment_amount,
        a.payment_method,
        a.paid_at,
        a.transaction_id,
        u.name AS doctor_name,
        u.specialization,
        u.hospital,
        u.consultation_fee
      FROM appointments a
      JOIN users u ON a.doctor_id = u.id
      WHERE a.patient_id = ?
        AND COALESCE(a.patient_hidden, 0) = 0
      ORDER BY
        a.appointment_date DESC,
        a.appointment_time DESC
    `).all(req.user.id);

    res.json(appointments);
  } catch (error) {
    console.error("Patient appointments error:", error);
    res.status(500).json({
      message: "Failed to load appointments.",
    });
  }
});

// ========================================
// DOCTOR APPOINTMENTS
// GET /api/appointments/doctor
// ========================================

router.get("/doctor", protect, (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctors can access this.",
      });
    }

    const appointments = db.prepare(`
      SELECT
        a.id,
        a.patient_id,
        a.appointment_date,
        a.appointment_time,
        a.symptoms,
        a.status,
        a.consultation_mode,
        a.meeting_link,
        a.consultation_started_at,
        a.consultation_ended_at,
        a.created_at,
        a.payment_status,
        a.payment_amount,
        a.payment_method,
        a.paid_at,
        a.transaction_id,
        u.name AS patient_name,
        u.email AS patient_email,
        u.age AS patient_age,
        u.gender AS patient_gender,
        u.blood_group AS patient_blood_group,
        u.height AS patient_height,
        u.weight AS patient_weight,
        u.allergies AS patient_allergies,
        u.chronic_conditions AS patient_chronic_conditions,
        u.current_medications AS patient_current_medications,
        u.past_surgeries AS patient_past_surgeries,
        u.emergency_contact_name AS patient_emergency_contact_name,
        u.emergency_contact_phone AS patient_emergency_contact_phone,
        u.emergency_contact_relation AS patient_emergency_contact_relation
      FROM appointments a
      JOIN users u ON a.patient_id = u.id
      WHERE a.doctor_id = ?
        AND COALESCE(a.doctor_hidden, 0) = 0
      ORDER BY
        a.appointment_date ASC,
        a.appointment_time ASC
    `).all(req.user.id);

    res.json(appointments);
  } catch (error) {
    console.error("Doctor appointments error:", error);
    res.status(500).json({
      message: "Failed to load appointments.",
    });
  }
});

// ========================================
// START ONLINE CONSULTATION
// POST /api/appointments/:id/start
// ========================================

router.post("/:id/start", protect, (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctors can start consultations.",
      });
    }

    const appointment = db.prepare(`
      SELECT
        id,
        status,
        consultation_mode,
        consultation_started_at,
        doctor_id
      FROM appointments
      WHERE id = ? AND doctor_id = ?
    `).get(req.params.id, req.user.id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found.",
      });
    }

    if (appointment.consultation_mode !== "Online") {
      return res.status(400).json({
        message: "This is not an online consultation.",
      });
    }

    if (appointment.status !== "Confirmed") {
      return res.status(400).json({
        message: "Only confirmed appointments can be started.",
      });
    }

    if (appointment.consultation_started_at) {
      return res.json({
        message: "Consultation has already been started.",
        consultation_started_at:
          appointment.consultation_started_at,
      });
    }

    const startedAt = new Date().toISOString();

    db.prepare(`
      UPDATE appointments
      SET consultation_started_at = ?
      WHERE id = ?
        AND doctor_id = ?
        AND consultation_started_at IS NULL
    `).run(startedAt, appointment.id, req.user.id);

    const updated = db.prepare(`
      SELECT consultation_started_at
      FROM appointments
      WHERE id = ?
    `).get(appointment.id);

    res.json({
      message: "Consultation started successfully.",
      consultation_started_at: updated.consultation_started_at,
    });
  } catch (error) {
    console.error("Start consultation error:", error);
    res.status(500).json({
      message: "Failed to start consultation.",
    });
  }
});

// ========================================
// GET APPOINTMENT CHAT
// GET /api/appointments/:id/messages
// ========================================

router.get("/:id/messages", protect, (req, res) => {
  try {
    const appointment = db.prepare(`
      SELECT id, patient_id, doctor_id, status
      FROM appointments
      WHERE id = ?
    `).get(req.params.id);

    if (
      !appointment ||
      (
        req.user.id !== appointment.patient_id &&
        req.user.id !== appointment.doctor_id
      )
    ) {
      return res.status(404).json({
        message: "Appointment not found.",
      });
    }

    if (!["Confirmed", "Completed"].includes(appointment.status)) {
      return res.status(403).json({
        message: "Chat is available after appointment confirmation.",
      });
    }

    const parsedAfterId = Number.parseInt(
      req.query.afterId || "0",
      10
    );

    const afterId =
      Number.isFinite(parsedAfterId) && parsedAfterId > 0
        ? parsedAfterId
        : 0;

    const messages = db.prepare(`
      SELECT
        m.id,
        m.appointment_id,
        m.sender_id,
        m.message,
        m.created_at,
        u.name AS sender_name,
        u.role AS sender_role
      FROM appointment_messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.appointment_id = ?
        AND m.id > ?
      ORDER BY m.id ASC
      LIMIT 200
    `).all(appointment.id, afterId);

    res.json(messages);
  } catch (error) {
    console.error("Fetch appointment messages error:", error);
    res.status(500).json({
      message: "Failed to load messages.",
    });
  }
});

// ========================================
// SEND APPOINTMENT CHAT MESSAGE
// POST /api/appointments/:id/messages
// ========================================

router.post("/:id/messages", protect, (req, res) => {
  try {
    const message = String(req.body.message || "").trim();

    if (!message || message.length > 2000) {
      return res.status(400).json({
        message: "Message must contain 1–2000 characters.",
      });
    }

    const appointment = db.prepare(`
      SELECT id, patient_id, doctor_id, status
      FROM appointments
      WHERE id = ?
    `).get(req.params.id);

    if (
      !appointment ||
      (
        req.user.id !== appointment.patient_id &&
        req.user.id !== appointment.doctor_id
      )
    ) {
      return res.status(404).json({
        message: "Appointment not found.",
      });
    }

    if (!["Confirmed", "Completed"].includes(appointment.status)) {
      return res.status(403).json({
        message: "Chat is available after appointment confirmation.",
      });
    }

    const result = db.prepare(`
      INSERT INTO appointment_messages (
        appointment_id,
        sender_id,
        message
      )
      VALUES (?, ?, ?)
    `).run(appointment.id, req.user.id, message);

    const savedMessage = db.prepare(`
      SELECT
        m.id,
        m.appointment_id,
        m.sender_id,
        m.message,
        m.created_at,
        u.name AS sender_name,
        u.role AS sender_role
      FROM appointment_messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error("Send appointment message error:", error);
    res.status(500).json({
      message: "Failed to send message.",
    });
  }
});

// ========================================
// DOCTOR STATISTICS
// GET /api/appointments/doctor/stats
// ========================================

router.get("/doctor/stats", protect, (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctors can access statistics.",
      });
    }

    const today = new Date().toLocaleDateString("en-CA");

    const todayAppointments = db.prepare(`
      SELECT COUNT(*) AS count
      FROM appointments
      WHERE doctor_id = ?
        AND appointment_date = ?
        AND status != 'Cancelled'
        AND COALESCE(doctor_hidden, 0) = 0
    `).get(req.user.id, today).count;

    const totalPatients = db.prepare(`
      SELECT COUNT(DISTINCT patient_id) AS count
      FROM appointments
      WHERE doctor_id = ?
        AND COALESCE(doctor_hidden, 0) = 0
    `).get(req.user.id).count;

    const pendingRequests = db.prepare(`
      SELECT COUNT(*) AS count
      FROM appointments
      WHERE doctor_id = ?
        AND status = 'Pending'
        AND COALESCE(doctor_hidden, 0) = 0
    `).get(req.user.id).count;

    const earningsRow = db.prepare(`
      SELECT COALESCE(SUM(payment_amount), 0) AS total
      FROM appointments
      WHERE doctor_id = ?
        AND payment_status = 'Paid'
        AND status != 'Cancelled'
    `).get(req.user.id);

    const paidAppointments = db.prepare(`
      SELECT COUNT(*) AS count
      FROM appointments
      WHERE doctor_id = ?
        AND payment_status = 'Paid'
    `).get(req.user.id).count;

    res.json({
      todayAppointments,
      totalPatients,
      pendingRequests,
      totalEarnings: earningsRow ? earningsRow.total : 0,
      paidAppointments,
    });
  } catch (error) {
    console.error("Doctor statistics error:", error);
    res.status(500).json({
      message: "Failed to load doctor statistics.",
    });
  }
});

// ========================================
// PATIENT STATISTICS
// GET /api/appointments/patient/stats
// ========================================

router.get("/patient/stats", protect, (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        message: "Only patients can access statistics.",
      });
    }

    const totalAppointments = db.prepare(`
      SELECT COUNT(*) AS count
      FROM appointments
      WHERE patient_id = ?
        AND COALESCE(patient_hidden, 0) = 0
    `).get(req.user.id).count;

    const confirmedAppointments = db.prepare(`
      SELECT COUNT(*) AS count
      FROM appointments
      WHERE patient_id = ?
        AND status = 'Confirmed'
        AND COALESCE(patient_hidden, 0) = 0
    `).get(req.user.id).count;

    const pendingAppointments = db.prepare(`
      SELECT COUNT(*) AS count
      FROM appointments
      WHERE patient_id = ?
        AND status = 'Pending'
        AND COALESCE(patient_hidden, 0) = 0
    `).get(req.user.id).count;

    const unpaidAppointments = db.prepare(`
      SELECT COUNT(*) AS count
      FROM appointments
      WHERE patient_id = ?
        AND status = 'Confirmed'
        AND (payment_status = 'Unpaid' OR payment_status IS NULL)
        AND COALESCE(patient_hidden, 0) = 0
    `).get(req.user.id).count;

    const paidAppointments = db.prepare(`
      SELECT COUNT(*) AS count
      FROM appointments
      WHERE patient_id = ?
        AND payment_status = 'Paid'
        AND COALESCE(patient_hidden, 0) = 0
    `).get(req.user.id).count;

    res.json({
      totalAppointments,
      confirmedAppointments,
      pendingAppointments,
      unpaidAppointments,
      paidAppointments,
    });
  } catch (error) {
    console.error("Patient statistics error:", error);
    res.status(500).json({
      message: "Failed to load patient statistics.",
    });
  }
});

// ========================================
// UPDATE APPOINTMENT STATUS
// PUT /api/appointments/:id/status
// ========================================

router.put("/:id/status", protect, (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctors can update appointment status.",
      });
    }

    const { status } = req.body;
    const appointmentId = req.params.id;

    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Rejected",
      "Completed",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid appointment status.",
      });
    }

    const appointment = db.prepare(`
      SELECT id, status
      FROM appointments
      WHERE id = ? AND doctor_id = ?
    `).get(appointmentId, req.user.id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found.",
      });
    }

    // Record the end time once, when marked completed.
    if (status === "Completed") {
      db.prepare(`
        UPDATE appointments
        SET status = ?,
            consultation_ended_at = COALESCE(
              consultation_ended_at,
              ?
            )
        WHERE id = ? AND doctor_id = ?
      `).run(
        status,
        new Date().toISOString(),
        appointmentId,
        req.user.id
      );
    } else {
      db.prepare(`
        UPDATE appointments
        SET status = ?
        WHERE id = ? AND doctor_id = ?
      `).run(status, appointmentId, req.user.id);
    }

    res.json({
      message: `Appointment ${status.toLowerCase()} successfully.`,
    });
  } catch (error) {
    console.error("Update appointment error:", error);
    res.status(500).json({
      message: "Failed to update appointment.",
    });
  }
});

// ========================================
// PATIENT PAYS CONSULTATION FEE
// POST /api/appointments/:id/pay
// ========================================

router.post("/:id/pay", protect, (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        message: "Only patients can process consultation payments.",
      });
    }

    const appointmentId = req.params.id;
    const { payment_method } = req.body;

    const appointment = db.prepare(`
      SELECT
        a.id,
        a.patient_id,
        a.doctor_id,
        a.status,
        a.payment_status,
        a.payment_amount,
        a.appointment_date,
        a.appointment_time,
        a.consultation_mode,
        u.name AS doctor_name,
        u.specialization,
        u.hospital,
        u.consultation_fee
      FROM appointments a
      JOIN users u ON a.doctor_id = u.id
      WHERE a.id = ? AND a.patient_id = ?
    `).get(appointmentId, req.user.id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found.",
      });
    }

    if (appointment.status !== "Confirmed") {
      return res.status(400).json({
        message: "Payment can only be made after the doctor confirms the appointment.",
      });
    }

    if (appointment.payment_status === "Paid") {
      return res.status(400).json({
        message: "This consultation has already been paid.",
      });
    }

    const amount = Number(appointment.payment_amount) > 0
      ? Number(appointment.payment_amount)
      : Number(appointment.consultation_fee) || 500;

    const method = payment_method || "UPI";
    const paidAt = new Date().toISOString();
    const txnId =
      "TXN-" +
      Date.now().toString(36).toUpperCase() +
      "-" +
      Math.random().toString(36).substring(2, 7).toUpperCase();

    db.prepare(`
      UPDATE appointments
      SET payment_status = 'Paid',
          payment_amount = ?,
          payment_method = ?,
          paid_at = ?,
          transaction_id = ?
      WHERE id = ? AND patient_id = ?
    `).run(amount, method, paidAt, txnId, appointmentId, req.user.id);

    // Automatically record an in-chat confirmation note so both parties see the proof of payment
    try {
      db.prepare(`
        INSERT INTO appointment_messages (appointment_id, sender_id, message)
        VALUES (?, ?, ?)
      `).run(
        appointmentId,
        req.user.id,
        `💳 Consultation fee of ₹${amount} paid successfully via ${method}. Transaction Ref: ${txnId}`
      );
    } catch (msgErr) {
      console.warn("Could not insert payment chat notification:", msgErr.message);
    }

    res.json({
      message: "Payment completed successfully.",
      appointmentId,
      payment_status: "Paid",
      payment_amount: amount,
      payment_method: method,
      paid_at: paidAt,
      transaction_id: txnId,
      receipt: {
        transactionId: txnId,
        amount,
        paymentMethod: method,
        paidAt,
        doctorName: appointment.doctor_name,
        specialization: appointment.specialization,
        hospital: appointment.hospital,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time,
        consultationMode: appointment.consultation_mode,
      },
    });
  } catch (error) {
    console.error("Process payment error:", error);
    res.status(500).json({
      message: "Payment processing failed.",
    });
  }
});

// ========================================
// CANCEL APPOINTMENT
// POST /api/appointments/:id/cancel
// ========================================

router.post("/:id/cancel", protect, (req, res) => {
  try {
    const appointmentId = req.params.id;

    const appointment = db.prepare(`
      SELECT id, patient_id, doctor_id, status
      FROM appointments
      WHERE id = ? AND (patient_id = ? OR doctor_id = ?)
    `).get(appointmentId, req.user.id, req.user.id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found.",
      });
    }

    if (!["Pending", "Confirmed"].includes(appointment.status)) {
      return res.status(400).json({
        message: "Only pending or confirmed appointments can be cancelled.",
      });
    }

    db.prepare(`
      UPDATE appointments
      SET status = 'Cancelled'
      WHERE id = ?
    `).run(appointmentId);

    res.json({
      message: "Appointment cancelled successfully.",
    });
  } catch (error) {
    console.error("Cancel appointment error:", error);
    res.status(500).json({
      message: "Failed to cancel appointment.",
    });
  }
});

// ========================================
// REMOVE FROM HISTORY
// DELETE /api/appointments/:id/history
// ========================================

router.delete("/:id/history", protect, (req, res) => {
  try {
    const appointmentId = req.params.id;

    const appointment = db.prepare(`
      SELECT id, patient_id, doctor_id
      FROM appointments
      WHERE id = ? AND (patient_id = ? OR doctor_id = ?)
    `).get(appointmentId, req.user.id, req.user.id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found.",
      });
    }

    if (req.user.role === "patient") {
      db.prepare(`
        UPDATE appointments
        SET patient_hidden = 1
        WHERE id = ?
      `).run(appointmentId);
    } else if (req.user.role === "doctor") {
      db.prepare(`
        UPDATE appointments
        SET doctor_hidden = 1
        WHERE id = ?
      `).run(appointmentId);
    }

    res.json({
      message: "Appointment removed from your history.",
    });
  } catch (error) {
    console.error("Remove history error:", error);
    res.status(500).json({
      message: "Failed to remove appointment from history.",
    });
  }
});

module.exports = router;

