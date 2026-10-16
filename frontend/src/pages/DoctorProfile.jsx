import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ActivityIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  AwardIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  CreditCardIcon,
  DoctorIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  HeartPulseIcon,
  HomeIcon,
  HospitalIcon,
  LogOutIcon,
  PillIcon,
  PlusIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrashIcon,
  UploadIcon,
  UserIcon,
  XIcon,
} from "../components/Icons";
import { API_URL } from "../config";
import "./DoctorProfile.css";

const DOCUMENT_TYPES = [
  "Medical License / Registration",
  "Medical Degree (MBBS / MD / MS)",
  "Board Certification",
  "Clinical Fellowship",
  "Hospital Accreditation",
  "Other Credential",
];

function DoctorProfile() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [formData, setFormData] = useState({
    specialization: "",
    qualification: "",
    experience: "",
    consultation_fee: "",
    hospital: "",
    bio: "",
    availability: "",
    medical_license: "",
  });

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Document Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docForm, setDocForm] = useState({
    document_name: "",
    document_type: DOCUMENT_TYPES[0],
    issuer: "",
    issue_year: new Date().getFullYear().toString(),
    file_url: "",
    file_name: "",
  });

  // Document Viewer Modal State
  const [viewingDoc, setViewingDoc] = useState(null);
  const [docModalError, setDocModalError] = useState("");

  // Load Doctor Profile and Documents
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/doctors/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401 || data.sessionExpired) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            alert("Your session has expired. Please log in again.");
            navigate("/login");
            return;
          }
          setError(data.message || "Failed to load doctor profile.");
          return;
        }

        setFormData({
          specialization: data.specialization || "",
          qualification: data.qualification || "",
          experience: data.experience !== undefined ? String(data.experience) : "",
          consultation_fee: data.consultation_fee !== undefined ? String(data.consultation_fee) : "",
          hospital: data.hospital || "",
          bio: data.bio || "",
          availability: data.availability || "",
          medical_license: data.medical_license || "",
        });

        setDocuments(Array.isArray(data.documents) ? data.documents : []);
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Unable to connect to MediCare+ service. Please verify backend is running.");
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

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // Handle Profile Form Submit
  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/doctors/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || data.sessionExpired) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          alert("Your session has expired. Please log in again.");
          navigate("/login");
          return;
        }
        setError(data.message || "Failed to update profile.");
        return;
      }

      setMessage("Doctor profile updated successfully!");
      // Update cached user in localStorage if needed
      const updatedUser = { ...user, ...formData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("Save profile error:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Handle File Selection for Document Upload
  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("File is too large. Please select a file smaller than 8 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setDocForm((prev) => ({
        ...prev,
        file_url: e.target?.result || "",
        file_name: file.name,
        document_name: prev.document_name || file.name.replace(/\.[^/.]+$/, ""),
      }));
    };
    reader.readAsDataURL(file);
  }

  // Generate Sample Demo Certificate if user wants quick test
  function handleGenerateSampleCertificate(type) {
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = 800;
    sampleCanvas.height = 550;
    const ctx = sampleCanvas.getContext("2d");

    // Luxury certificate background
    ctx.fillStyle = "#0c181c";
    ctx.fillRect(0, 0, 800, 550);

    // Border
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, 760, 510);
    ctx.strokeStyle = "rgba(16, 185, 129, 0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 740, 490);

    // Text Header
    ctx.fillStyle = "#34d399";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("MEDICARE+ CLINICAL SPECIALIST REGISTRY", 400, 90);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px sans-serif";
    ctx.fillText("OFFICIAL CREDENTIAL & QUALIFICATION VERIFICATION CERTIFICATE", 400, 125);

    // Doctor Details
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(`Dr. ${user.name || "Medical Practitioner"}`, 400, 210);

    ctx.fillStyle = "#10b981";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(`${formData.specialization || "Clinical Specialist"} • ${formData.qualification || "MBBS, MD"}`, 400, 245);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "15px sans-serif";
    ctx.fillText(`License / Reg No: ${formData.medical_license || "MCI-2024-REG-9482"}`, 400, 290);
    ctx.fillText(`Affiliated Institution: ${formData.hospital || "National Health Network"}`, 400, 320);

    // Verification Seal
    ctx.fillStyle = "#064e3b";
    ctx.beginPath();
    ctx.arc(400, 410, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#34d399";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#6ee7b7";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("VERIFIED", 400, 405);
    ctx.fillText("CLINICAL", 400, 420);

    const generatedUrl = sampleCanvas.toDataURL("image/png");

    setDocForm((prev) => ({
      ...prev,
      document_name: type || "Medical Council License Certificate",
      document_type: type || "Medical License / Registration",
      issuer: "State Medical Council & Accreditation Board",
      issue_year: new Date().getFullYear().toString(),
      file_url: generatedUrl,
      file_name: `${(type || "Medical_License").replace(/\s+/g, "_")}.png`,
    }));
  }

  // Handle Document Upload Submit
  async function handleUploadDocument(event) {
    event.preventDefault();
    setDocModalError("");

    if (!docForm.document_name.trim()) {
      const err = "Please provide a document title.";
      setDocModalError(err);
      alert(err);
      return;
    }

    if (!docForm.file_url) {
      const err = "Please select a document file or click 'Generate Official Certificate'.";
      setDocModalError(err);
      alert(err);
      return;
    }

    setUploadingDoc(true);

    try {
      const res = await fetch(`${API_URL}/doctors/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(docForm),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 || data.sessionExpired) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          alert("Your session has expired. Please log in again.");
          navigate("/login");
          return;
        }
        const errorMsg = data.message || "Failed to upload qualification document.";
        setDocModalError(errorMsg);
        alert(errorMsg);
        return;
      }

      setDocuments((prev) => [data.document, ...prev]);
      setShowUploadModal(false);
      setDocForm({
        document_name: "",
        document_type: DOCUMENT_TYPES[0],
        issuer: "",
        issue_year: new Date().getFullYear().toString(),
        file_url: "",
        file_name: "",
      });
      setMessage("Qualification document uploaded and verified successfully!");
    } catch (err) {
      console.error("Document upload error:", err);
      const networkErr = "Failed to upload document. Please check connection.";
      setDocModalError(networkErr);
      alert(networkErr);
    } finally {
      setUploadingDoc(false);
    }
  }

  // Handle Document Delete
  async function handleDeleteDocument(docId) {
    if (!window.confirm("Are you sure you want to remove this qualification document?")) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/doctors/documents/${docId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 || data.sessionExpired) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          alert("Your session has expired. Please log in again.");
          navigate("/login");
          return;
        }
        alert(data.message || "Failed to delete document.");
        return;
      }

      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setMessage("Qualification document removed.");
    } catch (err) {
      console.error("Delete doc error:", err);
      alert("Failed to delete document.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  if (loading) {
    return (
      <div className="doc-profile-loading-screen">
        <div className="doc-pulse-spinner"></div>
        <p>Loading Doctor Clinical Profile & Credentials...</p>
      </div>
    );
  }

  return (
    <div className="doctor-profile-layout">
      {/* SIDEBAR NAVIGATION (Matching DoctorDashboard) */}
      <aside className="doctor-profile-sidebar">
        <div className="doc-sidebar-brand" onClick={() => navigate("/doctor-dashboard")}>
          <div className="doc-brand-icon">+</div>
          <div>
            MediCare<span>+</span>
            <small>DOCTOR COMMAND</small>
          </div>
        </div>

        <nav className="doc-sidebar-nav">
          <button
            className="doc-nav-item"
            onClick={() => navigate("/doctor-dashboard")}
          >
            <ActivityIcon size={18} />
            <span>Dashboard</span>
          </button>

          <button
            className="doc-nav-item"
            onClick={() => navigate("/doctor-appointments")}
          >
            <CalendarIcon size={18} />
            <span>Appointments</span>
          </button>

          <button
            className="doc-nav-item"
            onClick={() => navigate("/doctor-medical-records")}
          >
            <FileTextIcon size={18} />
            <span>Patient Records</span>
          </button>

          <button
            className="doc-nav-item active"
            onClick={() => navigate("/doctor-profile")}
          >
            <UserIcon size={18} />
            <span>Doctor Profile</span>
          </button>
        </nav>

        <div className="doc-sidebar-footer">
          <div className="doc-sidebar-user">
            <div className="doc-avatar-small">
              {user.name?.charAt(0).toUpperCase() || "D"}
            </div>
            <div className="doc-user-info">
              <span className="doc-user-name">Dr. {user.name || "Specialist"}</span>
              <span className="doc-user-role">{formData.specialization || "Physician"}</span>
            </div>
          </div>
          <button className="doc-logout-btn" onClick={handleLogout}>
            <LogOutIcon size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="doctor-profile-main">
        {/* HEADER */}
        <header className="doctor-profile-header">
          <div>
            <div className="doc-header-tag">
              <ShieldCheckIcon size={14} />
              <span>CLINICAL CREDENTIALS & LICENSING</span>
            </div>
            <h1>Doctor Profile & Verification</h1>
            <p>
              Manage your professional qualifications, license registry, practice fees, and official
              documents verifiable by patients in the Find Doctor portal.
            </p>
          </div>

          <div className="doc-header-actions">
            <span className="registry-verified-pill">
              <CheckCircleIcon size={14} /> Verified Registry Active
            </span>
            <button
              className="doc-back-dash-btn"
              onClick={() => navigate("/doctor-dashboard")}
            >
              ← Back to Dashboard
            </button>
          </div>
        </header>

        {/* NOTIFICATIONS */}
        {message && (
          <div className="doc-alert-banner success">
            <CheckCircleIcon size={18} />
            <span>{message}</span>
            <button onClick={() => setMessage("")} className="alert-close-btn">
              <XIcon size={14} />
            </button>
          </div>
        )}

        {error && (
          <div className="doc-alert-banner error">
            <AlertCircleIcon size={18} />
            <span>{error}</span>
            <button onClick={() => setError("")} className="alert-close-btn">
              <XIcon size={14} />
            </button>
          </div>
        )}

        {/* LIVE PATIENT PREVIEW BANNER */}
        <section className="doc-preview-card">
          <div className="preview-card-inner">
            <div className="preview-avatar">
              {user.name?.charAt(0).toUpperCase() || "D"}
              <span className="preview-online-dot"></span>
            </div>

            <div className="preview-info">
              <div className="preview-title-row">
                <h2>Dr. {user.name || "Doctor Name"}</h2>
                <span className="preview-verified-badge">
                  <ShieldCheckIcon size={13} /> MediCare+ Verified
                </span>
                {formData.medical_license && (
                  <span className="preview-license-tag">
                    Reg No: {formData.medical_license}
                  </span>
                )}
              </div>

              <div className="preview-specialty">
                <strong>{formData.specialization || "General Medicine / Specialist"}</strong>
                <span>•</span>
                <span>{formData.qualification || "MBBS"}</span>
                <span>•</span>
                <span>{formData.hospital || "Hospital / Medical Center"}</span>
              </div>

              <div className="preview-stats-row">
                <div className="preview-stat-item">
                  <span>Experience:</span>
                  <strong>{formData.experience || 0} Years</strong>
                </div>
                <div className="preview-stat-item">
                  <span>Consultation Fee:</span>
                  <strong className="text-emerald">₹{formData.consultation_fee || 500}</strong>
                </div>
                <div className="preview-stat-item">
                  <span>Verified Documents:</span>
                  <strong>{documents.length} on file</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FORM GRID */}
        <form onSubmit={handleSubmit} className="doc-profile-form">
          {/* SECTION 1: IDENTITY & REGISTRATION */}
          <section className="doc-form-card">
            <div className="card-header">
              <div className="card-icon-box">
                <DoctorIcon size={20} />
              </div>
              <div>
                <h3>Professional Identification & Licensing</h3>
                <p>Official medical registration and clinical credentials recognized by medical boards.</p>
              </div>
            </div>

            <div className="form-fields-grid">
              <div className="field-group">
                <label htmlFor="specialization">Medical Specialization *</label>
                <input
                  id="specialization"
                  name="specialization"
                  type="text"
                  placeholder="e.g. Cardiologist, Neurologist, General Physician"
                  value={formData.specialization}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="medical_license">
                  Medical Council Registration / License No. *
                </label>
                <input
                  id="medical_license"
                  name="medical_license"
                  type="text"
                  placeholder="e.g. MCI-2018-84920 or SMC-99214"
                  value={formData.medical_license}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="qualification">Educational Qualifications *</label>
                <input
                  id="qualification"
                  name="qualification"
                  type="text"
                  placeholder="e.g. MBBS, MD (Cardiology), FACC"
                  value={formData.qualification}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="hospital">Primary Hospital or Clinical Practice *</label>
                <input
                  id="hospital"
                  name="hospital"
                  type="text"
                  placeholder="e.g. Apollo Hospital, Department of Cardiology"
                  value={formData.hospital}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </section>

          {/* SECTION 2: PRACTICE ECONOMICS & HOURS */}
          <section className="doc-form-card">
            <div className="card-header">
              <div className="card-icon-box">
                <CreditCardIcon size={20} />
              </div>
              <div>
                <h3>Practice Economics & Clinical Schedule</h3>
                <p>Define consultation rates and standard patient availability.</p>
              </div>
            </div>

            <div className="form-fields-grid">
              <div className="field-group">
                <label htmlFor="consultation_fee">Consultation Fee (₹)</label>
                <div className="input-with-adornment">
                  <span className="adornment">₹</span>
                  <input
                    id="consultation_fee"
                    name="consultation_fee"
                    type="number"
                    min="0"
                    placeholder="e.g. 750"
                    value={formData.consultation_fee}
                    onChange={handleChange}
                  />
                </div>
                <small className="field-hint">
                  Patients pay only once you confirm their appointment booking.
                </small>
              </div>

              <div className="field-group">
                <label htmlFor="experience">Years of Clinical Experience</label>
                <input
                  id="experience"
                  name="experience"
                  type="number"
                  min="0"
                  placeholder="e.g. 8"
                  value={formData.experience}
                  onChange={handleChange}
                />
              </div>

              <div className="field-group full-span">
                <label htmlFor="availability">Weekly Consultation Schedule</label>
                <input
                  id="availability"
                  name="availability"
                  type="text"
                  placeholder="e.g. Monday - Friday, 10:00 AM - 04:00 PM (IST)"
                  value={formData.availability}
                  onChange={handleChange}
                />
              </div>
            </div>
          </section>

          {/* SECTION 3: CLINICAL BIOGRAPHY */}
          <section className="doc-form-card">
            <div className="card-header">
              <div className="card-icon-box">
                <FileTextIcon size={20} />
              </div>
              <div>
                <h3>Clinical Philosophy & Patient Bio</h3>
                <p>Detailed overview of your special interest areas, patient care philosophy, and achievements.</p>
              </div>
            </div>

            <div className="field-group full-span">
              <label htmlFor="bio">Professional Introduction & Focus Areas</label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                placeholder="Share your expertise, diagnostic methodologies, and areas of clinical focus with patients..."
                value={formData.bio}
                onChange={handleChange}
              />
            </div>
          </section>

          {/* SECTION 4: QUALIFICATION VERIFICATION DOCUMENTS */}
          <section className="doc-form-card documents-section">
            <div className="card-header-with-action">
              <div className="card-header">
                <div className="card-icon-box highlight">
                  <AwardIcon size={20} />
                </div>
                <div>
                  <div className="section-title-badge-row">
                    <h3>Supporting Qualification Documents</h3>
                    <span className="count-pill">{documents.length} Uploaded</span>
                  </div>
                  <p>
                    Upload medical degrees, council registration certificates, and fellowships.
                    Patients can verify these authentic documents on your public profile in Find Doctor.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="add-document-btn"
                onClick={() => {
                  setDocModalError("");
                  setShowUploadModal(true);
                }}
              >
                <PlusIcon size={16} />
                <span>Upload Document</span>
              </button>
            </div>

            {/* DOCUMENTS LIST */}
            {documents.length === 0 ? (
              <div className="no-docs-empty-state">
                <AwardIcon size={40} className="empty-icon" />
                <h4>No qualification documents uploaded yet</h4>
                <p>
                  Uploading your medical license and degree builds patient trust and enables the
                  "Verified Clinical Specialist" badge on your profile.
                </p>
                <button
                  type="button"
                  className="empty-upload-action"
                  onClick={() => {
                    setDocModalError("");
                    setShowUploadModal(true);
                  }}
                >
                  <UploadIcon size={16} /> Upload First Document
                </button>
              </div>
            ) : (
              <div className="documents-grid">
                {documents.map((doc) => (
                  <div className="doc-file-card" key={doc.id}>
                    <div className="doc-file-top">
                      <div className="doc-file-badge-icon">
                        <AwardIcon size={22} />
                      </div>
                      <div className="doc-file-meta">
                        <h4>{doc.document_name}</h4>
                        <span className="doc-type-pill">{doc.document_type}</span>
                      </div>
                    </div>

                    <div className="doc-file-details">
                      <div className="detail-row">
                        <span>Issuer:</span>
                        <strong>{doc.issuer || "Accreditation Board"}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Issued:</span>
                        <strong>{doc.issue_year || "Certified"}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Status:</span>
                        <span className="verified-status-tag">
                          <CheckCircleIcon size={12} /> Patient Visible
                        </span>
                      </div>
                    </div>

                    <div className="doc-file-actions">
                      <button
                        type="button"
                        className="btn-view-doc"
                        onClick={() => setViewingDoc(doc)}
                      >
                        <EyeIcon size={15} />
                        <span>Inspect Document</span>
                      </button>
                      <button
                        type="button"
                        className="btn-delete-doc"
                        onClick={() => handleDeleteDocument(doc.id)}
                        title="Delete Document"
                      >
                        <TrashIcon size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SUBMIT BUTTON */}
          <div className="form-submit-bar">
            <button
              type="submit"
              className="save-profile-btn"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="btn-spinner"></div>
                  <span>Saving Profile Changes...</span>
                </>
              ) : (
                <>
                  <CheckIcon size={18} />
                  <span>Save Complete Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      {/* UPLOAD DOCUMENT MODAL */}
      {showUploadModal && (
        <div className="doc-modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="doc-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="doc-modal-header">
              <div className="modal-title-with-icon">
                <div className="modal-icon-badge">
                  <UploadIcon size={20} />
                </div>
                <div>
                  <h3>Upload Qualification Document</h3>
                  <p>Document will be watermarked and displayed for patient verification.</p>
                </div>
              </div>
              <button
                className="close-modal-x"
                onClick={() => setShowUploadModal(false)}
              >
                <XIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="upload-doc-form">
              <div className="field-group">
                <label>Document Title *</label>
                <input
                  type="text"
                  placeholder="e.g. State Medical Council Registration Certificate"
                  value={docForm.document_name}
                  onChange={(e) =>
                    setDocForm({ ...docForm, document_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="modal-form-row">
                <div className="field-group">
                  <label>Document Category</label>
                  <select
                    value={docForm.document_type}
                    onChange={(e) =>
                      setDocForm({ ...docForm, document_type: e.target.value })
                    }
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-group">
                  <label>Year of Issue</label>
                  <input
                    type="text"
                    placeholder="e.g. 2018"
                    value={docForm.issue_year}
                    onChange={(e) =>
                      setDocForm({ ...docForm, issue_year: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="field-group">
                <label>Issuing Board / Medical Council</label>
                <input
                  type="text"
                  placeholder="e.g. National Medical Commission / Medical Council of India"
                  value={docForm.issuer}
                  onChange={(e) =>
                    setDocForm({ ...docForm, issuer: e.target.value })
                  }
                />
              </div>

              {/* FILE UPLOAD DROP AREA */}
              <div className="file-dropzone">
                <input
                  type="file"
                  id="doc-file-input"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <label htmlFor="doc-file-input" className="file-dropzone-label">
                  <UploadIcon size={28} />
                  {docForm.file_name ? (
                    <div className="selected-file-info">
                      <strong>Selected: {docForm.file_name}</strong>
                      <span>Click to choose a different file</span>
                    </div>
                  ) : (
                    <div>
                      <strong>Click to browse PDF or Image document</strong>
                      <span>Supports PNG, JPG, or PDF up to 8MB</span>
                    </div>
                  )}
                </label>

                <div className="quick-sample-separator">
                  <span>OR QUICK TEST</span>
                </div>

                <div className="quick-sample-buttons">
                  <button
                    type="button"
                    className="btn-sample-doc"
                    onClick={() =>
                      handleGenerateSampleCertificate("Medical Council License Certificate")
                    }
                  >
                    <AwardIcon size={14} /> Generate Official Medical License
                  </button>
                  <button
                    type="button"
                    className="btn-sample-doc"
                    onClick={() =>
                      handleGenerateSampleCertificate("MBBS & MD Specialist Degree")
                    }
                  >
                    <AwardIcon size={14} /> Generate MD Specialist Degree
                  </button>
                </div>
              </div>

              {/* PREVIEW OF SELECTED FILE */}
              {docForm.file_url && docForm.file_url.startsWith("data:image") && (
                <div className="file-thumb-preview">
                  <span>Selected Document Preview:</span>
                  <img src={docForm.file_url} alt="Document Preview" />
                </div>
              )}

              {docModalError && (
                <div className="doc-modal-error-banner">
                  <AlertCircleIcon size={16} />
                  <span>{docModalError}</span>
                </div>
              )}

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-confirm-upload"
                  disabled={uploadingDoc}
                >
                  {uploadingDoc ? "Uploading..." : "Save & Verify Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT INSPECTION MODAL */}
      {viewingDoc && (
        <div className="doc-modal-overlay" onClick={() => setViewingDoc(null)}>
          <div
            className="doc-viewer-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="doc-modal-header">
              <div className="modal-title-with-icon">
                <div className="modal-icon-badge">
                  <ShieldCheckIcon size={20} />
                </div>
                <div>
                  <h3>{viewingDoc.document_name}</h3>
                  <span className="doc-viewer-tag">
                    {viewingDoc.document_type} • Issued by {viewingDoc.issuer || "Accredited Body"} ({viewingDoc.issue_year || "Verified"})
                  </span>
                </div>
              </div>
              <button
                className="close-modal-x"
                onClick={() => setViewingDoc(null)}
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="doc-viewer-content">
              <div className="verification-watermark">
                <ShieldCheckIcon size={18} />
                <span>VERIFIED BY MEDICARE+ CLINICAL REGISTRY</span>
              </div>

              {viewingDoc.file_url && viewingDoc.file_url.startsWith("data:image") ? (
                <img
                  src={viewingDoc.file_url}
                  alt={viewingDoc.document_name}
                  className="full-cert-img"
                />
              ) : viewingDoc.file_url && viewingDoc.file_url.startsWith("data:application/pdf") ? (
                <iframe
                  src={viewingDoc.file_url}
                  title={viewingDoc.document_name}
                  className="full-cert-iframe"
                />
              ) : (
                <div className="cert-rendered-preview">
                  <div className="cert-border-outer">
                    <div className="cert-border-inner">
                      <div className="cert-crest">
                        <AwardIcon size={44} />
                      </div>
                      <h3>CERTIFICATE OF MEDICAL QUALIFICATION</h3>
                      <h4>{viewingDoc.document_name}</h4>
                      <p className="cert-recipient">
                        Awarded to: <strong>Dr. {user.name}</strong>
                      </p>
                      <p className="cert-text">
                        This credential verifies successful completion and board accreditation in{" "}
                        <strong>{formData.specialization || "Clinical Practice"}</strong> under license{" "}
                        <strong>{formData.medical_license || "SMC-VERIFIED"}</strong>.
                      </p>
                      <div className="cert-footer-meta">
                        <div>
                          <span>Issuing Authority</span>
                          <strong>{viewingDoc.issuer || "Medical Council"}</strong>
                        </div>
                        <div className="cert-verified-stamp">
                          <CheckCircleIcon size={16} /> VERIFIED
                        </div>
                        <div>
                          <span>Issue Year</span>
                          <strong>{viewingDoc.issue_year || "2024"}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="doc-viewer-footer">
              <span className="doc-hash-text">
                Registry ID: DOC-{viewingDoc.id}-SECURE-{viewingDoc.created_at?.slice(0, 10) || "VERIFIED"}
              </span>
              <button
                type="button"
                className="btn-close-viewer"
                onClick={() => setViewingDoc(null)}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorProfile;