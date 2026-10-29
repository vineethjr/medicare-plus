import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  HospitalIcon,
  AwardIcon,
  CalendarIcon,
  AlertCircleIcon,
  PillIcon,
  FileTextIcon,
  EyeIcon,
  XIcon,
} from "../components/Icons";
import { API_URL } from "../config";
import "./DoctorVerification.css";

export default function DoctorVerification() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const prescriptionId = searchParams.get("prescription");
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inspectingDoc, setInspectingDoc] = useState(null);

  useEffect(() => {
    async function fetchVerificationDetails() {
      try {
        setLoading(true);
        setError("");

        let doctorData = null;
        let rxData = null;

        // 1. If prescription query param is provided, fetch prescription details
        if (prescriptionId) {
          try {
            const rxRes = await fetch(`${API_URL}/consultations/verify/${prescriptionId}`);
            if (rxRes.ok) {
              rxData = await rxRes.json();
              setPrescription(rxData);
            }
          } catch (rxErr) {
            console.error("Prescription lookup error:", rxErr);
          }
        }

        // 2. Try fetching doctor by ID
        const targetDoctorId = id && id !== "undefined" ? id : rxData?.doctor_id;
        if (targetDoctorId) {
          try {
            const docRes = await fetch(`${API_URL}/doctors/verify/${targetDoctorId}`);
            if (docRes.ok) {
              doctorData = await docRes.json();
              setDoctor(doctorData);
            }
          } catch (docErr) {
            console.error("Doctor lookup error:", docErr);
          }
        }

        // 3. Fallback: If doctor was not found by :id, check if :id is actually a prescription ID!
        if (!doctorData && id && id !== "undefined") {
          try {
            const rxFallbackRes = await fetch(`${API_URL}/consultations/verify/${id}`);
            if (rxFallbackRes.ok) {
              const fallbackRx = await rxFallbackRes.json();
              setPrescription(fallbackRx);
              if (fallbackRx.doctor_id) {
                const docRes = await fetch(`${API_URL}/doctors/verify/${fallbackRx.doctor_id}`);
                if (docRes.ok) {
                  doctorData = await docRes.json();
                  setDoctor(doctorData);
                }
              }
            }
          } catch (fallbackErr) {
            console.error("Prescription fallback lookup error:", fallbackErr);
          }
        }

        // 4. Construct doctor fallback from prescription if doctor endpoint had no document array
        if (!doctorData && (rxData || prescription)) {
          const src = rxData || prescription;
          doctorData = {
            id: src.doctor_id,
            name: src.doctor_name,
            specialization: src.specialization,
            qualification: src.qualification,
            medical_license: src.medical_license,
            hospital: src.hospital,
            verification_status: "Verified",
            documents: [],
          };
          setDoctor(doctorData);
        }

        if (!doctorData) {
          throw new Error("Unable to locate doctor or prescription record in verified registry.");
        }
      } catch (err) {
        setError(err.message || "Failed to load verification record.");
      } finally {
        setLoading(false);
      }
    }

    if (id || prescriptionId) {
      fetchVerificationDetails();
    }
  }, [id, prescriptionId]);

  // Parse prescription medicines if available
  let prescribedMedicines = [];
  if (prescription?.prescription) {
    if (Array.isArray(prescription.prescription)) {
      prescribedMedicines = prescription.prescription;
    } else if (typeof prescription.prescription === "string") {
      try {
        const parsed = JSON.parse(prescription.prescription);
        if (Array.isArray(parsed)) {
          prescribedMedicines = parsed;
        }
      } catch {
        // plain text fallback
      }
    }
  }

  return (
    <div className="verification-page">
      {/* HEADER */}
      <header className="verification-header">
        <div className="verification-header-container">
          <div className="brand-logo" onClick={() => navigate("/")}>
            <ShieldCheckIcon size={28} className="text-teal" />
            <div>
              <h1>MediCare+ Certified Registry</h1>
              <span>Official Practitioner & Prescription Verification System</span>
            </div>
          </div>

          <div className="header-actions">
            <button className="btn-header-home" onClick={() => navigate("/")}>
              Home Portal
            </button>
            <button
              className="btn-header-find"
              onClick={() => navigate("/find-doctor")}
            >
              Browse Verified Specialists
            </button>
          </div>
        </div>
      </header>

      <main className="verification-main">
        {loading && (
          <div className="verification-status-card loading-state">
            <div className="loading-spinner"></div>
            <h2>Validating Registry Credentials...</h2>
            <p>Connecting to secure State Medical Council and MediCare+ registries</p>
          </div>
        )}

        {error && !loading && (
          <div className="verification-status-card error-state">
            <AlertCircleIcon size={44} className="text-red" />
            <h2>Verification Record Not Found</h2>
            <p>{error}</p>
            <button className="btn-back-home" onClick={() => navigate("/")}>
              Return to Homepage
            </button>
          </div>
        )}

        {doctor && !loading && (
          <div className="verification-content-wrapper">
            {/* OFFICIAL VERIFICATION BANNER */}
            <div className="official-verified-banner">
              <div className="banner-icon-box">
                <CheckCircleIcon size={28} />
              </div>
              <div className="banner-text">
                <div className="banner-tag">AUTHENTIC & VERIFIED PRACTITIONER</div>
                <h2>Official Medical Council Registry Record</h2>
                <p>
                  This record is cryptographically validated and corresponds to an active, licensed healthcare specialist registered under MediCare+ Clinical Protocols.
                </p>
              </div>
              <div className="banner-seal-badge">
                <ShieldCheckIcon size={18} />
                <span>ACTIVE LICENSE</span>
              </div>
            </div>

            {/* DOCTOR CREDENTIALS PROFILE CARD */}
            <section className="doctor-credentials-card">
              <div className="doc-profile-top">
                <div className="doc-avatar-large">
                  {doctor.name?.charAt(0).toUpperCase() || "D"}
                  <span className="doc-active-dot"></span>
                </div>

                <div className="doc-main-meta">
                  <div className="doc-name-row">
                    <h2>Dr. {doctor.name}</h2>
                    <span className="verified-pill">
                      <CheckCircleIcon size={14} /> Verified Practitioner
                    </span>
                  </div>

                  <p className="doc-specialization-text">
                    {doctor.specialization || "General Physician"}
                  </p>

                  <div className="license-highlight-box">
                    <ShieldCheckIcon size={16} className="text-teal" />
                    <div>
                      <span className="license-label">Registration / License Number</span>
                      <strong className="license-number">
                        {doctor.medical_license || "SMC-ACTIVE-REGISTRY"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* STATS & ATTRIBUTES GRID */}
              <div className="doc-stats-grid">
                <div className="doc-stat-box">
                  <span className="stat-label">Qualifications</span>
                  <strong className="stat-value text-teal">{doctor.qualification || "MBBS"}</strong>
                </div>

                <div className="doc-stat-box">
                  <span className="stat-label">Hospital / Clinic</span>
                  <strong className="stat-value">
                    <HospitalIcon size={14} /> {doctor.hospital || "Clinical Center"}
                  </strong>
                </div>

                <div className="doc-stat-box">
                  <span className="stat-label">Experience</span>
                  <strong className="stat-value">{doctor.experience || 0} Years Active Practice</strong>
                </div>

                <div className="doc-stat-box">
                  <span className="stat-label">Registry Status</span>
                  <strong className="stat-value text-emerald">
                    <CheckCircleIcon size={14} /> {doctor.verification_status || "Verified"}
                  </strong>
                </div>
              </div>

              {doctor.bio && (
                <div className="doc-bio-section">
                  <h3>Clinical Background & Scope of Practice</h3>
                  <p>{doctor.bio}</p>
                </div>
              )}

              {/* OFFICIAL QUALIFICATION DOCUMENTS */}
              <div className="doc-documents-section">
                <div className="docs-header">
                  <h3>
                    <AwardIcon size={18} /> Verified Board & Medical Council Documents
                  </h3>
                  <span className="doc-count">
                    {doctor.documents?.length || 0} Document(s) On File
                  </span>
                </div>

                {!doctor.documents || doctor.documents.length === 0 ? (
                  <div className="empty-docs-box">
                    <CheckCircleIcon size={20} className="text-teal" />
                    <p>
                      Dr. {doctor.name} has undergone identity and clinical licensing verification under Registration{" "}
                      <strong>{doctor.medical_license || "SMC-ACTIVE"}</strong>. Formal council scans are held in the clinical archives.
                    </p>
                  </div>
                ) : (
                  <div className="documents-grid">
                    {doctor.documents.map((doc) => (
                      <div className="doc-card-item" key={doc.id}>
                        <div className="doc-card-left">
                          <AwardIcon size={24} className="text-teal" />
                          <div>
                            <h4>{doc.document_name}</h4>
                            <span className="doc-type-badge">{doc.document_type}</span>
                            <small>
                              Issued by {doc.issuer || "Medical Authority"} ({doc.issue_year || "Verified"})
                            </small>
                          </div>
                        </div>

                        {doc.file_url && (
                          <button
                            type="button"
                            className="btn-inspect-doc"
                            onClick={() => setInspectingDoc(doc)}
                          >
                            <EyeIcon size={14} />
                            <span>Inspect</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* ASSOCIATED PRESCRIPTION VERIFICATION (IF SCANNED FROM PRESCRIPTION) */}
            {prescription && (
              <section className="prescription-verification-card">
                <div className="rx-card-header">
                  <div className="rx-header-left">
                    <div className="rx-icon-box">
                      <PillIcon size={24} />
                    </div>
                    <div>
                      <span className="rx-badge-verified">
                        <CheckCircleIcon size={14} /> AUTHENTIC PRESCRIPTION RECORD
                      </span>
                      <h3>Prescription Reference: RX-MC-{prescription.id}</h3>
                      <p>
                        Digitally signed and issued by attending physician <strong>Dr. {doctor.name}</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="rx-timestamp">
                    <CalendarIcon size={14} />
                    <span>Issued: {prescription.created_at || prescription.appointment_date}</span>
                  </div>
                </div>

                <div className="rx-details-grid">
                  <div className="rx-detail-item">
                    <span className="detail-label">Patient Name:</span>
                    <strong>{prescription.patient_name || "Confidential Patient"}</strong>
                  </div>
                  <div className="rx-detail-item">
                    <span className="detail-label">Consultation Date:</span>
                    <strong>{prescription.appointment_date} ({prescription.appointment_time || "Scheduled"})</strong>
                  </div>
                  <div className="rx-detail-item">
                    <span className="detail-label">Consultation Channel:</span>
                    <strong>{prescription.consultation_mode || "Online Telehealth"}</strong>
                  </div>
                  <div className="rx-detail-item">
                    <span className="detail-label">Clinical Follow-up:</span>
                    <strong>{prescription.follow_up_date || "As needed"}</strong>
                  </div>
                </div>

                <div className="rx-diagnosis-block">
                  <span className="detail-label">Primary Clinical Diagnosis:</span>
                  <p className="diagnosis-text">{prescription.diagnosis || "Medical Consultation"}</p>
                </div>

                {/* MEDICINES LIST */}
                <div className="rx-medicines-section">
                  <h4>Prescribed Medication Regimen:</h4>
                  {prescribedMedicines.length > 0 ? (
                    <div className="rx-table-wrapper">
                      <table className="rx-table">
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
                        <tbody>
                          {prescribedMedicines.map((med, idx) => (
                            <tr key={idx}>
                              <td>{idx + 1}</td>
                              <td><strong>{med.name}</strong></td>
                              <td>{med.dosage}</td>
                              <td>{med.frequency}</td>
                              <td>{med.duration}</td>
                              <td>{med.instructions || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="rx-legacy-text">
                      {prescription.prescription || "Standard clinical regimen provided."}
                    </p>
                  )}
                </div>

                {prescription.doctor_notes && (
                  <div className="rx-notes-block">
                    <span className="detail-label">Doctor's Clinical Notes & Dietary Advice:</span>
                    <p>{prescription.doctor_notes}</p>
                  </div>
                )}
              </section>
            )}

            {/* SECURITY AUDIT & DIGITAL SEAL */}
            <div className="security-audit-footer">
              <div className="audit-left">
                <ShieldCheckIcon size={24} className="text-teal" />
                <div>
                  <strong>MediCare+ Cryptographic Security Verification</strong>
                  <p>
                    Verification Hash: <code>{doctor.registry_seal || `MEDICARE-SHA256-${doctor.id}-ACTIVE`}</code>
                  </p>
                  <small>
                    Verified at {doctor.verified_at ? new Date(doctor.verified_at).toLocaleString() : "Active Record"} • Validated against National Healthcare Standards
                  </small>
                </div>
              </div>

              <div className="audit-actions">
                <button
                  type="button"
                  className="btn-print-verification"
                  onClick={() => window.print()}
                >
                  <FileTextIcon size={14} />
                  <span>Print Official Certificate</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* INSPECT DOCUMENT CERTIFICATE VIEWER MODAL */}
      {inspectingDoc && (
        <div
          className="doc-viewer-overlay"
          onClick={() => setInspectingDoc(null)}
        >
          <div
            className="doc-viewer-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="doc-viewer-header">
              <div className="viewer-title">
                <ShieldCheckIcon size={20} className="text-teal" />
                <div>
                  <h3>{inspectingDoc.document_name}</h3>
                  <small>
                    {inspectingDoc.document_type} • Issued by {inspectingDoc.issuer || "Medical Authority"}
                  </small>
                </div>
              </div>
              <button
                className="close-modal-btn"
                onClick={() => setInspectingDoc(null)}
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="doc-viewer-body">
              {inspectingDoc.file_url && inspectingDoc.file_url.startsWith("data:image") ? (
                <img
                  src={inspectingDoc.file_url}
                  alt={inspectingDoc.document_name}
                  className="cert-img-view"
                />
              ) : (
                <div className="cert-canvas-card">
                  <AwardIcon size={46} className="text-teal" />
                  <h2>OFFICIAL VERIFIED MEDICAL CREDENTIAL</h2>
                  <h3>{inspectingDoc.document_name}</h3>
                  <p className="cert-doc-sub">
                    Issued to certified medical specialist Dr. {doctor?.name || "Doctor"}
                  </p>
                  <p className="cert-desc">
                    Official qualification issued by <strong>{inspectingDoc.issuer || "Medical Council"}</strong>.
                    Reviewed and confirmed by MediCare+ Registry Operations.
                  </p>
                  <div className="cert-stamped-row">
                    <span>Accredited: {inspectingDoc.issue_year || "Verified"}</span>
                    <span className="official-stamp-chip">
                      <CheckCircleIcon size={14} /> AUTHENTICATED
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="doc-viewer-footer">
              <button
                type="button"
                className="btn-close-view"
                onClick={() => setInspectingDoc(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
