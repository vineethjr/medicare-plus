const express = require("express");
const db = require("../database");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

/*
========================================
CREATE CONSULTATION RECORD
POST /api/consultations
========================================
*/
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

    // Find the appointment belonging to this doctor
    const appointment = db
      .prepare(
        `SELECT
          id,
          patient_id,
          doctor_id,
          status
        FROM appointments
        WHERE id = ?
        AND doctor_id = ?`
      )
      .get(appointment_id, req.user.id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found.",
      });
    }

    // Consultation should normally be created after completion
    if (
      appointment.status !== "Completed"
    ) {
      return res.status(400).json({
        message:
          "Consultation record can only be created for a completed appointment.",
      });
    }

    // Check whether a record already exists
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

    const result = db
      .prepare(
        `INSERT INTO consultation_records
        (
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
        diagnosis || "",
        prescription || "",
        doctor_notes || "",
        follow_up_date || ""
      );

    res.status(201).json({
      message:
        "Consultation record created successfully.",
      consultationId: result.lastInsertRowid,
    });
  } catch (error) {
    console.error(
      "Create consultation error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to create consultation record.",
    });
  }
});

/*
========================================
DOCTOR CONSULTATION RECORDS
GET /api/consultations/doctor
========================================
*/
router.get("/doctor", protect, (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message:
          "Only doctors can access these records.",
      });
    }

    const records = db
      .prepare(
        `SELECT
          consultation_records.id,
          consultation_records.appointment_id,
          consultation_records.diagnosis,
          consultation_records.prescription,
          consultation_records.doctor_notes,
          consultation_records.follow_up_date,
          consultation_records.created_at,

          users.name AS patient_name,
          users.email AS patient_email,

          appointments.appointment_date,
          appointments.appointment_time

        FROM consultation_records

        JOIN users
          ON consultation_records.patient_id = users.id

        JOIN appointments
          ON consultation_records.appointment_id =
             appointments.id

        WHERE consultation_records.doctor_id = ?

        ORDER BY consultation_records.created_at DESC`
      )
      .all(req.user.id);

    res.json(records);
  } catch (error) {
    console.error(
      "Doctor consultation records error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to load consultation records.",
    });
  }
});

/*
========================================
PATIENT CONSULTATION RECORDS
GET /api/consultations/patient
========================================
*/
router.get("/patient", protect, (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        message:
          "Only patients can access these records.",
      });
    }

    const records = db
      .prepare(
        `SELECT
          consultation_records.id,
          consultation_records.appointment_id,
          consultation_records.diagnosis,
          consultation_records.prescription,
          consultation_records.doctor_notes,
          consultation_records.follow_up_date,
          consultation_records.created_at,

          users.name AS doctor_name,
          users.specialization,
          users.hospital,

          appointments.appointment_date,
          appointments.appointment_time

        FROM consultation_records

        JOIN users
          ON consultation_records.doctor_id = users.id

        JOIN appointments
          ON consultation_records.appointment_id =
             appointments.id

        WHERE consultation_records.patient_id = ?

        ORDER BY consultation_records.created_at DESC`
      )
      .all(req.user.id);

    res.json(records);
  } catch (error) {
    console.error(
      "Patient consultation records error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to load consultation records.",
    });
  }
});

// ========================================
// GET DOCTOR CONSULTATION RECORDS
// GET /api/consultations/doctor
// ========================================

router.get("/doctor", protect, (req, res) => {
  try {
    // Only doctors can access these records
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctors can access these records.",
      });
    }

    const records = db
      .prepare(
        `SELECT
          consultation_records.id,
          consultation_records.appointment_id,
          consultation_records.diagnosis,
          consultation_records.prescription,
          consultation_records.doctor_notes,
          consultation_records.follow_up_date,
          consultation_records.created_at,

          users.name AS patient_name,
          users.email AS patient_email,

          appointments.appointment_date,
          appointments.appointment_time

        FROM consultation_records

        JOIN users
          ON consultation_records.patient_id = users.id

        JOIN appointments
          ON consultation_records.appointment_id =
             appointments.id

        WHERE consultation_records.doctor_id = ?

        ORDER BY consultation_records.created_at DESC`
      )
      .all(req.user.id);

    res.json(records);
  } catch (error) {
    console.error(
      "Doctor consultation records error:",
      error
    );

    res.status(500).json({
      message: "Failed to load consultation records.",
    });
  }
});

// ========================================
// GET PATIENT CONSULTATION RECORDS
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
          consultation_records.id,
          consultation_records.appointment_id,
          consultation_records.diagnosis,
          consultation_records.prescription,
          consultation_records.doctor_notes,
          consultation_records.follow_up_date,
          consultation_records.created_at,

          users.name AS doctor_name,
          users.specialization,
          users.hospital,

          appointments.appointment_date,
          appointments.appointment_time

        FROM consultation_records

        JOIN users
          ON consultation_records.doctor_id = users.id

        JOIN appointments
          ON consultation_records.appointment_id =
             appointments.id

        WHERE consultation_records.patient_id = ?

        ORDER BY consultation_records.created_at DESC`
      )
      .all(req.user.id);

    res.json(records);
  } catch (error) {
    console.error(
      "Patient consultation records error:",
      error
    );

    res.status(500).json({
      message: "Failed to load medical records.",
    });
  }
});

module.exports = router;