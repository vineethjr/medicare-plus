import React, { useState } from "react";
import "./RatingModal.css";
import {
  StarIcon,
  ShieldCheckIcon,
  VideoIcon,
  HospitalIcon,
  XIcon,
  SparklesIcon,
  CheckCircleIcon,
} from "./Icons";
import { API_URL } from "../config";

const SENTIMENT_LABELS = {
  1: { label: "Poor", desc: "Consultation fell below clinical expectations", color: "#ef4444" },
  2: { label: "Fair", desc: "Room for improvement in communication or care", color: "#f97316" },
  3: { label: "Good", desc: "Standard satisfactory medical consultation", color: "#eab308" },
  4: { label: "Very Good", desc: "Attentive, professional & helpful advice", color: "#38bdf8" },
  5: { label: "Excellent", desc: "Outstanding medical expertise and clinical care", color: "#2dd4bf" },
};

const QUICK_TAGS = [
  "Accurate Diagnosis",
  "Clear Medical Explanation",
  "Kind & Attentive",
  "Punctual Consultation",
  "Thorough Examination",
  "Helpful Treatment Plan",
];

export default function RatingModal({
  isOpen,
  onClose,
  appointment,
  onSuccess,
  canSkip = false,
}) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !appointment) return null;

  const activeStars = hoverRating || rating;
  const sentiment = SENTIMENT_LABELS[activeStars] || SENTIMENT_LABELS[5];
  const isOnline = appointment.consultation_mode === "Online";

  function handleTagClick(tag) {
    if (reviewText.includes(tag)) {
      setReviewText((prev) =>
        prev
          .replace(tag, "")
          .replace(/\s{2,}/g, " ")
          .trim()
      );
    } else {
      setReviewText((prev) => (prev ? `${prev}. ${tag}` : tag));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!rating || rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5 stars.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("You must be logged in to submit a review.");
      }

      const res = await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointment_id: appointment.id,
          rating,
          review_text: reviewText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit review.");
      }

      setSubmitted(true);
      setTimeout(() => {
        if (onSuccess) onSuccess(data.review);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="rating-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) {
          onClose();
        }
      }}
    >
      <div className="rating-modal-card">
        {/* HEADER */}
        <header className="rating-modal-header">
          <div className="rating-modal-title-group">
            <div className="rating-badge-icon">
              <SparklesIcon size={18} />
            </div>
            <div>
              <h3>Rate Your Consultation Experience</h3>
              <p>Your feedback helps uphold MediCare+ clinical standards</p>
            </div>
          </div>
          <button
            type="button"
            className="close-rating-btn"
            onClick={onClose}
            disabled={submitting}
          >
            <XIcon size={18} />
          </button>
        </header>

        {submitted ? (
          <div className="rating-success-state">
            <div className="success-icon-pulse">
              <CheckCircleIcon size={44} />
            </div>
            <h4>Thank You For Your Review!</h4>
            <p>
              Your verified rating has been securely recorded on Dr.{" "}
              {appointment.doctor_name}&apos;s profile.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rating-modal-body">
            {/* DOCTOR & CONSULTATION DOSSIER STRIP */}
            <div className="rating-doctor-strip">
              <div className="doctor-avatar-circle">
                {appointment.doctor_name
                  ? appointment.doctor_name.charAt(0).toUpperCase()
                  : "D"}
              </div>
              <div className="doctor-strip-info">
                <strong>Dr. {appointment.doctor_name}</strong>
                <span>{appointment.specialization || "Clinical Specialist"}</span>
                <div className="consultation-meta-row">
                  <span className={`mode-badge ${isOnline ? "online" : "offline"}`}>
                    {isOnline ? (
                      <>
                        <VideoIcon size={12} /> Telehealth Online
                      </>
                    ) : (
                      <>
                        <HospitalIcon size={12} /> In-Person Clinic Visit
                      </>
                    )}
                  </span>
                  {appointment.appointment_date && (
                    <span className="date-badge">
                      Date: {appointment.appointment_date}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="rating-error-banner">
                {error}
              </div>
            )}

            {/* STAR RATING INTERACTIVE SELECTOR */}
            <div className="rating-stars-section">
              <label className="rating-section-label">SELECT STAR RATING</label>
              <div className="stars-row">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isFilled = starValue <= activeStars;
                  return (
                    <button
                      type="button"
                      key={starValue}
                      className={`star-btn ${isFilled ? "filled" : "empty"}`}
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`${starValue} Stars`}
                    >
                      <StarIcon size={32} />
                    </button>
                  );
                })}
              </div>

              {/* SENTIMENT CALLOUT */}
              <div className="sentiment-display" style={{ borderColor: `${sentiment.color}40` }}>
                <span className="sentiment-tag" style={{ color: sentiment.color, background: `${sentiment.color}18` }}>
                  {activeStars} ★ {sentiment.label}
                </span>
                <span className="sentiment-desc">{sentiment.desc}</span>
              </div>
            </div>

            {/* QUICK FEEDBACK CHIPS */}
            <div className="quick-tags-section">
              <label className="rating-section-label">COMPLIMENTS & HIGHLIGHTS (OPTIONAL)</label>
              <div className="tags-container">
                {QUICK_TAGS.map((tag) => {
                  const isSelected = reviewText.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      className={`rating-tag-chip ${isSelected ? "selected" : ""}`}
                      onClick={() => handleTagClick(tag)}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* WRITTEN REVIEW FEEDBACK */}
            <div className="rating-textarea-section">
              <div className="textarea-label-row">
                <label className="rating-section-label" htmlFor="reviewNotes">
                  DETAILED PATIENT REVIEW (OPTIONAL)
                </label>
                <span className="char-count">{reviewText.length}/500</span>
              </div>
              <textarea
                id="reviewNotes"
                rows={3}
                maxLength={500}
                placeholder="Share your experience with Dr.'s consultation, diagnosis explanation, bedside manner, or treatment advice..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
            </div>

            {/* CLINICAL TRUST BADGE */}
            <div className="rating-trust-footer">
              <ShieldCheckIcon size={14} />
              <span>Verified patient review linked to official appointment #{appointment.id}</span>
            </div>

            {/* ACTION BUTTONS */}
            <div className="rating-actions-bar">
              {canSkip ? (
                <button
                  type="button"
                  className="btn-skip-rating"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Skip for Now
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-cancel-rating"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                className="btn-submit-rating"
                disabled={submitting}
              >
                {submitting ? "Submitting Review..." : "Submit Patient Review"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
