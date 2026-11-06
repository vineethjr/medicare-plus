const express = require("express");
const db = require("../database");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Format patient name for clinical privacy (e.g. "Priya Sharma" -> "Priya S.")
 */
function maskPatientName(fullName) {
  if (!fullName) return "Verified Patient";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}.`;
}

// ========================================
// SUBMIT RATING & REVIEW FOR A CONSULTATION
// POST /api/reviews
// ========================================
router.post("/", protect, (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        message: "Only patients can submit ratings and reviews for doctors.",
      });
    }

    const { appointment_id, rating, review_text } = req.body;

    if (!appointment_id) {
      return res.status(400).json({
        message: "Appointment ID is required to submit a review.",
      });
    }

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        message: "Rating must be an integer between 1 and 5 stars.",
      });
    }

    // Verify appointment exists
    const appointment = db
      .prepare(
        `SELECT id, patient_id, doctor_id, status, consultation_mode, appointment_date
         FROM appointments
         WHERE id = ?`
      )
      .get(appointment_id);

    if (!appointment) {
      return res.status(404).json({
        message: "Consultation appointment not found.",
      });
    }

    // Check ownership
    if (appointment.patient_id !== req.user.id) {
      return res.status(403).json({
        message: "You can only submit reviews for your own consultation appointments.",
      });
    }

    // Check completion status (online or offline)
    if (appointment.status !== "Completed") {
      return res.status(400).json({
        message: "Ratings and reviews can only be submitted after consultation is marked as completed.",
      });
    }

    // Check if already reviewed
    const existing = db
      .prepare(`SELECT id FROM reviews WHERE appointment_id = ?`)
      .get(appointment.id);

    if (existing) {
      return res.status(400).json({
        message: "You have already submitted a review for this consultation.",
      });
    }

    const cleanComment = typeof review_text === "string" ? review_text.trim() : "";

    const insertResult = db
      .prepare(
        `INSERT INTO reviews (appointment_id, patient_id, doctor_id, rating, review_text)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        appointment.id,
        req.user.id,
        appointment.doctor_id,
        numRating,
        cleanComment
      );

    const createdReview = db
      .prepare(
        `SELECT id, appointment_id, patient_id, doctor_id, rating, review_text, created_at
         FROM reviews WHERE id = ?`
      )
      .get(insertResult.lastInsertRowid);

    return res.status(201).json({
      message: "Thank you! Your doctor rating and review have been recorded.",
      review: createdReview,
    });
  } catch (error) {
    console.error("Submit review error:", error.message);
    return res.status(500).json({
      message: "Failed to submit review. Please try again.",
    });
  }
});

// ========================================
// GET REVIEWS & RATING STATS FOR A DOCTOR
// GET /api/reviews/doctor/:doctorId
// ========================================
router.get("/doctor/:doctorId", (req, res) => {
  try {
    const doctorId = parseInt(req.params.doctorId, 10);
    if (isNaN(doctorId)) {
      return res.status(400).json({ message: "Invalid Doctor ID." });
    }

    // Verify doctor exists
    const doctor = db
      .prepare(`SELECT id, name, specialization FROM users WHERE id = ? AND role = 'doctor'`)
      .get(doctorId);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    // Compute aggregate stats
    const stats = db
      .prepare(
        `SELECT
           COUNT(*) AS total_reviews,
           ROUND(AVG(rating), 1) AS avg_rating,
           SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS five_star,
           SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS four_star,
           SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS three_star,
           SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS two_star,
           SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS one_star
         FROM reviews
         WHERE doctor_id = ?`
      )
      .get(doctorId);

    const rawReviews = db
      .prepare(
        `SELECT
           r.id,
           r.appointment_id,
           r.doctor_id,
           r.rating,
           r.review_text,
           r.created_at,
           u.name AS patient_name,
           a.consultation_mode,
           a.appointment_date
         FROM reviews r
         JOIN users u ON r.patient_id = u.id
         JOIN appointments a ON r.appointment_id = a.id
         WHERE r.doctor_id = ?
         ORDER BY r.created_at DESC`
      )
      .all(doctorId);

    const reviews = rawReviews.map((rev) => ({
      ...rev,
      patient_display_name: maskPatientName(rev.patient_name),
    }));

    return res.json({
      doctorId,
      doctorName: doctor.name,
      specialization: doctor.specialization,
      averageRating: stats && stats.total_reviews > 0 ? stats.avg_rating : null,
      totalReviews: stats ? stats.total_reviews : 0,
      breakdown: {
        5: stats ? stats.five_star || 0 : 0,
        4: stats ? stats.four_star || 0 : 0,
        3: stats ? stats.three_star || 0 : 0,
        2: stats ? stats.two_star || 0 : 0,
        1: stats ? stats.one_star || 0 : 0,
      },
      reviews,
    });
  } catch (error) {
    console.error("Get doctor reviews error:", error.message);
    return res.status(500).json({
      message: "Failed to retrieve doctor reviews.",
    });
  }
});

// ========================================
// GET REVIEW FOR A SPECIFIC APPOINTMENT
// GET /api/reviews/appointment/:appointmentId
// ========================================
router.get("/appointment/:appointmentId", protect, (req, res) => {
  try {
    const appointmentId = parseInt(req.params.appointmentId, 10);
    if (isNaN(appointmentId)) {
      return res.status(400).json({ message: "Invalid Appointment ID." });
    }

    const review = db
      .prepare(
        `SELECT
           r.id,
           r.appointment_id,
           r.doctor_id,
           r.patient_id,
           r.rating,
           r.review_text,
           r.created_at,
           doc.name AS doctor_name,
           doc.specialization
         FROM reviews r
         JOIN users doc ON r.doctor_id = doc.id
         WHERE r.appointment_id = ?`
      )
      .get(appointmentId);

    if (!review) {
      return res.json({ hasReviewed: false, review: null });
    }

    // Only allow patient or doctor of the appointment (or admin) to inspect
    if (
      req.user.role !== "admin" &&
      req.user.id !== review.patient_id &&
      req.user.id !== review.doctor_id
    ) {
      return res.status(403).json({ message: "Access unauthorized." });
    }

    return res.json({
      hasReviewed: true,
      review,
    });
  } catch (error) {
    console.error("Get appointment review error:", error.message);
    return res.status(500).json({
      message: "Failed to retrieve consultation review.",
    });
  }
});

module.exports = router;
