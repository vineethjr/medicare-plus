const express = require("express");
const db = require("../database");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * GET /api/patient/profile
 * Get logged-in patient's profile
 */
router.get("/profile", protect, (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        message: "Only patients can access their patient profile directly.",
      });
    }

    const patient = db
      .prepare(
        `
        SELECT
          id,
          name,
          email,
          role,
          age,
          gender,
          blood_group,
          height,
          weight,
          allergies,
          chronic_conditions,
          current_medications,
          past_surgeries,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relation,
          created_at
        FROM users
        WHERE id = ? AND role = 'patient'
        `
      )
      .get(req.user.id);

    if (!patient) {
      return res.status(404).json({
        message: "Patient profile not found.",
      });
    }

    res.json(patient);
  } catch (error) {
    console.error("Get patient profile error:", error.message);
    res.status(500).json({
      message: "Failed to load patient profile.",
    });
  }
});

/**
 * PUT /api/patient/profile
 * Update logged-in patient's profile
 */
router.put("/profile", protect, (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        message: "Only patients can update their patient profile.",
      });
    }

    const {
      age,
      gender,
      blood_group,
      height,
      weight,
      allergies,
      chronic_conditions,
      current_medications,
      past_surgeries,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relation,
    } = req.body;

    db.prepare(
      `
      UPDATE users
      SET
        age = ?,
        gender = ?,
        blood_group = ?,
        height = ?,
        weight = ?,
        allergies = ?,
        chronic_conditions = ?,
        current_medications = ?,
        past_surgeries = ?,
        emergency_contact_name = ?,
        emergency_contact_phone = ?,
        emergency_contact_relation = ?
      WHERE id = ? AND role = 'patient'
      `
    ).run(
      age !== undefined && age !== "" ? Number(age) : null,
      gender || null,
      blood_group || null,
      height !== undefined && height !== "" ? Number(height) : null,
      weight !== undefined && weight !== "" ? Number(weight) : null,
      allergies || "",
      chronic_conditions || "",
      current_medications || "",
      past_surgeries || "",
      emergency_contact_name || "",
      emergency_contact_phone || "",
      emergency_contact_relation || "",
      req.user.id
    );

    const updated = db
      .prepare(
        `
        SELECT
          id,
          name,
          email,
          role,
          age,
          gender,
          blood_group,
          height,
          weight,
          allergies,
          chronic_conditions,
          current_medications,
          past_surgeries,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relation
        FROM users
        WHERE id = ?
        `
      )
      .get(req.user.id);

    res.json({
      message: "Medical profile saved successfully.",
      profile: updated,
    });
  } catch (error) {
    console.error("Update patient profile error:", error.message);
    res.status(500).json({
      message: "Failed to update patient profile.",
    });
  }
});

/**
 * GET /api/patient/profile/:patientId
 * Allows doctors (or the patient themselves) to view clinical profile
 */
router.get("/profile/:patientId", protect, (req, res) => {
  try {
    const targetId = Number(req.params.patientId);

    // Allow if requester is doctor, or if requester is patient viewing their own profile
    if (req.user.role !== "doctor" && req.user.id !== targetId) {
      return res.status(403).json({
        message: "You are not authorized to view this patient's medical dossier.",
      });
    }

    const patient = db
      .prepare(
        `
        SELECT
          id,
          name,
          email,
          age,
          gender,
          blood_group,
          height,
          weight,
          allergies,
          chronic_conditions,
          current_medications,
          past_surgeries,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relation
        FROM users
        WHERE id = ? AND role = 'patient'
        `
      )
      .get(targetId);

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found.",
      });
    }

    res.json(patient);
  } catch (error) {
    console.error("Doctor fetch patient profile error:", error.message);
    res.status(500).json({
      message: "Failed to retrieve patient medical profile.",
    });
  }
});

module.exports = router;
