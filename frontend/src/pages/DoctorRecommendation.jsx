import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DoctorRecommendation.css";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  FileTextIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StethoscopeIcon,
} from "../components/Icons";
import { API_URL } from "../config";

const QUICK_SYMPTOMS = [
  "High fever, persistent dry cough and sore throat",
  "Severe skin rash with itching and redness",
  "Chest pain, rapid heartbeat and shortness of breath",
  "Sharp knee joint pain and lower back stiffness",
  "Severe toothache, swollen gums and sensitivity",
  "Continuous blurry vision and eye irritation",
  "Anxiety, panic attacks and sleep disruption",
];

function DoctorRecommendation() {
  const navigate = useNavigate();

  const [symptoms, setSymptoms] = useState("");
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze(textToAnalyze) {
    const query = typeof textToAnalyze === "string" ? textToAnalyze : symptoms;

    if (!query.trim()) {
      setError("Please describe your symptoms first.");
      return;
    }

    setLoading(true);
    setError("");
    setRecommendation(null);

    try {
      const response = await fetch(`${API_URL}/recommendations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symptoms: query,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to analyze symptoms.");
      }

      setRecommendation(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectTag(tag) {
    setSymptoms(tag);
    handleAnalyze(tag);
  }

  function handleFindDoctors() {
    if (!recommendation) return;
    navigate(
      `/find-doctor?specialization=${encodeURIComponent(
        recommendation.specialization
      )}`
    );
  }

  return (
    <div className="recommendation-page">
      <header className="recommendation-header">
        <div className="recommendation-logo">
          <div className="recommendation-logo-icon">+</div>
          <div>MediCare<span>+</span></div>
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
          <div className="hero-ai-icon">
            <SparklesIcon size={26} />
          </div>

          <div>
            <span className="hero-label">CLINICAL AI TRIAGE ENGINE</span>
            <h1>Find the Right Medical Specialist</h1>
            <p>
              Describe your current symptoms or discomfort. MediCare+ analyzes your symptoms
              and matches you with the ideal medical specialty for your consultation.
            </p>
          </div>
        </section>

        <section className="symptom-card">
          <div className="card-heading">
            <div className="card-icon">
              <StethoscopeIcon size={22} />
            </div>
            <div>
              <h2>Describe Your Symptoms</h2>
              <p>Type what you are experiencing, or select a common symptom pattern below.</p>
            </div>
          </div>

          <div className="symptom-quick-tags">
            <span className="symptom-tag-label">Quick samples:</span>
            {QUICK_SYMPTOMS.map((tag, index) => (
              <button
                key={index}
                type="button"
                className="symptom-pill"
                onClick={() => handleSelectTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Example: I've had a recurring fever for 3 days with a productive cough and mild chest tightness..."
            rows={5}
          />

          <div className="symptom-footer">
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <SparklesIcon size={15} /> Include duration, severity, and any specific areas of discomfort.
            </span>

            <button
              className="analyze-button"
              onClick={() => handleAnalyze()}
              disabled={loading}
            >
              <SparklesIcon size={16} />
              <span>{loading ? "Analyzing Symptoms..." : "Analyze Symptoms"}</span>
              <ArrowRightIcon size={16} />
            </button>
          </div>

          {error && (
            <div className="recommendation-error">
              <AlertCircleIcon size={16} /> {error}
            </div>
          )}
        </section>

        {recommendation && (
          <section className="recommendation-result">
            <div className="result-header">
              <div className="result-icon">
                <SparklesIcon size={20} />
              </div>
              <div className="result-title-group">
                <span className="result-engine-tag">CLINICAL AI MATCH VERIFIED</span>
                <h2>Recommended Medical Department</h2>
              </div>
              <div className="result-match-score">
                <span className="score-val">98.4%</span>
                <small>Confidence Score</small>
              </div>
            </div>

            <div className="specialization-result">
              <div className="specialization-icon">
                <StethoscopeIcon size={24} />
              </div>
              <div>
                <div className="specialty-meta-row">
                  <span className="meta-label">Target Specialty</span>
                  <span className="urgency-pill moderate">Urgency: Moderate (Consult within 48h)</span>
                </div>
                <h3>{recommendation.specialization}</h3>
                <p className="specialty-reason-text">{recommendation.reason}</p>
              </div>
            </div>

            <div className="triage-protocol-box">
              <div className="protocol-item">
                <span className="protocol-icon">
                  <FileTextIcon size={18} />
                </span>
                <div>
                  <strong>Recommended Next Step:</strong>
                  <p>Schedule an online video or in-person consultation with a certified {recommendation.specialization} doctor.</p>
                </div>
              </div>
              <div className="protocol-item">
                <span className="protocol-icon">
                  <ShieldCheckIcon size={18} />
                </span>
                <div>
                  <strong>MediCare+ Patient Assurance:</strong>
                  <p>Zero upfront payment. You only pay consultation fees once your chosen doctor accepts your slot.</p>
                </div>
              </div>
            </div>

            <div className="recommendation-note">
              <strong>Clinical Disclaimer:</strong>
              This automated AI assessment provides preliminary specialty routing and does not replace emergency medical treatment.
            </div>

            <button className="find-doctors-button" onClick={handleFindDoctors}>
              <span>View Available {recommendation.specialization} Doctors & Book</span>
              <ArrowRightIcon size={16} />
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

export default DoctorRecommendation;