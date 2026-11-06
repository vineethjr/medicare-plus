const express = require("express");
const db = require("../database");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ========================================
// SUBMIT OR UPDATE DOCTOR RATING & REVIEW
// POST /api/reviews
// ========================================
router.post("/", protect, (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        message: "Only patients can submit reviews for doctors.",
      });
    }

    const { appointment_id, rating, comment } = req.body;

    if (!appointment_id) {
      return res.status(400).json({
        message: "Appointment ID is required.",
      });
    }

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        message: "Please select a valid rating between 1 and 5 stars.",
      });
    }

    // Verify appointment exists and belongs to this patient
    const appointment = db.prepare(`
      SELECT
        a.id,
        a.patient_id,
        a.doctor_id,
        a.status,
        a.appointment_date,
        a.appointment_time,
        u.name AS doctor_name,
        u.specialization AS doctor_specialization
      FROM appointments a
      JOIN users u ON a.doctor_id = u.id
      WHERE a.id = ?
    `).get(appointment_id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found.",
      });
    }

    if (appointment.patient_id !== req.user.id) {
      return res.status(403).json({
        message: "You can only review consultations from your own appointments.",
      });
    }

    // STRICT VALIDATION: Patient can only give rating and review AFTER consultation is completed
    if (appointment.status !== "Completed") {
      return res.status(400).json({
        message: `Rating and review can only be submitted after your consultation with Dr. ${appointment.doctor_name} is completed. Current appointment status is "${appointment.status}".`,
        appointmentStatus: appointment.status,
      });
    }

    const cleanComment = typeof comment === "string" ? comment.trim() : "";
    const cleanRating = Math.max(1, Math.min(5, Math.round(numericRating)));

    const existingReview = db.prepare(`
      SELECT id FROM reviews WHERE appointment_id = ?
    `).get(appointment.id);

    let reviewId;
    if (existingReview) {
      db.prepare(`
        UPDATE reviews
        SET rating = ?,
            comment = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(cleanRating, cleanComment, existingReview.id);
      reviewId = existingReview.id;
    } else {
      const result = db.prepare(`
        INSERT INTO reviews (
          appointment_id,
          patient_id,
          doctor_id,
          rating,
          comment
        )
        VALUES (?, ?, ?, ?, ?)
      `).run(
        appointment.id,
        req.user.id,
        appointment.doctor_id,
        cleanRating,
        cleanComment
      );
      reviewId = result.lastInsertRowid;
    }

    const savedReview = db.prepare(`
      SELECT
        r.id,
        r.appointment_id,
        r.patient_id,
        r.doctor_id,
        r.rating,
        r.comment,
        r.created_at,
        r.updated_at,
        u.name AS doctor_name,
        u.specialization,
        u.hospital
      FROM reviews r
      JOIN users u ON r.doctor_id = u.id
      WHERE r.id = ?
    `).get(reviewId);

    res.status(200).json({
      message: existingReview
        ? "Your consultation rating and review have been updated."
        : `Thank you! Your rating and review for Dr. ${appointment.doctor_name} have been submitted.`,
      review: savedReview,
    });
  } catch (error) {
    console.error("Submit review error:", error);
    res.status(500).json({
      message: "Failed to submit review. Please try again.",
    });
  }
});

// ========================================
// GET REVIEW FOR SPECIFIC APPOINTMENT
// GET /api/reviews/appointment/:appointmentId
// ========================================
router.get("/appointment/:appointmentId", protect, (req, res) => {
  try {
    const review = db.prepare(`
      SELECT
        r.id,
        r.appointment_id,
        r.patient_id,
        r.doctor_id,
        r.rating,
        r.comment,
        r.created_at,
        r.updated_at,
        p.name AS patient_name,
        d.name AS doctor_name,
        d.specialization,
        d.hospital
      FROM reviews r
      JOIN users p ON r.patient_id = p.id
      JOIN users d ON r.doctor_id = d.id
      WHERE r.appointment_id = ?
        AND (r.patient_id = ? OR r.doctor_id = ?)
    `).get(req.params.appointmentId, req.user.id, req.user.id);

    if (!review) {
      return res.status(404).json({
        message: "No review found for this appointment.",
      });
    }

    res.json(review);
  } catch (error) {
    console.error("Get appointment review error:", error);
    res.status(500).json({
      message: "Failed to load review.",
    });
  }
});

// ========================================
// GET ALL REVIEWS FOR A DOCTOR (PUBLIC / PROTECTED)
// GET /api/reviews/doctor/:doctorId
// ========================================
router.get("/doctor/:doctorId", (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    const doctor = db.prepare(`
      SELECT id, name, specialization, hospital
      FROM users
      WHERE id = ? AND role = 'doctor'
    `).get(doctorId);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found.",
      });
    }

    const summary = db.prepare(`
      SELECT
        COALESCE(ROUND(AVG(rating), 1), 5.0) AS average_rating,
        COUNT(*) AS total_reviews
      FROM reviews
      WHERE doctor_id = ?
    `).get(doctorId);

    const reviews = db.prepare(`
      SELECT
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.name AS patient_name
      FROM reviews r
      JOIN users u ON r.patient_id = u.id
      WHERE r.doctor_id = ?
      ORDER BY r.created_at DESC
    `).all(doctorId);

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      if (breakdown[r.rating] !== undefined) {
        breakdown[r.rating]++;
      }
    });

    res.json({
      doctor,
      averageRating: summary ? summary.average_rating : 5.0,
      totalReviews: summary ? summary.total_reviews : 0,
      breakdown,
      reviews,
    });
  } catch (error) {
    console.error("Get doctor reviews error:", error);
    res.status(500).json({
      message: "Failed to load doctor reviews.",
    });
  }
});

// ========================================
// GET LOGGED-IN PATIENT'S SUBMITTED REVIEWS
// GET /api/reviews/my
// ========================================
router.get("/my", protect, (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        message: "Only patients can view their reviews.",
      });
    }

    const reviews = db.prepare(`
      SELECT
        r.id,
        r.appointment_id,
        r.doctor_id,
        r.rating,
        r.comment,
        r.created_at,
        r.updated_at,
        d.name AS doctor_name,
        d.specialization,
        d.hospital,
        a.appointment_date,
        a.appointment_time
      FROM reviews r
      JOIN users d ON r.doctor_id = d.id
      JOIN appointments a ON r.appointment_id = a.id
      WHERE r.patient_id = ?
      ORDER BY r.created_at DESC
    `).all(req.user.id);

    res.json(reviews);
  } catch (error) {
    console.error("Get my reviews error:", error);
    res.status(500).json({
      message: "Failed to load your reviews.",
    });
  }
});

// ========================================
// DELETE A PATIENT'S REVIEW
// DELETE /api/reviews/:id
// ========================================
router.delete("/:id", protect, (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        message: "Only patients can delete reviews.",
      });
    }

    const result = db.prepare(`
      DELETE FROM reviews
      WHERE id = ? AND patient_id = ?
    `).run(req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({
        message: "Review not found or unauthorized.",
      });
    }

    res.json({
      message: "Review removed successfully.",
    });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({
      message: "Failed to delete review.",
    });
  }
});

module.exports = router;
