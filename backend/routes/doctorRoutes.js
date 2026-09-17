const express = require("express");

const db = require("../database");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

/*
  Get logged-in doctor's profile
*/
router.get("/profile", protect, (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctors can access this profile",
      });
    }

    const doctor = db
      .prepare(
        `
        SELECT
          id,
          name,
          email,
          specialization,
          qualification,
          experience,
          consultation_fee,
          hospital,
          bio,
          availability
        FROM users
        WHERE id = ? AND role = 'doctor'
        `
      )
      .get(req.user.id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor profile not found",
      });
    }

    res.json(doctor);
  } catch (error) {
    console.error("Get doctor profile error:", error.message);

    res.status(500).json({
      message: "Failed to load doctor profile",
    });
  }
});

/*
  Update logged-in doctor's profile
*/
router.put("/profile", protect, (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctors can update this profile",
      });
    }

    const {
      specialization,
      qualification,
      experience,
      consultation_fee,
      hospital,
      bio,
      availability,
    } = req.body;

    if (!specialization || !qualification || !hospital) {
      return res.status(400).json({
        message:
          "Specialization, qualification, and hospital are required",
      });
    }

    db.prepare(
      `
      UPDATE users
      SET
        specialization = ?,
        qualification = ?,
        experience = ?,
        consultation_fee = ?,
        hospital = ?,
        bio = ?,
        availability = ?
      WHERE id = ? AND role = 'doctor'
      `
    ).run(
      specialization,
      qualification,
      Number(experience) || 0,
      Number(consultation_fee) || 0,
      hospital,
      bio || "",
      availability || "",
      req.user.id
    );

    res.json({
      message: "Doctor profile updated successfully",
    });
  } catch (error) {
    console.error("Update doctor profile error:", error.message);

    res.status(500).json({
      message: "Failed to update doctor profile",
    });
  }
});

/*
  Get all doctors
*/
router.get("/", protect, (req, res) => {
  try {
    const doctors = db
      .prepare(
        `
        SELECT
          id,
          name,
          email,
          specialization,
          qualification,
          experience,
          consultation_fee,
          hospital,
          bio,
          availability
        FROM users
        WHERE role = 'doctor'
        ORDER BY name ASC
        `
      )
      .all();

    res.json(doctors);
  } catch (error) {
    console.error("Get doctors error:", error.message);

    res.status(500).json({
      message: "Failed to load doctors",
    });
  }
});

/*
  Export router
*/
module.exports = router;