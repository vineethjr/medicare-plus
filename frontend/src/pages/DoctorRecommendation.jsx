import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DoctorRecommendation.css";

function DoctorRecommendation() {
  const navigate = useNavigate();

  const [symptoms, setSymptoms] = useState("");
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    if (!symptoms.trim()) {
      setError("Please describe your symptoms first.");
      return;
    }

    setLoading(true);
    setError("");
    setRecommendation(null);

    try {
      const response = await fetch(
        "http://localhost:5000/api/recommendations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            symptoms,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to analyze symptoms."
        );
      }

      setRecommendation(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFindDoctors() {
    navigate(
      `/find-doctor?specialization=${encodeURIComponent(
        recommendation.specialization
      )}`
    );
  }

  return (
    <div className="recommendation-page">
      <header className="recommendation-header">
        <div>
          <div className="recommendation-logo">
            MediCare<span>+</span>
          </div>

          <p>AI-Assisted Doctor Recommendation</p>
        </div>

        <button
          className="recommendation-back"
          onClick={() => navigate("/patient-dashboard")}
        >
          ← Dashboard
        </button>
      </header>

      <main className="recommendation-container">
        <section className="recommendation-hero">
          <div className="hero-ai-icon">🤖</div>

          <div>
            <span className="hero-label">
              AI-ASSISTED HEALTHCARE
            </span>

            <h1>
              Find the Right Doctor
              <br />
              for Your Symptoms
            </h1>

            <p>
              Describe your symptoms and MediCare+ will
              suggest the most relevant medical
              specialization for your consultation.
            </p>
          </div>
        </section>

        <section className="symptom-card">
          <div className="card-heading">
            <div className="card-icon">🩺</div>

            <div>
              <h2>Describe Your Symptoms</h2>
              <p>
                Tell us what you're experiencing. You can
                describe multiple symptoms.
              </p>
            </div>
          </div>

          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Example: I have fever, cough and sore throat..."
            rows="7"
          />

          <div className="symptom-footer">
            <span>
              💡 Please provide as much detail as possible.
            </span>

            <button
              className="analyze-button"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? "Analyzing..." : "🤖 Analyze Symptoms"}
            </button>
          </div>

          {error && (
            <div className="recommendation-error">
              {error}
            </div>
          )}
        </section>

        {recommendation && (
          <section className="recommendation-result">
            <div className="result-header">
              <div className="result-icon">✨</div>

              <div>
                <span>AI RECOMMENDATION</span>
                <h2>Recommended Specialization</h2>
              </div>
            </div>

            <div className="specialization-result">
              <div className="specialization-icon">
                🩺
              </div>

              <div>
                <span>Based on your symptoms</span>

                <h3>
                  {recommendation.specialization}
                </h3>

                <p>{recommendation.reason}</p>
              </div>
            </div>

            <div className="recommendation-note">
              <strong>⚠️ Important:</strong>

              <span>
                This recommendation is for guidance only
                and does not constitute a medical diagnosis.
                Please consult a qualified healthcare
                professional.
              </span>
            </div>

            <button
              className="find-doctors-button"
              onClick={handleFindDoctors}
            >
              Find {recommendation.specialization}s →
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

export default DoctorRecommendation;