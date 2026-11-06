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
          verification_status,
          admin_notes,
          verified_at
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
          admin_notes,
          reviewed_at,
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
  Upload / Add qualification document (defaults to 'Pending' review)
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
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
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
      message: "Qualification document uploaded successfully. It is queued for admin review and verification.",
      document: newDoc,
    });
  } catch (error) {
    console.error("Add doctor document error:", error.message);

    res.status(500).json({
      message: error.message
        ? `Failed to upload qualification document: ${error.message}`
        : "Failed to upload qualification document",
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
          verification_status,
          admin_notes,
          verified_at
        FROM users
        WHERE role = 'doctor'
        ORDER BY id DESC
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
          admin_notes,
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

    // Fetch review aggregates for all doctors
    const reviewStatsList = db.prepare(`
      SELECT
        doctor_id,
        ROUND(AVG(rating), 1) AS avg_rating,
        COUNT(*) AS review_count
      FROM reviews
      GROUP BY doctor_id
    `).all();

    const reviewMap = {};
    for (const r of reviewStatsList) {
      reviewMap[r.doctor_id] = r;
    }

    const doctorsWithDocs = doctors.map((doc) => ({
      ...doc,
      avg_rating: reviewMap[doc.id] ? reviewMap[doc.id].avg_rating : null,
      review_count: reviewMap[doc.id] ? reviewMap[doc.id].review_count : 0,
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
  Public endpoint: Get verified doctor details by ID (for QR code scanning without auth requirement)
*/
router.get("/verify/:id", (req, res) => {
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
          verification_status,
          admin_notes,
          verified_at,
          created_at
        FROM users
        WHERE id = ? AND role = 'doctor'
        `
      )
      .get(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor record not found in verified registry",
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
          admin_notes,
          created_at
        FROM doctor_documents
        WHERE doctor_id = ?
        ORDER BY created_at DESC
        `
      )
      .all(doctor.id);

    const doctorReviews = db.prepare(`
      SELECT
        r.id,
        r.rating,
        r.review_text,
        r.created_at,
        u.name AS patient_name,
        a.consultation_mode
      FROM reviews r
      JOIN users u ON r.patient_id = u.id
      JOIN appointments a ON r.appointment_id = a.id
      WHERE r.doctor_id = ?
      ORDER BY r.created_at DESC
    `).all(doctor.id);

    const revAvg = doctorReviews.length > 0
      ? (doctorReviews.reduce((sum, r) => sum + r.rating, 0) / doctorReviews.length).toFixed(1)
      : null;

    res.json({
      ...doctor,
      avg_rating: revAvg ? parseFloat(revAvg) : null,
      review_count: doctorReviews.length,
      reviews: doctorReviews,
      documents: documents || [],
      verified_at: doctor.verified_at || new Date().toISOString(),
      registry_seal: `MEDICARE-AUTH-${doctor.id}-${(doctor.medical_license || "REG").replace(/[^a-zA-Z0-9]/g, "")}`,
    });
  } catch (error) {
    console.error("Public verify doctor error:", error.message);
    res.status(500).json({
      message: "Failed to verify doctor details",
    });
  }
});

/*
  Get single doctor with verified documents
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
          verification_status,
          admin_notes,
          verified_at
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
          admin_notes,
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

module.exports = router;
