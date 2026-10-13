
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

    const mode =
      consultation_mode === "Online" ? "Online" : "Offline";

    const doctor = db.prepare(`
      SELECT id
      FROM users
      WHERE id = ? AND role = 'doctor'
    `).get(doctor_id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found.",
      });
    }

    const result = db.prepare(`
      INSERT INTO appointments (
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        symptoms,
        status,
        consultation_mode
      )
      VALUES (?, ?, ?, ?, ?, 'Pending', ?)
    `).run(
      req.user.id,
      doctor_id,
      appointment_date,
      appointment_time,
      symptoms || "",
      mode
    );

    const appointmentId = result.lastInsertRowid;

    let meetingLink = null;

    if (mode === "Online") {
      meetingLink =
        `http://localhost:5173/online-consultation/${appointmentId}`;

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
        u.name AS doctor_name,
        u.specialization,
        u.hospital,
        u.consultation_fee
      FROM appointments a
      JOIN users u ON a.doctor_id = u.id
      WHERE a.patient_id = ?
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
        a.appointment_date,
        a.appointment_time,
        a.symptoms,
        a.status,
        a.consultation_mode,
        a.meeting_link,
        a.consultation_started_at,
        a.consultation_ended_at,
        a.created_at,
        u.name AS patient_name,
        u.email AS patient_email
      FROM appointments a
      JOIN users u ON a.patient_id = u.id
      WHERE a.doctor_id = ?
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
    `).get(req.user.id, today).count;

    const totalPatients = db.prepare(`
      SELECT COUNT(DISTINCT patient_id) AS count
      FROM appointments
      WHERE doctor_id = ?
    `).get(req.user.id).count;

    const pendingRequests = db.prepare(`
      SELECT COUNT(*) AS count
      FROM appointments
      WHERE doctor_id = ?
        AND status = 'Pending'
    `).get(req.user.id).count;

    res.json({
      todayAppointments,
      totalPatients,
      pendingRequests,
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
    `).get(req.user.id).count;

    const confirmedAppointments = db.prepare(`
      SELECT COUNT(*) AS count
      FROM appointments
      WHERE patient_id = ? AND status = 'Confirmed'
    `).get(req.user.id).count;

    const pendingAppointments = db.prepare(`
      SELECT COUNT(*) AS count
      FROM appointments
      WHERE patient_id = ? AND status = 'Pending'
    `).get(req.user.id).count;

    res.json({
      totalAppointments,
      confirmedAppointments,
      pendingAppointments,
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

module.exports = router;
