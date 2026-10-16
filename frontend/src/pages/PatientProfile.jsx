import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PatientProfile.css";
import {
  ActivityIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  DoctorIcon,
  DropletIcon,
  FileTextIcon,
  HeartPulseIcon,
  LogOutIcon,
  PillIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserIcon,
} from "../components/Icons";
import { API_URL } from "../config";

const COMMON_ALLERGIES = [
  "No Known Allergies",
  "Penicillin",
  "Peanuts & Tree Nuts",
  "Latex",
  "Sulfa Drugs",
  "Aspirin / NSAIDs",
  "Shellfish",
  "Pollen / Hay Fever",
];

const COMMON_CONDITIONS = [
  "None",
  "Hypertension (High BP)",
  "Type 2 Diabetes",
  "Asthma",
  "Hypothyroidism",
  "Cardiovascular Disease",
  "Migraine",
  "Acid Reflux (GERD)",
];

function PatientProfile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    age: "",
    gender: "",
    blood_group: "",
    height: "",
    weight: "",
    allergies: "",
    chronic_conditions: "",
    current_medications: "",
    past_surgeries: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relation: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Load Patient Profile
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/patient/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (res.ok && data) {
          setFormData((prev) => ({
            ...prev,
            ...data,
            age: data.age != null ? String(data.age) : "",
            height: data.height != null ? String(data.height) : "",
            weight: data.weight != null ? String(data.weight) : "",
            allergies: data.allergies || "",
            chronic_conditions: data.chronic_conditions || "",
            current_medications: data.current_medications || "",
            past_surgeries: data.past_surgeries || "",
            emergency_contact_name: data.emergency_contact_name || "",
            emergency_contact_phone: data.emergency_contact_phone || "",
            emergency_contact_relation: data.emergency_contact_relation || "",
          }));
        }
      } catch (err) {
        console.error("Failed to fetch patient profile:", err);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadProfile();
    } else {
      navigate("/login");
    }
  }, [token, navigate]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleTagToggle(field, tag) {
    const current = formData[field] ? formData[field].split(",").map((s) => s.trim()) : [];
    let updated;
    if (tag === "No Known Allergies" || tag === "None") {
      updated = [tag];
    } else {
      const filtered = current.filter((item) => item !== "No Known Allergies" && item !== "None");
      if (filtered.includes(tag)) {
        updated = filtered.filter((item) => item !== tag);
      } else {
        updated = [...filtered, tag];
      }
    }
    setFormData((prev) => ({ ...prev, [field]: updated.join(", ") }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch(`${API_URL}/patient/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          text: "Medical & physical profile updated successfully! Doctors can now review your health dossier.",
          type: "success",
        });
      } else {
        setMessage({
          text: data.message || "Failed to update profile.",
          type: "error",
        });
      }
    } catch (err) {
      setMessage({
        text: "Server error occurred while saving profile.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  // Calculate BMI
  const heightM = parseFloat(formData.height) / 100;
  const weightKg = parseFloat(formData.weight);
  let bmi = null;
  let bmiCategory = "Unknown";
  let bmiColor = "#94a3b8";

  if (heightM > 0 && weightKg > 0) {
    bmi = (weightKg / (heightM * heightM)).toFixed(1);
    if (bmi < 18.5) {
      bmiCategory = "Underweight";
      bmiColor = "#38bdf8";
    } else if (bmi < 25) {
      bmiCategory = "Optimal Health";
      bmiColor = "#2dd4bf";
    } else if (bmi < 30) {
      bmiCategory = "Overweight";
      bmiColor = "#fbbf24";
    } else {
      bmiCategory = "Obese";
      bmiColor = "#f87171";
    }
  }

  return (
    <div className="patient-profile-page">
      {/* SIDEBAR */}
      <aside className="profile-sidebar">
        <div className="profile-sidebar-brand" onClick={() => navigate("/patient-dashboard")}>
          <div className="profile-brand-icon">+</div>
          <div>
            MediCare<span>+</span>
            <small>PATIENT CLINICAL HUB</small>
          </div>
        </div>

        <nav className="profile-sidebar-nav">
          <button className="sidebar-btn" onClick={() => navigate("/patient-dashboard")}>
            <ActivityIcon size={18} />
            <span>Dashboard</span>
          </button>
          <button className="sidebar-btn" onClick={() => navigate("/find-doctor")}>
            <DoctorIcon size={18} />
            <span>Find a Doctor</span>
          </button>
          <button className="sidebar-btn" onClick={() => navigate("/doctor-recommendation")}>
            <SparklesIcon size={18} />
            <span>AI Symptom Checker</span>
          </button>
          <button className="sidebar-btn" onClick={() => navigate("/patient-appointments")}>
            <CalendarIcon size={18} />
            <span>My Appointments</span>
          </button>
          <button className="sidebar-btn" onClick={() => navigate("/patient-medical-records")}>
            <FileTextIcon size={18} />
            <span>Medical Records</span>
          </button>
          <button className="sidebar-btn active" onClick={() => navigate("/patient-profile")}>
            <UserIcon size={18} />
            <span>Patient Profile</span>
          </button>
        </nav>

        <div className="profile-sidebar-footer">
          <div className="profile-shield-badge">
            <ShieldCheckIcon size={16} />
            <span>Encrypted Health Record</span>
          </div>
          <button className="profile-logout-btn" onClick={handleLogout}>
            <LogOutIcon size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="profile-main">
        <header className="profile-header">
          <div className="profile-header-text">
            <span className="profile-eyebrow">
              <span className="live-dot"></span> PATIENT MEDICAL DOSSIER
            </span>
            <h1>Physical & Clinical Profile</h1>
            <p>
              Complete your health metrics, known allergies, and medical history. Verified doctors review this dossier when confirming your appointments and during live video consultations.
            </p>
          </div>

          <div className="profile-user-badge">
            <div className="profile-avatar">
              {formData.name?.charAt(0).toUpperCase() || "P"}
            </div>
            <div>
              <strong>{formData.name || "Patient"}</strong>
              <span>{formData.email}</span>
            </div>
          </div>
        </header>

        {message.text && (
          <div className={`profile-alert ${message.type}`}>
            {message.type === "success" ? (
              <CheckCircleIcon size={18} />
            ) : (
              <AlertCircleIcon size={18} />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {loading ? (
          <div className="profile-loading-box">
            <HeartPulseIcon size={32} className="pulse-spin" />
            <p>Loading your medical dossier...</p>
          </div>
        ) : (
          <form className="profile-form-grid" onSubmit={handleSubmit}>
            {/* PHYSICAL TELEMETRY SECTION */}
            <div className="profile-section-card">
              <div className="section-title-bar">
                <div className="section-icon-box">
                  <HeartPulseIcon size={20} />
                </div>
                <div>
                  <h3>Physical Telemetry & Vitals</h3>
                  <small>Basic biometric measurements used for clinical dosing and triage</small>
                </div>
              </div>

              <div className="form-row-three">
                <div className="input-group">
                  <label htmlFor="age">Age (Years) *</label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    min="1"
                    max="120"
                    placeholder="e.g. 28"
                    value={formData.age}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="gender">Biological Sex / Gender *</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="blood_group">Blood Group *</label>
                  <select
                    id="blood_group"
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleChange}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+ (A Positive)</option>
                    <option value="A-">A- (A Negative)</option>
                    <option value="B+">B+ (B Positive)</option>
                    <option value="B-">B- (B Negative)</option>
                    <option value="AB+">AB+ (AB Positive)</option>
                    <option value="AB-">AB- (AB Negative)</option>
                    <option value="O+">O+ (O Positive)</option>
                    <option value="O-">O- (O Negative)</option>
                  </select>
                </div>
              </div>

              <div className="form-row-two">
                <div className="input-group">
                  <label htmlFor="height">Height (Centimeters)</label>
                  <input
                    type="number"
                    id="height"
                    name="height"
                    min="50"
                    max="260"
                    placeholder="e.g. 175"
                    value={formData.height}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="weight">Weight (Kilograms)</label>
                  <input
                    type="number"
                    id="weight"
                    name="weight"
                    min="20"
                    max="300"
                    step="0.5"
                    placeholder="e.g. 72"
                    value={formData.weight}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* LIVE BMI COMPUTED HUD */}
              <div className="bmi-telemetry-hud">
                <div className="bmi-hud-left">
                  <ActivityIcon size={20} />
                  <div>
                    <strong>Computed Body Mass Index (BMI)</strong>
                    <small>Calculated automatically based on your height and weight metrics</small>
                  </div>
                </div>
                <div className="bmi-hud-right">
                  <span className="bmi-number">{bmi ? `${bmi} kg/m²` : "--"}</span>
                  <span className="bmi-badge" style={{ backgroundColor: `${bmiColor}22`, color: bmiColor, borderColor: bmiColor }}>
                    {bmiCategory}
                  </span>
                </div>
              </div>
            </div>

            {/* CLINICAL ALLERGIES & CHRONIC CONDITIONS */}
            <div className="profile-section-card">
              <div className="section-title-bar">
                <div className="section-icon-box danger">
                  <AlertCircleIcon size={20} />
                </div>
                <div>
                  <h3>Clinical Alerts: Allergies & Chronic Conditions</h3>
                  <small>Critical safety information displayed prominently to attending physicians</small>
                </div>
              </div>

              {/* ALLERGIES */}
              <div className="input-group">
                <label>Known Allergies (Click to toggle quick tags or specify below)</label>
                <div className="quick-pill-cloud">
                  {COMMON_ALLERGIES.map((allergy) => {
                    const isSelected = formData.allergies.includes(allergy);
                    return (
                      <button
                        type="button"
                        key={allergy}
                        className={`quick-pill ${isSelected ? "selected danger" : ""}`}
                        onClick={() => handleTagToggle("allergies", allergy)}
                      >
                        {isSelected && <CheckIcon size={12} />}
                        <span>{allergy}</span>
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  name="allergies"
                  placeholder="e.g. Penicillin, Peanuts, Pollen (or type custom allergies)"
                  value={formData.allergies}
                  onChange={handleChange}
                />
              </div>

              {/* CHRONIC CONDITIONS */}
              <div className="input-group" style={{ marginTop: "16px" }}>
                <label>Pre-existing Chronic Conditions</label>
                <div className="quick-pill-cloud">
                  {COMMON_CONDITIONS.map((cond) => {
                    const isSelected = formData.chronic_conditions.includes(cond);
                    return (
                      <button
                        type="button"
                        key={cond}
                        className={`quick-pill ${isSelected ? "selected warning" : ""}`}
                        onClick={() => handleTagToggle("chronic_conditions", cond)}
                      >
                        {isSelected && <CheckIcon size={12} />}
                        <span>{cond}</span>
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  name="chronic_conditions"
                  placeholder="e.g. Hypertension, Type 2 Diabetes (or type custom conditions)"
                  value={formData.chronic_conditions}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* MEDICATIONS & SURGICAL HISTORY */}
            <div className="profile-section-card">
              <div className="section-title-bar">
                <div className="section-icon-box teal">
                  <PillIcon size={20} />
                </div>
                <div>
                  <h3>Current Medications & Surgical History</h3>
                  <small>Ongoing pharmaceutical regimens and past surgical interventions</small>
                </div>
              </div>

              <div className="form-row-two">
                <div className="input-group">
                  <label htmlFor="current_medications">Ongoing Medications & Dosages</label>
                  <textarea
                    id="current_medications"
                    name="current_medications"
                    rows={4}
                    placeholder="e.g. Metformin 500mg (once daily after meals), Lisinopril 10mg (morning)"
                    value={formData.current_medications}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="past_surgeries">Past Surgeries or Major Hospitalizations</label>
                  <textarea
                    id="past_surgeries"
                    name="past_surgeries"
                    rows={4}
                    placeholder="e.g. Appendectomy (2020), Knee Arthroscopy (2023), No major surgeries"
                    value={formData.past_surgeries}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* EMERGENCY CONTACT DETAILS */}
            <div className="profile-section-card">
              <div className="section-title-bar">
                <div className="section-icon-box blue">
                  <ShieldCheckIcon size={20} />
                </div>
                <div>
                  <h3>Emergency Contact Protocol</h3>
                  <small>Designated contact person in the event of urgent clinical escalation</small>
                </div>
              </div>

              <div className="form-row-three">
                <div className="input-group">
                  <label htmlFor="emergency_contact_name">Contact Person Full Name</label>
                  <input
                    type="text"
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    placeholder="e.g. Sarah Jenkins"
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="emergency_contact_relation">Relationship</label>
                  <select
                    id="emergency_contact_relation"
                    name="emergency_contact_relation"
                    value={formData.emergency_contact_relation}
                    onChange={handleChange}
                  >
                    <option value="">Select Relationship</option>
                    <option value="Spouse">Spouse / Partner</option>
                    <option value="Parent">Parent / Guardian</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Son / Daughter</option>
                    <option value="Friend">Friend / Caregiver</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="emergency_contact_phone">Primary Emergency Phone *</label>
                  <input
                    type="tel"
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* SAVE BUTTON */}
            <div className="profile-submit-bar">
              <button
                type="submit"
                className="save-profile-btn"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <HeartPulseIcon size={18} className="pulse-spin" />
                    <span>Saving Health Dossier...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon size={18} />
                    <span>Save Patient Dossier</span>
                    <ArrowRightIcon size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

export default PatientProfile;
