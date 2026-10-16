
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PatientMedicalRecords.css";
import {
  CalendarIcon,
  FileTextIcon,
  HospitalIcon,
  PillIcon,
  PrinterIcon,
} from "../components/Icons";
import { API_URL } from "../config";

function parsePrescription(value) {
  if (!value || typeof value !== "string") {
    return { medicines: [], legacyText: "" };
  }

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return {
        medicines: parsed.filter(
          (medicine) =>
            medicine && typeof medicine === "object"
        ),
        legacyText: "",
      };
    }
  } catch {
    // Older records may contain ordinary text, not JSON.
  }

  return { medicines: [], legacyText: value };
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

function printPrescription(record) {
  const { medicines, legacyText } = parsePrescription(
    record.prescription
  );

  const medicineRows = medicines
    .map(
      (medicine, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(medicine.name)}</td>
          <td>${escapeHtml(medicine.dosage)}</td>
          <td>${escapeHtml(medicine.frequency)}</td>
          <td>${escapeHtml(medicine.duration)}</td>
          <td>${escapeHtml(medicine.instructions || "—")}</td>
        </tr>
      `
    )
    .join("");

  const prescriptionContent = medicines.length
    ? `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Medicine</th>
            <th>Dosage</th>
            <th>Frequency</th>
            <th>Duration</th>
            <th>Instructions</th>
          </tr>
        </thead>
        <tbody>${medicineRows}</tbody>
      </table>
    `
    : `<p class="prescription-text">${escapeHtml(
        legacyText || "No prescription provided."
      )}</p>`;

  const printWindow = window.open("", "_blank", "width=900,height=700");

  if (!printWindow) {
    alert("Please allow pop-ups to print or save your prescription.");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Prescription - ${escapeHtml(record.doctor_name)}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #1e293b;
            margin: 36px;
            line-height: 1.5;
          }

          h1, h2 { color: #155e75; }
          h1 { margin-bottom: 4px; }
          .subtitle { color: #64748b; margin-top: 0; }
          .section {
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px solid #dbe3ec;
          }

          .details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 20px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }

          th, td {
            border: 1px solid #cbd5e1;
            padding: 9px;
            text-align: left;
            vertical-align: top;
            overflow-wrap: anywhere;
          }

          th { background: #f1f5f9; }
          .prescription-text { white-space: pre-wrap; }
          .disclaimer {
            margin-top: 28px;
            font-size: 12px;
            color: #64748b;
          }

          @media print {
            body { margin: 12mm; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>MediCare+</h1>
        <p class="subtitle">Consultation & Prescription Record</p>

        <div class="section">
          <h2>Doctor Details</h2>
          <p><strong>Doctor:</strong> Dr. ${escapeHtml(record.doctor_name || "Doctor")}</p>
          <p><strong>Specialization:</strong> ${escapeHtml(record.specialization || "Not provided")}</p>
          <p><strong>Hospital:</strong> ${escapeHtml(record.hospital || "Not provided")}</p>
        </div>

        <div class="section">
          <h2>Consultation Details</h2>
          <div class="details">
            <p><strong>Appointment date:</strong> ${escapeHtml(record.appointment_date || "Not available")}</p>
            <p><strong>Appointment time:</strong> ${escapeHtml(record.appointment_time || "Not available")}</p>
            <p><strong>Record created:</strong> ${escapeHtml(record.created_at || "Not available")}</p>
            <p><strong>Follow-up:</strong> ${escapeHtml(record.follow_up_date || "Not scheduled")}</p>
          </div>
        </div>

        <div class="section">
          <h2>Diagnosis</h2>
          <p class="prescription-text">${escapeHtml(record.diagnosis || "No diagnosis provided.")}</p>
        </div>

        <div class="section">
          <h2>Prescription</h2>
          ${prescriptionContent}
        </div>

        <div class="section">
          <h2>Doctor's Notes</h2>
          <p class="prescription-text">${escapeHtml(record.doctor_notes || "No additional notes provided.")}</p>
        </div>

        <p class="disclaimer">
          Keep this record for reference. Follow the prescribing doctor's
          instructions and contact a qualified healthcare professional if
          you have questions about your medicines.
        </p>

        <script>
          window.onload = function () {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

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
          `${API_URL}/consultations/patient`,
          {
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
      } catch (fetchError) {
        console.error("Medical records error:", fetchError);
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    }

    if (!token) {
      setError("Please log in to view your medical records.");
      setLoading(false);
      return;
    }

    fetchRecords();
  }, [token]);

  return (
    <div className="medical-records-page">
      <header className="medical-records-header">
        <div>
          <h1>My Medical Records</h1>
          <p>
            View your consultation records, prescriptions and doctor's notes.
          </p>
        </div>

        <button
          className="back-medical-btn"
          onClick={() => navigate("/patient-dashboard")}
        >
          ← Back to Dashboard
        </button>
      </header>

      <main className="medical-records-container">
        {loading && (
          <div className="medical-records-status">
            <div className="medical-loading-icon">⏳</div>
            <p>Loading your medical records...</p>
          </div>
        )}

        {!loading && error && (
          <div className="medical-records-error">
            <div className="medical-error-icon">⚠️</div>
            <p>{error}</p>
            <button onClick={() => navigate("/patient-dashboard")}>
              Back to Dashboard
            </button>
          </div>
        )}

        {!loading && !error && records.length === 0 && (
          <div className="empty-medical-records">
            <div className="medical-empty-icon">
              <FileTextIcon size={36} />
            </div>
            <h2>No Medical Records Yet</h2>
            <p>
              Your consultation records will appear here after a doctor
              saves a consultation for you.
            </p>
            <button onClick={() => navigate("/find-doctor")}>
              Find a Doctor
            </button>
          </div>
        )}

        {!loading && !error && records.length > 0 && (
          <section className="medical-records-list">
            {records.map((record) => {
              const { medicines, legacyText } = parsePrescription(
                record.prescription
              );

              return (
                <article className="medical-record-card" key={record.id}>
                  <div className="medical-record-header">
                    <div className="doctor-record-avatar">
                      {record.doctor_name?.charAt(0).toUpperCase() || "D"}
                    </div>

                    <div className="doctor-record-info">
                      <h2>Dr. {record.doctor_name || "Doctor"}</h2>
                      <p>
                        {record.specialization ||
                          "Specialization not provided"}
                      </p>

                      {record.hospital && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <HospitalIcon size={13} /> {record.hospital}
                        </span>
                      )}
                    </div>

                    <div className="record-date">
                      <strong>
                        {record.appointment_date || "Date not available"}
                      </strong>
                      <span>
                        {record.appointment_time || "Time not available"}
                      </span>
                    </div>
                  </div>

                  <div className="record-content">
                    <div className="record-section">
                      <h3>Diagnosis</h3>
                      <p>{record.diagnosis || "No diagnosis provided."}</p>
                    </div>

                    <div className="record-section prescription-record-section">
                      <h3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <PillIcon size={18} /> Prescription
                      </h3>

                      {medicines.length > 0 ? (
                        <div className="prescription-table-wrapper">
                          <table className="prescription-table">
                            <thead>
                              <tr>
                                <th>Medicine</th>
                                <th>Dosage</th>
                                <th>Frequency</th>
                                <th>Duration</th>
                                <th>Instructions</th>
                              </tr>
                            </thead>

                            <tbody>
                              {medicines.map((medicine, index) => (
                                <tr key={`${record.id}-${index}`}>
                                  <td>{medicine.name || "—"}</td>
                                  <td>{medicine.dosage || "—"}</td>
                                  <td>{medicine.frequency || "—"}</td>
                                  <td>{medicine.duration || "—"}</td>
                                  <td>{medicine.instructions || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="legacy-prescription">
                          {legacyText || "No prescription provided."}
                        </p>
                      )}
                    </div>

                    <div className="record-section">
                      <h3>Doctor's Notes</h3>
                      <p>
                        {record.doctor_notes ||
                          "No additional notes provided."}
                      </p>
                    </div>

                    {record.follow_up_date && (
                      <div className="follow-up-section">
                        <strong style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <CalendarIcon size={14} /> Follow-up Date
                        </strong>
                        <span>{record.follow_up_date}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      className="print-prescription-btn"
                      onClick={() => printPrescription(record)}
                    >
                      <PrinterIcon size={16} />
                      <span>Print / Save as PDF</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

export default PatientMedicalRecords;
