import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DoctorProfile.css";
import { API_URL } from "../config";

function DoctorProfile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [formData, setFormData] = useState({
    specialization: "",
    qualification: "",
    experience: "",
    consultation_fee: "",
    hospital: "",
    bio: "",
    availability: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch(
          `${API_URL}/doctors/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Failed to load profile");
          return;
        }

        setFormData({
          specialization: data.specialization || "",
          qualification: data.qualification || "",
          experience: data.experience || "",
          consultation_fee: data.consultation_fee || "",
          hospital: data.hospital || "",
          bio: data.bio || "",
          availability: data.availability || "",
        });
      } catch (error) {
        setError("Unable to connect to the backend");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [token]);

  function handleChange(event) {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");
    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/doctors/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update profile");
        return;
      }

      setMessage("Doctor profile updated successfully");
    } catch (error) {
      setError("Unable to connect to the backend");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="profile-loading">Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div>
            <span className="profile-label">MediCare+</span>
            <h1>Doctor Profile</h1>
            <p>
              Add your professional information so patients can
              understand your expertise.
            </p>
          </div>

          <button
            className="back-button"
            onClick={() => navigate("/doctor-dashboard")}
          >
            ← Dashboard
          </button>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>Professional Information</h2>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="specialization">
                  Specialization
                </label>

                <input
                  id="specialization"
                  name="specialization"
                  type="text"
                  placeholder="e.g. Cardiologist"
                  value={formData.specialization}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="qualification">
                  Qualification
                </label>

                <input
                  id="qualification"
                  name="qualification"
                  type="text"
                  placeholder="e.g. MBBS, MD"
                  value={formData.qualification}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="experience">
                  Experience in Years
                </label>

                <input
                  id="experience"
                  name="experience"
                  type="number"
                  min="0"
                  placeholder="e.g. 5"
                  value={formData.experience}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="consultation_fee">
                  Consultation Fee
                </label>

                <input
                  id="consultation_fee"
                  name="consultation_fee"
                  type="number"
                  min="0"
                  placeholder="e.g. 500"
                  value={formData.consultation_fee}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="hospital">
                  Hospital / Clinic
                </label>

                <input
                  id="hospital"
                  name="hospital"
                  type="text"
                  placeholder="Enter hospital or clinic name"
                  value={formData.hospital}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="availability">
                  Availability
                </label>

                <input
                  id="availability"
                  name="availability"
                  type="text"
                  placeholder="e.g. Monday to Friday, 10 AM - 4 PM"
                  value={formData.availability}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="bio">
                  About You
                </label>

                <textarea
                  id="bio"
                  name="bio"
                  rows="5"
                  placeholder="Write a short professional introduction..."
                  value={formData.bio}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {error && <p className="profile-error">{error}</p>}
          {message && <p className="profile-success">{message}</p>}

          <button
            type="submit"
            className="save-profile-button"
            disabled={saving}
          >
            {saving ? "Saving Profile..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default DoctorProfile;