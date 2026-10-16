
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./DoctorConsultation.css";
import {
  CalendarIcon,
  ClockIcon,
  PillIcon,
} from "../components/Icons";
import { API_URL } from "../config";

const createMedicine = () => ({
  id: `${Date.now()}-${Math.random()}`,
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
});

function DoctorConsultation() {
  const location = useLocation();
  const navigate = useNavigate();
  const appointment = location.state?.appointment;

  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState([createMedicine()]);
  const [doctorNotes, setDoctorNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token = localStorage.getItem("token");

  function updateMedicine(id, field, value) {
    setMedicines((current) =>
      current.map((medicine) =>
        medicine.id === id
          ? { ...medicine, [field]: value }
          : medicine
      )
    );
  }

  function addMedicine() {
    setMedicines((current) => [
      ...current,
      createMedicine(),
    ]);
  }

  function removeMedicine(id) {
    setMedicines((current) =>
      current.filter((medicine) => medicine.id !== id)
    );
  }

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
            onClick={() => navigate("/doctor-appointments")}
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!token) {
      setError("Please log in again to save this prescription.");
      return;
    }

    if (!diagnosis.trim()) {
      setError("Please enter the diagnosis.");
      return;
    }

    const completedMedicines = medicines.map((medicine) => ({
      name: medicine.name.trim(),
      dosage: medicine.dosage.trim(),
      frequency: medicine.frequency.trim(),
      duration: medicine.duration.trim(),
      instructions: medicine.instructions.trim(),
    }));

    if (
      completedMedicines.some(
        (medicine) =>
          !medicine.name ||
          !medicine.dosage ||
          !medicine.frequency ||
          !medicine.duration
      )
    ) {
      setError(
        "Complete the medicine name, dosage, frequency and duration for every medicine, or remove unused medicine rows."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/consultations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            appointment_id: appointment.id,
            diagnosis: diagnosis.trim(),
            prescription: JSON.stringify(completedMedicines),
            doctor_notes: doctorNotes.trim(),
            follow_up_date: followUpDate || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save consultation."
        );
      }

      setSuccess("Prescription and consultation saved successfully.");

      setTimeout(() => {
        navigate("/doctor-appointments");
      }, 1500);
    } catch (error) {
      setError(error.message || "Something went wrong.");
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
            Record the diagnosis and prepare the patient's prescription.
          </p>
        </div>

        <button
          type="button"
          className="back-consultation-btn"
          onClick={() => navigate("/doctor-appointments")}
        >
          ← Back to Appointments
        </button>
      </header>

      <main className="consultation-container">
        <section className="patient-consultation-card">
          <div className="consultation-patient-avatar">
            {appointment.patient_name?.charAt(0).toUpperCase() || "P"}
          </div>

          <div>
            <h2>{appointment.patient_name || "Patient"}</h2>
            <p>{appointment.patient_email || ""}</p>

            <div className="appointment-info">
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <CalendarIcon size={14} /> {appointment.appointment_date}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <ClockIcon size={14} /> {appointment.appointment_time}
              </span>
            </div>
          </div>
        </section>

        <section className="consultation-form-card">
          <h2>Medical Consultation Details</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="diagnosis">Diagnosis *</label>
              <textarea
                id="diagnosis"
                value={diagnosis}
                onChange={(event) => setDiagnosis(event.target.value)}
                placeholder="Enter the diagnosis..."
                rows={3}
                required
              />
            </div>

            <div className="prescription-builder">
              <div className="prescription-builder-header">
                <div>
                  <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <PillIcon size={18} /> Prescription
                  </h3>
                  <p>
                    Add the medicines prescribed for this patient.
                  </p>
                </div>

                <button
                  type="button"
                  className="add-medicine-btn"
                  onClick={addMedicine}
                >
                  + Add Medicine
                </button>
              </div>

              {medicines.map((medicine, index) => (
                <div className="medicine-card" key={medicine.id}>
                  <div className="medicine-card-header">
                    <h4>Medicine {index + 1}</h4>

                    {medicines.length > 1 && (
                      <button
                        type="button"
                        className="remove-medicine-btn"
                        onClick={() => removeMedicine(medicine.id)}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="medicine-fields">
                    <div className="form-group medicine-full-width">
                      <label htmlFor={`medicine-name-${medicine.id}`}>
                        Medicine Name *
                      </label>
                      <input
                        id={`medicine-name-${medicine.id}`}
                        value={medicine.name}
                        onChange={(event) =>
                          updateMedicine(medicine.id, "name", event.target.value)
                        }
                        placeholder="Enter medicine name"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={`dosage-${medicine.id}`}>
                        Dosage *
                      </label>
                      <input
                        id={`dosage-${medicine.id}`}
                        value={medicine.dosage}
                        onChange={(event) =>
                          updateMedicine(medicine.id, "dosage", event.target.value)
                        }
                        placeholder="e.g. 500 mg"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={`frequency-${medicine.id}`}>
                        Frequency *
                      </label>
                      <input
                        id={`frequency-${medicine.id}`}
                        value={medicine.frequency}
                        onChange={(event) =>
                          updateMedicine(medicine.id, "frequency", event.target.value)
                        }
                        placeholder="e.g. Twice daily"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={`duration-${medicine.id}`}>
                        Duration *
                      </label>
                      <input
                        id={`duration-${medicine.id}`}
                        value={medicine.duration}
                        onChange={(event) =>
                          updateMedicine(medicine.id, "duration", event.target.value)
                        }
                        placeholder="e.g. 5 days"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={`instructions-${medicine.id}`}>
                        Instructions
                      </label>
                      <input
                        id={`instructions-${medicine.id}`}
                        value={medicine.instructions}
                        onChange={(event) =>
                          updateMedicine(
                            medicine.id,
                            "instructions",
                            event.target.value
                          )
                        }
                        placeholder="e.g. Take after food"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label htmlFor="doctor-notes">Doctor Notes</label>
              <textarea
                id="doctor-notes"
                value={doctorNotes}
                onChange={(event) => setDoctorNotes(event.target.value)}
                placeholder="Additional observations or advice..."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="follow-up-date">Follow-up Date</label>
              <input
                id="follow-up-date"
                type="date"
                value={followUpDate}
                onChange={(event) => setFollowUpDate(event.target.value)}
              />
            </div>

            {error && (
              <div className="consultation-error" role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className="consultation-success" role="status">
                {success}
              </div>
            )}

            <button
              className="save-consultation-btn"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Consultation & Prescription"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default DoctorConsultation;
