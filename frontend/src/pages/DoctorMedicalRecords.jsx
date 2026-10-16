import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DoctorMedicalRecords.css";
import { API_URL } from "../config";

function DoctorMedicalRecords() {
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
          `${API_URL}/consultations/doctor`,
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
            data.message ||
              "Failed to load patient records."
          );
        }

        setRecords(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(
          "Doctor medical records error:",
          error
        );

        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    if (!token) {
      setError("Please login to access patient records.");
      setLoading(false);
      return;
    }

    fetchRecords();
  }, [token]);

  return (
    <div className="doctor-records-page">

      {/* HEADER */}

      <header className="doctor-records-header">

        <div>
          <span className="records-eyebrow">
            MEDICARE+ / PATIENT DATA
          </span>

          <h1>
            Patient Records
          </h1>

          <p>
            Review consultation history,
            diagnoses and prescriptions.
          </p>
        </div>

        <button
          className="records-back-btn"
          onClick={() =>
            navigate("/doctor-dashboard")
          }
        >
          ← Dashboard
        </button>

      </header>

      {/* CONTENT */}

      <main className="doctor-records-container">

        {/* LOADING */}

        {loading && (
          <div className="records-state">
            <div className="records-loader">
              +
            </div>

            <h3>
              Loading patient records...
            </h3>

            <p>
              Securely retrieving consultation data.
            </p>
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="records-state error-state">

            <div className="state-icon">
              ⚠
            </div>

            <h3>
              Unable to load records
            </h3>

            <p>
              {error}
            </p>

            <button
              onClick={() =>
                navigate("/doctor-dashboard")
              }
            >
              Return to Dashboard
            </button>

          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          records.length === 0 && (
            <div className="records-state">

              <div className="state-icon">
                ▣
              </div>

              <h3>
                No Consultation Records
              </h3>

              <p>
                Completed patient consultations
                will appear here.
              </p>

              <button
                onClick={() =>
                  navigate("/doctor-appointments")
                }
              >
                View Appointments
              </button>

            </div>
          )}

        {/* RECORDS */}

        {!loading &&
          !error &&
          records.length > 0 && (
            <section className="doctor-records-list">

              <div className="records-summary">

                <div>
                  <span>
                    CONSULTATIONS
                  </span>

                  <strong>
                    {records.length}
                  </strong>
                </div>

                <p>
                  Patient consultation records
                  available in your account.
                </p>

              </div>

              {records.map((record) => (
                <article
                  className="doctor-record-card"
                  key={record.id}
                >

                  {/* CARD HEADER */}

                  <div className="doctor-record-card-header">

                    <div className="patient-record-avatar">
                      {record.patient_name
                        ?.charAt(0)
                        .toUpperCase() || "P"}
                    </div>

                    <div className="patient-record-info">

                      <span className="record-label">
                        PATIENT
                      </span>

                      <h2>
                        {record.patient_name ||
                          "Patient"}
                      </h2>

                      <p>
                        {record.patient_email ||
                          "Email unavailable"}
                      </p>

                    </div>

                    <div className="consultation-date">

                      <span>
                        CONSULTATION
                      </span>

                      <strong>
                        {record.appointment_date}
                      </strong>

                      <small>
                        {record.appointment_time}
                      </small>

                    </div>

                  </div>

                  {/* RECORD BODY */}

                  <div className="doctor-record-body">

                    <div className="record-information-grid">

                      {/* DIAGNOSIS */}

                      <div className="doctor-record-section">

                        <div className="record-section-title">
                          <span>01</span>
                          Diagnosis
                        </div>

                        <p>
                          {record.diagnosis ||
                            "No diagnosis provided."}
                        </p>

                      </div>

                      {/* PRESCRIPTION */}

                      <div className="doctor-record-section">

                        <div className="record-section-title">
                          <span>02</span>
                          Prescription
                        </div>

                        <p>
                          {record.prescription ||
                            "No prescription provided."}
                        </p>

                      </div>

                      {/* NOTES */}

                      <div className="doctor-record-section full-width">

                        <div className="record-section-title">
                          <span>03</span>
                          Doctor Notes
                        </div>

                        <p>
                          {record.doctor_notes ||
                            "No additional notes provided."}
                        </p>

                      </div>

                    </div>

                    {/* FOLLOW UP */}

                    {record.follow_up_date && (
                      <div className="doctor-follow-up">

                        <div>
                          <span>
                            FOLLOW-UP
                          </span>

                          <strong>
                            {record.follow_up_date}
                          </strong>
                        </div>

                        <div className="follow-up-icon">
                          →
                        </div>

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

export default DoctorMedicalRecords;