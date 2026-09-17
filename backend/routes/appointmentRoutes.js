const express = require("express");

const db = require("../database");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

/*
  Create appointment
  Only patients can book appointments
*/
router.post("/", protect, (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        message: "Only patients can book appointments",
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
          "Doctor, appointment date, and appointment time are required",
      });
    }

    const doctor = db
      .prepare(
        `
        SELECT id, name
        FROM users
        WHERE id = ? AND role = 'doctor'
        `
      )
      .get(doctor_id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    const appointment = db
      .prepare(
        `
        INSERT INTO appointments
        (
          patient_id,
          doctor_id,
          appointment_date,
          appointment_time,
          symptoms
        )
        VALUES (?, ?, ?, ?, ?)
        `
      )
      .run(
        req.user.id,
        doctor_id,
        appointment_date,
        appointment_time,
        symptoms || ""
      );

    res.status(201).json({
      message: "Appointment request submitted successfully",
      appointmentId: appointment.lastInsertRowid,
    });
  } catch (error) {
    console.error("Create appointment error:", error.message);

    res.status(500).json({
      message: "Failed to create appointment",
    });
  }
});

/*
  Get appointments for logged-in patient
*/
router.get("/patient", protect, (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        message: "Only patients can view patient appointments",
      });
    }

    const appointments = db
      .prepare(
        `
        SELECT
          appointments.id,
          appointments.appointment_date,
          appointments.appointment_time,
          appointments.symptoms,
          appointments.status,
          appointments.created_at,
          users.name AS doctor_name,
          users.specialization,
          users.hospital
        FROM appointments
        JOIN users ON appointments.doctor_id = users.id
        WHERE appointments.patient_id = ?
        ORDER BY appointments.appointment_date ASC,
                 appointments.appointment_time ASC
        `
      )
      .all(req.user.id);

    res.json(appointments);
  } catch (error) {
    console.error("Get patient appointments error:", error.message);

    res.status(500).json({
      message: "Failed to load appointments",
    });
  }
});

/*
  Get appointments for logged-in doctor
*/
router.get("/doctor", protect, (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctors can view doctor appointments",
      });
    }

    const appointments = db
      .prepare(
        `
        SELECT
          appointments.id,
          appointments.appointment_date,
          appointments.appointment_time,
          appointments.symptoms,
          appointments.status,
          appointments.created_at,
          users.name AS patient_name,
          users.email AS patient_email
        FROM appointments
        JOIN users ON appointments.patient_id = users.id
        WHERE appointments.doctor_id = ?
        ORDER BY appointments.appointment_date ASC,
                 appointments.appointment_time ASC
        `
      )
      .all(req.user.id);

    res.json(appointments);
  } catch (error) {
    console.error("Get doctor appointments error:", error.message);

    res.status(500).json({
      message: "Failed to load doctor appointments",
    });
  }
});

/*
  Update appointment status
  Only the assigned doctor can update it
*/
router.put("/:id/status", protect, (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctors can update appointment status",
      });
    }

    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Rejected",
      "Completed",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid appointment status",
      });
    }

    const appointment = db
      .prepare(
        `
        SELECT id
        FROM appointments
        WHERE id = ? AND doctor_id = ?
        `
      )
      .get(req.params.id, req.user.id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    db.prepare(
      `
      UPDATE appointments
      SET status = ?
      WHERE id = ? AND doctor_id = ?
      `
    ).run(status, req.params.id, req.user.id);

    res.json({
      message: "Appointment status updated successfully",
    });
  } catch (error) {
    console.error("Update appointment status error:", error.message);

    res.status(500).json({
      message: "Failed to update appointment status",
    });
  }
});

module.exports = router;