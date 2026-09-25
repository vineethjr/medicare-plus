import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./DoctorConsultation.css";

function DoctorConsultation() {
  const location = useLocation();
  const navigate = useNavigate();

  const appointment = location.state?.appointment;

  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  if (!appointment) {
    return (
      <div className="consultation-page">
        <div className="consultation-error-card">
          <h2>Appointment not found</h2>

          <p>
            Please open the consultation from the
            completed appointments page.
          </p>

          <button
            onClick={() =>
              navigate("/doctor-appointments")
            }
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "http://localhost:5000/api/consultations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            appointment_id: appointment.id,
            diagnosis,
            prescription,
            doctor_notes: doctorNotes,
            follow_up_date: followUpDate,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save consultation."
        );
      }

      setSuccess(
        "Consultation record saved successfully."
      );

      setTimeout(() => {
        navigate("/doctor-appointments");
      }, 1500);
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="consultation-page">
      <header className="consultation-header">
        <div>
          <h1>Doctor Consultation</h1>

          <p>
            Add diagnosis and medical information for
            this consultation.
          </p>
        </div>

        <button
          className="back-consultation-btn"
          onClick={() =>
            navigate("/doctor-appointments")
          }
        >
          ← Back to Appointments
        </button>
      </header>

      <main className="consultation-container">
        {/* PATIENT INFORMATION */}

        <section className="patient-consultation-card">
          <div className="consultation-patient-avatar">
            {appointment.patient_name
              ?.charAt(0)
              .toUpperCase() || "P"}
          </div>

          <div>
            <h2>{appointment.patient_name}</h2>

            <p>{appointment.patient_email}</p>

            <div className="appointment-info">
              <span>
                📅 {appointment.appointment_date}
              </span>

              <span>
                🕐 {appointment.appointment_time}
              </span>
            </div>
          </div>
        </section>

        {/* CONSULTATION FORM */}

        <section className="consultation-form-card">
          <h2>Medical Consultation Details</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="diagnosis">
                Diagnosis
              </label>

              <textarea
                id="diagnosis"
                value={diagnosis}
                onChange={(event) =>
                  setDiagnosis(event.target.value)
                }
                placeholder="Enter the patient's diagnosis..."
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="prescription">
                Prescription
              </label>

              <textarea
                id="prescription"
                value={prescription}
                onChange={(event) =>
                  setPrescription(event.target.value)
                }
                placeholder="Enter prescribed medicines and dosage instructions..."
                rows="5"
              />
            </div>

            <div className="form-group">
              <label htmlFor="doctor-notes">
                Doctor Notes
              </label>

              <textarea
                id="doctor-notes"
                value={doctorNotes}
                onChange={(event) =>
                  setDoctorNotes(event.target.value)
                }
                placeholder="Add additional observations or medical notes..."
                rows="5"
              />
            </div>

            <div className="form-group">
              <label htmlFor="follow-up-date">
                Follow-up Date
              </label>

              <input
                id="follow-up-date"
                type="date"
                value={followUpDate}
                onChange={(event) =>
                  setFollowUpDate(event.target.value)
                }
              />
            </div>

            {error && (
              <div className="consultation-error">
                {error}
              </div>
            )}

            {success && (
              <div className="consultation-success">
                {success}
              </div>
            )}

            <button
              className="save-consultation-btn"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save Consultation Record"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default DoctorConsultation;