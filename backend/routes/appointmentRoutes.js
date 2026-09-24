const express = require("express");
const db = require("../database");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

/*
========================================
PATIENT BOOKS APPOINTMENT
POST /api/appointments
========================================
*/
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
    } = req.body;

    if (!doctor_id || !appointment_date || !appointment_time) {
      return res.status(400).json({
        message:
          "Doctor, appointment date and appointment time are required.",
      });
    }

    const doctor = db
      .prepare(
        `SELECT id, name, role
         FROM users
         WHERE id = ? AND role = 'doctor'`
      )
      .get(doctor_id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found.",
      });
    }

    const result = db
      .prepare(
        `INSERT INTO appointments
        (
          patient_id,
          doctor_id,
          appointment_date,
          appointment_time,
          symptoms,
          status
        )
        VALUES (?, ?, ?, ?, ?, 'Pending')`
      )
      .run(
        req.user.id,
        doctor_id,
        appointment_date,
        appointment_time,
        symptoms || ""
      );

    res.status(201).json({
      message: "Appointment request submitted successfully.",
      appointmentId: result.lastInsertRowid,
    });
  } catch (error) {
    console.error("Booking error:", error);

    res.status(500).json({
      message: "Failed to book appointment.",
    });
  }
});

/*
========================================
PATIENT APPOINTMENTS
GET /api/appointments/patient
========================================
*/
router.get("/patient", protect, (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        message: "Only patients can access this.",
      });
    }

    const appointments = db
      .prepare(
        `SELECT
          appointments.id,
          appointments.appointment_date,
          appointments.appointment_time,
          appointments.symptoms,
          appointments.status,
          appointments.created_at,

          users.name AS doctor_name,
          users.specialization,
          users.hospital,
          users.consultation_fee

        FROM appointments

        JOIN users
          ON appointments.doctor_id = users.id

        WHERE appointments.patient_id = ?

        ORDER BY
          appointments.appointment_date DESC,
          appointments.appointment_time DESC`
      )
      .all(req.user.id);

    res.json(appointments);
  } catch (error) {
    console.error("Patient appointments error:", error);

    res.status(500).json({
      message: "Failed to load appointments.",
    });
  }
});

/*
========================================
DOCTOR APPOINTMENTS
GET /api/appointments/doctor
========================================
*/
router.get("/doctor", protect, (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctors can access this.",
      });
    }

    const appointments = db
      .prepare(
        `SELECT
          appointments.id,
          appointments.appointment_date,
          appointments.appointment_time,
          appointments.symptoms,
          appointments.status,
          appointments.created_at,

          users.name AS patient_name,
          users.email AS patient_email

        FROM appointments

        JOIN users
          ON appointments.patient_id = users.id

        WHERE appointments.doctor_id = ?

        ORDER BY
          appointments.appointment_date ASC,
          appointments.appointment_time ASC`
      )
      .all(req.user.id);

    res.json(appointments);
  } catch (error) {
    console.error("Doctor appointments error:", error);

    res.status(500).json({
      message: "Failed to load appointments.",
    });
  }
});

/*
========================================
DOCTOR STATISTICS
GET /api/appointments/doctor/stats
========================================
*/
router.get("/doctor/stats", protect, (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctors can access statistics.",
      });
    }

    // Today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Today's appointments
    const todayAppointments = db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM appointments
         WHERE doctor_id = ?
         AND appointment_date = ?
         AND status != 'Cancelled'`
      )
      .get(req.user.id, today).count;

    // Total unique patients
    const totalPatients = db
      .prepare(
        `SELECT COUNT(DISTINCT patient_id) AS count
         FROM appointments
         WHERE doctor_id = ?`
      )
      .get(req.user.id).count;

    // Pending appointment requests
    const pendingRequests = db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM appointments
         WHERE doctor_id = ?
         AND status = 'Pending'`
      )
      .get(req.user.id).count;

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

/*
========================================
PATIENT STATISTICS
GET /api/appointments/patient/stats
========================================
*/
router.get("/patient/stats", protect, (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        message: "Only patients can access statistics.",
      });
    }

    const totalAppointments = db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM appointments
         WHERE patient_id = ?`
      )
      .get(req.user.id).count;

    const confirmedAppointments = db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM appointments
         WHERE patient_id = ?
         AND status = 'Confirmed'`
      )
      .get(req.user.id).count;

    const pendingAppointments = db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM appointments
         WHERE patient_id = ?
         AND status = 'Pending'`
      )
      .get(req.user.id).count;

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

/*
========================================
UPDATE APPOINTMENT STATUS
PUT /api/appointments/:id/status
========================================
*/
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

    const appointment = db
      .prepare(
        `SELECT id
         FROM appointments
         WHERE id = ?
         AND doctor_id = ?`
      )
      .get(appointmentId, req.user.id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found.",
      });
    }

    db.prepare(
      `UPDATE appointments
       SET status = ?
       WHERE id = ?`
    ).run(status, appointmentId);

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