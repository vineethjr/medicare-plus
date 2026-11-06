import { useEffect, useState } from "react";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  HospitalIcon,
  SparklesIcon,
  StarIcon,
  TrashIcon,
  XIcon,
} from "./Icons";
import { API_URL } from "../config";
import "./RatingReviewModal.css";

const RATING_LABELS = {
  5: "🌟 Exceptional - Outstanding clinical care & communication",
  4: "😊 Very Good - Attentive, professional & effective",
  3: "🙂 Good - Addressed my primary health concerns",
  2: "😐 Fair - Consultation was acceptable but could improve",
  1: "😞 Poor - Unsatisfactory consultation experience",
};

const QUICK_TAGS = [
  "🩺 Accurate Diagnosis",
  "👂 Attentive Listener",
  "💡 Clear Explanations",
  "❤️ Compassionate Care",
  "⚡ Prompt & Punctual",
  "📋 Helpful Advice",
];

export default function RatingReviewModal({
  appointment,
  isOpen,
  onClose,
  onSuccess,
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  // Pre-fill existing review data if already reviewed
  useEffect(() => {
    if (appointment) {
      setRating(appointment.review_rating || 0);
      setComment(appointment.review_comment || "");
      setError("");
      setSuccess("");
    }
  }, [appointment]);

  if (!isOpen || !appointment) return null;

  const activeRating = hoverRating || rating;
  const isEditing = Boolean(appointment.review_id || appointment.review_rating);

  function handleTagClick(tag) {
    if (!comment) {
      setComment(tag);
      return;
    }
    if (!comment.includes(tag)) {
      setComment((prev) => `${prev.trim()} • ${tag}`);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!rating || rating < 1) {
      setError("Please tap a star to give a rating between 1 and 5.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointment_id: appointment.id,
          rating,
          comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit review.");
      }

      setSuccess(data.message || "Review submitted successfully!");
      if (onSuccess) {
        onSuccess(data.review);
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!appointment.review_id) return;
    if (!window.confirm("Are you sure you want to delete your review for this consultation?")) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(`${API_URL}/reviews/${appointment.review_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete review.");
      }

      setSuccess("Review removed successfully.");
      if (onSuccess) {
        onSuccess(null);
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to delete review.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="review-modal-close-btn"
          onClick={onClose}
          disabled={submitting || deleting}
        >
          <XIcon size={18} />
        </button>

        {/* MODAL HEADER */}
        <div className="review-modal-header">
          <div className="review-doctor-avatar">
            {appointment.doctor_name?.charAt(0).toUpperCase() || "D"}
          </div>

          <div className="review-header-info">
            <span className="review-context-badge">
              <CheckCircleIcon size={13} /> Completed Consultation Feedback
            </span>
            <h2>Dr. {appointment.doctor_name || "Doctor"}</h2>
            <div className="review-doctor-submeta">
              <span>{appointment.specialization || "Specialist"}</span>
              {appointment.hospital && (
                <>
                  <span className="bullet">•</span>
                  <span>
                    <HospitalIcon size={12} /> {appointment.hospital}
                  </span>
                </>
              )}
            </div>
            <div className="review-consultation-date">
              Consultation date: <strong>{appointment.appointment_date}</strong> at{" "}
              <strong>{appointment.appointment_time}</strong>
            </div>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="review-modal-form">
          {/* STAR RATING SELECTOR */}
          <div className="star-rating-section">
            <label className="section-label">
              Overall Consultation Rating *
            </label>

            <div
              className="interactive-stars-row"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= activeRating;
                return (
                  <button
                    key={star}
                    type="button"
                    className={`star-select-btn ${isFilled ? "active" : ""}`}
                    onMouseEnter={() => setHoverRating(star)}
                    onClick={() => setRating(star)}
                    title={`${star} Star${star > 1 ? "s" : ""}`}
                  >
                    <StarIcon
                      size={32}
                      className="rating-star-icon"
                      fill={isFilled ? "#f59e0b" : "#cbd5e1"}
                    />
                  </button>
                );
              })}
            </div>

            <div className="rating-sentiment-text">
              {activeRating > 0 ? (
                <span className="sentiment-active">
                  {RATING_LABELS[activeRating]}
                </span>
              ) : (
                <span className="sentiment-hint">
                  Tap a star to rate your consultation with Dr. {appointment.doctor_name}
                </span>
              )}
            </div>
          </div>

          {/* QUICK FEEDBACK TAGS */}
          <div className="quick-tags-section">
            <label className="section-label">
              <SparklesIcon size={14} className="text-teal" /> Quick Impressions (optional)
            </label>
            <div className="tags-chips-cloud">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-chip-btn ${comment.includes(tag) ? "selected" : ""}`}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* DETAILED COMMENTS */}
          <div className="review-comment-section">
            <div className="comment-label-row">
              <label htmlFor="review-comment" className="section-label">
                Your Feedback & Clinical Experience (optional)
              </label>
              <span className="char-count">{comment.length} / 1000</span>
            </div>

            <textarea
              id="review-comment"
              rows={4}
              maxLength={1000}
              placeholder={`Share your experience with Dr. ${appointment.doctor_name}. How was the doctor's communication, diagnosis explanation, and attentiveness?`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {/* ERROR & SUCCESS MESSAGES */}
          {error && (
            <div className="review-error-banner">
              <AlertCircleIcon size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="review-success-banner">
              <CheckCircleIcon size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* MODAL ACTIONS */}
          <div className="review-modal-actions">
            {isEditing && (
              <button
                type="button"
                className="btn-delete-review"
                onClick={handleDelete}
                disabled={submitting || deleting}
              >
                <TrashIcon size={14} />
                <span>{deleting ? "Removing..." : "Delete Review"}</span>
              </button>
            )}

            <div className="actions-right">
              <button
                type="button"
                className="btn-cancel-review"
                onClick={onClose}
                disabled={submitting || deleting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-submit-review"
                disabled={submitting || deleting}
              >
                <StarIcon size={15} fill="#ffffff" />
                <span>
                  {submitting
                    ? "Submitting..."
                    : isEditing
                    ? "Update Review"
                    : "Submit Consultation Review"}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
