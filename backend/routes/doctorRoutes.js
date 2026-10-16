const express = require("express");

const db = require("../database");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

/*
  Get logged-in doctor's profile with qualification documents
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
          availability,
          medical_license,
          verification_status
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

    // Fetch qualification documents
    const documents = db
      .prepare(
        `
        SELECT
          id,
          document_name,
          document_type,
          issuer,
          issue_year,
          file_url,
          file_name,
          status,
          created_at
        FROM doctor_documents
        WHERE doctor_id = ?
        ORDER BY created_at DESC
        `
      )
      .all(req.user.id);

    res.json({
      ...doctor,
      documents: documents || [],
    });
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
      medical_license,
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
        availability = ?,
        medical_license = ?
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
      medical_license || "",
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
  Upload / Add qualification document
*/
router.post("/documents", protect, (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctors can upload qualification documents",
      });
    }

    const {
      document_name,
      document_type,
      issuer,
      issue_year,
      file_url,
      file_name,
    } = req.body;

    if (!document_name || !file_url) {
      return res.status(400).json({
        message: "Document name and document file/proof are required",
      });
    }

    const result = db
      .prepare(
        `
        INSERT INTO doctor_documents (
          doctor_id,
          document_name,
          document_type,
          issuer,
          issue_year,
          file_url,
          file_name,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Verified')
        `
      )
      .run(
        req.user.id,
        document_name.trim(),
        document_type || "Degree Certificate",
        issuer || "Medical Council / University",
        issue_year || new Date().getFullYear().toString(),
        file_url,
        file_name || document_name
      );

    const newDoc = db
      .prepare(
        `
        SELECT * FROM doctor_documents WHERE id = ?
        `
      )
      .get(result.lastInsertRowid);

    res.status(201).json({
      message: "Qualification document uploaded and verified successfully",
      document: newDoc,
    });
  } catch (error) {
    console.error("Add doctor document error:", error.message);

    res.status(500).json({
      message: "Failed to upload qualification document",
    });
  }
});

/*
  Delete a qualification document
*/
router.delete("/documents/:id", protect, (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        message: "Only doctors can delete documents",
      });
    }

    const docId = req.params.id;

    const result = db
      .prepare(
        `
        DELETE FROM doctor_documents
        WHERE id = ? AND doctor_id = ?
        `
      )
      .run(docId, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({
        message: "Document not found or unauthorized",
      });
    }

    res.json({
      message: "Qualification document removed successfully",
    });
  } catch (error) {
    console.error("Delete doctor document error:", error.message);

    res.status(500).json({
      message: "Failed to delete qualification document",
    });
  }
});

/*
  Get single doctor with verified documents (public for verification)
*/
router.get("/:id", protect, (req, res) => {
  try {
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
          availability,
          medical_license,
          verification_status
        FROM users
        WHERE id = ? AND role = 'doctor'
        `
      )
      .get(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    const documents = db
      .prepare(
        `
        SELECT
          id,
          document_name,
          document_type,
          issuer,
          issue_year,
          file_url,
          file_name,
          status,
          created_at
        FROM doctor_documents
        WHERE doctor_id = ?
        ORDER BY created_at DESC
        `
      )
      .all(doctor.id);

    res.json({
      ...doctor,
      documents: documents || [],
    });
  } catch (error) {
    console.error("Get doctor details error:", error.message);

    res.status(500).json({
      message: "Failed to load doctor profile",
    });
  }
});

/*
  Get all doctors with verified documents for Find Doctor page
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
          availability,
          medical_license,
          verification_status
        FROM users
        WHERE role = 'doctor'
        ORDER BY name ASC
        `
      )
      .all();

    const allDocuments = db
      .prepare(
        `
        SELECT
          id,
          doctor_id,
          document_name,
          document_type,
          issuer,
          issue_year,
          file_url,
          file_name,
          status,
          created_at
        FROM doctor_documents
        ORDER BY created_at DESC
        `
      )
      .all();

    // Group documents by doctor_id
    const docsByDoctor = {};
    for (const doc of allDocuments) {
      if (!docsByDoctor[doc.doctor_id]) {
        docsByDoctor[doc.doctor_id] = [];
      }
      docsByDoctor[doc.doctor_id].push(doc);
    }

    const doctorsWithDocs = doctors.map((doc) => ({
      ...doc,
      documents: docsByDoctor[doc.id] || [],
    }));

    res.json(doctorsWithDocs);
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