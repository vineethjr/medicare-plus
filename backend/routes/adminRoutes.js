const express = require("express");
const db = require("../database");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Enforce admin privileges for all routes in this file
router.use(protect.requireAdmin);

/**
 * GET /api/admin/stats
 * Telemetry metrics for verification dashboard
 */
router.get("/stats", (req, res) => {
  try {
    const totalDoctors = db
      .prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'doctor'")
      .get().count;

    const verifiedDoctors = db
      .prepare(
        "SELECT COUNT(*) AS count FROM users WHERE role = 'doctor' AND verification_status = 'Verified'"
      )
      .get().count;

    const pendingDoctors = db
      .prepare(
        "SELECT COUNT(*) AS count FROM users WHERE role = 'doctor' AND (verification_status = 'Pending' OR verification_status IS NULL)"
      )
      .get().count;

    const fraudDoctors = db
      .prepare(
        "SELECT COUNT(*) AS count FROM users WHERE role = 'doctor' AND verification_status = 'Fraud'"
      )
      .get().count;

    const rejectedDoctors = db
      .prepare(
        "SELECT COUNT(*) AS count FROM users WHERE role = 'doctor' AND verification_status = 'Rejected'"
      )
      .get().count;

    const totalDocuments = db
      .prepare("SELECT COUNT(*) AS count FROM doctor_documents")
      .get().count;

    const pendingDocuments = db
      .prepare(
        "SELECT COUNT(*) AS count FROM doctor_documents WHERE status = 'Pending' OR status IS NULL"
      )
      .get().count;

    const verifiedDocuments = db
      .prepare(
        "SELECT COUNT(*) AS count FROM doctor_documents WHERE status = 'Verified'"
      )
      .get().count;

    const rejectedDocuments = db
      .prepare(
        "SELECT COUNT(*) AS count FROM doctor_documents WHERE status = 'Rejected'"
      )
      .get().count;

    res.json({
      totalDoctors,
      verifiedDoctors,
      pendingDoctors,
      fraudDoctors,
      rejectedDoctors,
      totalDocuments,
      pendingDocuments,
      verifiedDocuments,
      rejectedDocuments,
    });
  } catch (error) {
    console.error("Admin stats error:", error.message);
    res.status(500).json({
      message: "Failed to load admin verification metrics",
    });
  }
});

/**
 * GET /api/admin/doctors
 * Filterable and searchable list of all doctors with their verification status and documents
 */
router.get("/doctors", (req, res) => {
  try {
    const { status, search } = req.query;

    let query = `
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
      WHERE role = 'doctor'
    `;
    const params = [];

    if (status && status !== "all") {
      if (status === "pending") {
        query += " AND (verification_status = 'Pending' OR verification_status IS NULL)";
      } else if (status === "verified") {
        query += " AND verification_status = 'Verified'";
      } else if (status === "fraud") {
        query += " AND verification_status = 'Fraud'";
      } else if (status === "rejected") {
        query += " AND verification_status = 'Rejected'";
      }
    }

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      query += ` AND (
        LOWER(name) LIKE ? OR
        LOWER(email) LIKE ? OR
        LOWER(medical_license) LIKE ? OR
        LOWER(specialization) LIKE ? OR
        LOWER(hospital) LIKE ?
      )`;
      params.push(term, term, term, term, term);
    }

    query += " ORDER BY id DESC";

    const doctors = db.prepare(query).all(...params);

    // Fetch all documents for these doctors
    const docQuery = `
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
        reviewed_at,
        created_at
      FROM doctor_documents
      ORDER BY created_at DESC
    `;
    const allDocs = db.prepare(docQuery).all();

    const docsByDoctor = {};
    for (const d of allDocs) {
      if (!docsByDoctor[d.doctor_id]) {
        docsByDoctor[d.doctor_id] = [];
      }
      docsByDoctor[d.doctor_id].push(d);
    }

    const doctorsWithDocs = doctors.map((doc) => {
      const docs = docsByDoctor[doc.id] || [];
      const pendingCount = docs.filter(
        (d) => d.status === "Pending" || !d.status
      ).length;
      const verifiedCount = docs.filter((d) => d.status === "Verified").length;
      const rejectedCount = docs.filter((d) => d.status === "Rejected").length;

      return {
        ...doc,
        verification_status: doc.verification_status || "Pending",
        documents: docs,
        doc_counts: {
          total: docs.length,
          pending: pendingCount,
          verified: verifiedCount,
          rejected: rejectedCount,
        },
      };
    });

    res.json(doctorsWithDocs);
  } catch (error) {
    console.error("Admin list doctors error:", error.message);
    res.status(500).json({
      message: "Failed to retrieve doctor verification list",
    });
  }
});

/**
 * GET /api/admin/doctors/:id
 * Retrieve single doctor dossier with all documents
 */
router.get("/doctors/:id", (req, res) => {
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
        message: "Doctor record not found",
      });
    }

    const documents = db
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
          reviewed_at,
          created_at
        FROM doctor_documents
        WHERE doctor_id = ?
        ORDER BY created_at DESC
        `
      )
      .all(doctor.id);

    res.json({
      ...doctor,
      verification_status: doctor.verification_status || "Pending",
      documents: documents || [],
    });
  } catch (error) {
    console.error("Admin get doctor dossier error:", error.message);
    res.status(500).json({
      message: "Failed to load doctor dossier",
    });
  }
});

/**
 * PUT /api/admin/doctors/:id/verify
 * Update doctor verification status (Verified, Pending, Fraud, Rejected)
 * and grant or revoke the verification badge with admin audit notes.
 */
router.put("/doctors/:id/verify", (req, res) => {
  try {
    const { verification_status, admin_notes } = req.body;
    const doctorId = req.params.id;

    const allowed = ["Verified", "Pending", "Fraud", "Rejected"];
    if (!allowed.includes(verification_status)) {
      return res.status(400).json({
        message: `Invalid verification status. Must be one of: ${allowed.join(", ")}`,
      });
    }

    const doctor = db
      .prepare("SELECT id, name, email FROM users WHERE id = ? AND role = 'doctor'")
      .get(doctorId);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor record not found",
      });
    }

    const nowIso = new Date().toISOString();

    db.prepare(
      `
      UPDATE users
      SET
        verification_status = ?,
        admin_notes = ?,
        verified_at = ?,
        verified_by = ?
      WHERE id = ? AND role = 'doctor'
      `
    ).run(
      verification_status,
      admin_notes || "",
      nowIso,
      req.user.id,
      doctorId
    );

    // If verified, automatically mark any pending documents for this doctor as verified
    if (verification_status === "Verified") {
      db.prepare(
        `
        UPDATE doctor_documents
        SET
          status = 'Verified',
          reviewed_at = ?
        WHERE doctor_id = ? AND (status = 'Pending' OR status IS NULL)
        `
      ).run(nowIso, doctorId);
    } else if (verification_status === "Fraud") {
      // If marked as Fraud, reject any unverified documents
      db.prepare(
        `
        UPDATE doctor_documents
        SET
          status = 'Rejected',
          admin_notes = 'Flagged under fraudulent account audit.',
          reviewed_at = ?
        WHERE doctor_id = ?
        `
      ).run(nowIso, doctorId);
    }

    const updated = db
      .prepare(
        `
        SELECT
          id,
          name,
          email,
          verification_status,
          admin_notes,
          verified_at
        FROM users
        WHERE id = ?
        `
      )
      .get(doctorId);

    const statusLabels = {
      Verified: "Doctor verified as Genuine! Verification badge granted.",
      Fraud: "Doctor flagged as Fraudulent! Verification badge revoked and account suspended.",
      Rejected: "Doctor credentials rejected. Re-upload or correction requested.",
      Pending: "Doctor status reset to Pending review.",
    };

    res.json({
      message: statusLabels[verification_status] || "Doctor verification status updated successfully.",
      doctor: updated,
    });
  } catch (error) {
    console.error("Admin verify doctor error:", error.message);
    res.status(500).json({
      message: "Failed to update doctor verification status",
    });
  }
});

/**
 * PUT /api/admin/documents/:id/status
 * Approve or reject an individual qualification document
 */
router.put("/documents/:id/status", (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    const docId = req.params.id;

    const allowed = ["Verified", "Pending", "Rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Invalid document status. Must be one of: ${allowed.join(", ")}`,
      });
    }

    const doc = db
      .prepare("SELECT * FROM doctor_documents WHERE id = ?")
      .get(docId);

    if (!doc) {
      return res.status(404).json({
        message: "Qualification document not found",
      });
    }

    const nowIso = new Date().toISOString();

    db.prepare(
      `
      UPDATE doctor_documents
      SET
        status = ?,
        admin_notes = ?,
        reviewed_at = ?
      WHERE id = ?
      `
    ).run(status, admin_notes || "", nowIso, docId);

    const updatedDoc = db
      .prepare("SELECT * FROM doctor_documents WHERE id = ?")
      .get(docId);

    res.json({
      message: `Document status updated to ${status}.`,
      document: updatedDoc,
    });
  } catch (error) {
    console.error("Admin update document error:", error.message);
    res.status(500).json({
      message: "Failed to update document status",
    });
  }
});

module.exports = router;
