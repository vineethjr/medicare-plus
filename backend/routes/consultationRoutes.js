
const express = require("express");
const db = require("../database");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ========================================
// CREATE CONSULTATION RECORD
// POST /api/consultations
// ========================================
router.post("/", protect, (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctors can create consultation records.",
      });
    }

    const {
      appointment_id,
      diagnosis,
      prescription,
      doctor_notes,
      follow_up_date,
    } = req.body;

    if (!appointment_id) {
      return res.status(400).json({
        message: "Appointment ID is required.",
      });
    }

    const appointment = db
      .prepare(
        `SELECT id, patient_id, doctor_id, status
         FROM appointments
         WHERE id = ? AND doctor_id = ?`
      )
      .get(appointment_id, req.user.id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found.",
      });
    }

    if (!["Confirmed", "Completed"].includes(appointment.status)) {
      return res.status(400).json({
        message:
          "Consultation records can only be created for confirmed or completed appointments.",
      });
    }

    if (appointment.status === "Confirmed") {
      db.prepare(`
        UPDATE appointments
        SET status = 'Completed',
            consultation_ended_at = COALESCE(consultation_ended_at, datetime('now'))
        WHERE id = ?
      `).run(appointment.id);
    }

    const existingRecord = db
      .prepare(
        `SELECT id
         FROM consultation_records
         WHERE appointment_id = ?`
      )
      .get(appointment_id);

    if (existingRecord) {
      return res.status(409).json({
        message:
          "A consultation record already exists for this appointment.",
      });
    }

    // The prescription can be a JSON string containing medicines
    // or legacy plain text from older consultation records.
    const prescriptionText =
      typeof prescription === "string"
        ? prescription
        : prescription == null
          ? ""
          : JSON.stringify(prescription);

    const result = db
      .prepare(
        `INSERT INTO consultation_records (
          appointment_id,
          patient_id,
          doctor_id,
          diagnosis,
          prescription,
          doctor_notes,
          follow_up_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        appointment.id,
        appointment.patient_id,
        appointment.doctor_id,
        typeof diagnosis === "string" ? diagnosis.trim() : "",
        prescriptionText,
        typeof doctor_notes === "string" ? doctor_notes.trim() : "",
        typeof follow_up_date === "string" ? follow_up_date : ""
      );

    return res.status(201).json({
      message: "Consultation record created successfully.",
      consultationId: result.lastInsertRowid,
    });
  } catch (error) {
    console.error("Create consultation error:", error);

    return res.status(500).json({
      message: "Failed to create consultation record.",
    });
  }
});

// ========================================
// DOCTOR CONSULTATION RECORDS
// GET /api/consultations/doctor
// ========================================
router.get("/doctor", protect, (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctors can access these records.",
      });
    }

    const records = db
      .prepare(
        `SELECT
          cr.id,
          cr.appointment_id,
          cr.diagnosis,
          cr.prescription,
          cr.doctor_notes,
          cr.follow_up_date,
          cr.created_at,
          users.name AS patient_name,
          users.email AS patient_email,
          appointments.appointment_date,
          appointments.appointment_time
        FROM consultation_records AS cr
        JOIN users ON cr.patient_id = users.id
        JOIN appointments ON cr.appointment_id = appointments.id
        WHERE cr.doctor_id = ?
        ORDER BY cr.created_at DESC`
      )
      .all(req.user.id);

    return res.json(records);
  } catch (error) {
    console.error("Doctor consultation records error:", error);

    return res.status(500).json({
      message: "Failed to load consultation records.",
    });
  }
});

// ========================================
// PATIENT CONSULTATION RECORDS
// GET /api/consultations/patient
// ========================================
router.get("/patient", protect, (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        message: "Only patients can access these records.",
      });
    }

    const records = db
      .prepare(
        `SELECT
          cr.id,
          cr.appointment_id,
          cr.diagnosis,
          cr.prescription,
          cr.doctor_notes,
          cr.follow_up_date,
          cr.created_at,
          users.name AS doctor_name,
          users.specialization,
          users.hospital,
          appointments.appointment_date,
          appointments.appointment_time
        FROM consultation_records AS cr
        JOIN users ON cr.doctor_id = users.id
        JOIN appointments ON cr.appointment_id = appointments.id
        WHERE cr.patient_id = ?
        ORDER BY cr.created_at DESC`
      )
      .all(req.user.id);

    return res.json(records);
  } catch (error) {
    console.error("Patient consultation records error:", error);

    return res.status(500).json({
      message: "Failed to load medical records.",
    });
  }
});

module.exports = router;
