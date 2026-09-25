import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PatientMedicalRecords.css";

function PatientMedicalRecords() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    async function fetchRecords() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:5000/api/consultations/patient",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load medical records."
          );
        }

        setRecords(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Medical records error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    if (!token) {
      setError("Please login to view your medical records.");
      setLoading(false);
      return;
    }

    fetchRecords();
  }, [token]);

  return (
    <div className="medical-records-page">

      {/* HEADER */}
      <header className="medical-records-header">
        <div>
          <h1>My Medical Records</h1>

          <p>
            View your previous consultation records,
            prescriptions and doctor's notes.
          </p>
        </div>

        <button
          className="back-medical-btn"
          onClick={() =>
            navigate("/patient-dashboard")
          }
        >
          ← Back to Dashboard
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="medical-records-container">

        {/* LOADING */}
        {loading && (
          <div className="medical-records-status">
            <div className="medical-loading-icon">
              ⏳
            </div>

            <p>
              Loading your medical records...
            </p>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="medical-records-error">
            <div className="medical-error-icon">
              ⚠️
            </div>

            <p>{error}</p>

            <button
              onClick={() =>
                navigate("/patient-dashboard")
              }
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {/* NO RECORDS */}
        {!loading &&
          !error &&
          records.length === 0 && (
            <div className="empty-medical-records">

              <div className="medical-empty-icon">
                📋
              </div>

              <h2>No Medical Records Yet</h2>

              <p>
                Your consultation records will appear
                here after you complete a consultation
                with a doctor.
              </p>

              <button
                onClick={() =>
                  navigate("/find-doctor")
                }
              >
                Find a Doctor
              </button>

            </div>
          )}

        {/* MEDICAL RECORDS */}
        {!loading &&
          !error &&
          records.length > 0 && (
            <section className="medical-records-list">

              {records.map((record) => (
                <article
                  className="medical-record-card"
                  key={record.id}
                >

                  {/* DOCTOR INFORMATION */}
                  <div className="medical-record-header">

                    <div className="doctor-record-avatar">
                      {record.doctor_name
                        ?.charAt(0)
                        .toUpperCase() || "D"}
                    </div>

                    <div className="doctor-record-info">

                      <h2>
                        Dr. {record.doctor_name ||
                          "Doctor"}
                      </h2>

                      <p>
                        {record.specialization ||
                          "Specialization not provided"}
                      </p>

                      {record.hospital && (
                        <span>
                          🏥 {record.hospital}
                        </span>
                      )}

                    </div>

                    <div className="record-date">

                      <strong>
                        {record.appointment_date ||
                          "Date not available"}
                      </strong>

                      <span>
                        {record.appointment_time ||
                          "Time not available"}
                      </span>

                    </div>

                  </div>

                  {/* MEDICAL INFORMATION */}
                  <div className="record-content">

                    {/* DIAGNOSIS */}
                    <div className="record-section">
                      <h3>Diagnosis</h3>

                      <p>
                        {record.diagnosis ||
                          "No diagnosis provided."}
                      </p>
                    </div>

                    {/* PRESCRIPTION */}
                    <div className="record-section">
                      <h3>Prescription</h3>

                      <p>
                        {record.prescription ||
                          "No prescription provided."}
                      </p>
                    </div>

                    {/* DOCTOR NOTES */}
                    <div className="record-section">
                      <h3>Doctor's Notes</h3>

                      <p>
                        {record.doctor_notes ||
                          "No additional notes provided."}
                      </p>
                    </div>

                    {/* FOLLOW-UP */}
                    {record.follow_up_date && (
                      <div className="follow-up-section">

                        <strong>
                          📅 Follow-up Date
                        </strong>

                        <span>
                          {record.follow_up_date}
                        </span>

                      </div>
                    )}

                  </div>

                </article>
              ))}

            </section>
          )}

      </main>
    </div>
  );
}

export default PatientMedicalRecords;