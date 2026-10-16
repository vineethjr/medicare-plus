import { useState } from "react";
import { Link } from "react-router-dom";
import "./App.css";
import {
  ActivityIcon,
  ArrowRightIcon,
  BabyIcon,
  BoneIcon,
  BrainIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  DoctorIcon,
  DropletIcon,
  EyeIcon,
  FileTextIcon,
  HeartPulseIcon,
  HospitalIcon,
  LockIcon,
  LungsIcon,
  PillIcon,
  QrCodeIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  ToothIcon,
  TrendingUpIcon,
  UserIcon,
  VideoIcon,
} from "./components/Icons";

const PRESET_SYMPTOMS = [
  {
    id: "neuro",
    label: "Throbbing Migraine & Visual Aura",
    icon: BrainIcon,
    specialty: "Neurology & Neurovascular",
    urgency: "Moderate",
    confidence: "98.4%",
    doctor: "Dr. Alexander Reed, MD",
    fee: "₹650",
    recommendation: "Consult a neurologist for vascular migraine evaluation and cranial screening protocol.",
  },
  {
    id: "cardio",
    label: "Chest Heaviness & Palpitations",
    icon: HeartPulseIcon,
    specialty: "Cardiology & Vascular Medicine",
    urgency: "Urgent",
    confidence: "99.1%",
    doctor: "Dr. Sophia Patel, FACC",
    fee: "₹800",
    recommendation: "Requires immediate cardio-rhythm assessment, ECG telemetry check, and arterial pressure analysis.",
  },
  {
    id: "pulmo",
    label: "Persistent Dry Cough & Fever",
    icon: LungsIcon,
    specialty: "Pulmonology & Respiratory Care",
    urgency: "Moderate",
    confidence: "96.7%",
    doctor: "Dr. Vikram Sethi, MD",
    fee: "₹500",
    recommendation: "Viral respiratory evaluation recommended. Track oxygen saturation levels and temperature daily.",
  },
  {
    id: "ortho",
    label: "Sharp Knee Joint Pain & Stiffness",
    icon: BoneIcon,
    specialty: "Orthopedics & Joint Biomechanics",
    urgency: "Mild",
    confidence: "95.2%",
    doctor: "Dr. Marcus Thorne, MS Ortho",
    fee: "₹700",
    recommendation: "Orthopedic joint biomechanics, inflammation panel, and mobility evaluation recommended.",
  },
  {
    id: "derma",
    label: "Acute Skin Rash & Erythema",
    icon: PillIcon,
    specialty: "Dermatology & Immunology",
    urgency: "Mild",
    confidence: "97.5%",
    doctor: "Dr. Elena Vance, MD",
    fee: "₹550",
    recommendation: "Topical allergic dermatitis or inflammatory dermatosis. Avoid chemical irritants and harsh soaps.",
  },
];

const FEATURE_TABS = [
  {
    id: "payment",
    title: "100% Protected Payment",
    tagline: "Pay ONLY after your doctor confirms availability",
    icon: CreditCardIcon,
    badge: "Zero-Risk Patient Guarantee",
    description: "Traditional platforms deduct money before doctors even check their schedules. MediCare+ flips the model: slot reservations are 100% free. You only pay after your doctor reviews and confirms your appointment.",
    perks: [
      "Zero upfront booking fee — reserve slot at ₹0",
      "Pay securely via UPI, Cards, or Net Banking only after doctor confirmation",
      "Instant printable GST tax invoice & clinical receipt",
      "Guaranteed zero charge if a doctor reschedules or cancels",
    ],
  },
  {
    id: "ai",
    title: "Clinical AI Symptom Triage",
    tagline: "Advanced triaging engine before scheduling",
    icon: SparklesIcon,
    badge: "99.2% Clinical Precision",
    description: "Our neural triage engine analyzes your symptom description, identifies urgency tiers, and accurately routes you to the exact clinical specialist — avoiding unnecessary appointments and delays.",
    perks: [
      "Deep medical symptom comprehension & NLP analysis",
      "Tri-tier urgency classification (Mild / Moderate / Urgent)",
      "Direct 1-click specialist match with certified physicians",
      "100% private, anonymous, and encrypted session data",
    ],
  },
  {
    id: "telehealth",
    title: "Ultra-HD Video Telehealth",
    tagline: "High-definition virtual clinic in your browser",
    icon: VideoIcon,
    badge: "WebRTC E2EE Encrypted",
    description: "Experience low-latency, encrypted audio-video consultations with verified doctors. Features integrated in-call chat, screen sharing, prescription review, and automatic consultation room unlock after fee confirmation.",
    perks: [
      "1080p 60fps encrypted clinical video feed",
      "In-session secure chat drawer for reports & images",
      "Zero app installation required — works seamlessly in browser",
      "Real-time audio-visual connection telemetry",
    ],
  },
  {
    id: "records",
    title: "Instant Digital Prescriptions",
    tagline: "Legally certified medical records vault",
    icon: FileTextIcon,
    badge: "Official Digital Seal",
    description: "Doctors generate structured multi-medication digital prescriptions with dosage instructions and clinical advice. Prescriptions are cryptographically sealed with a verifiable QR stamp and stored securely forever.",
    perks: [
      "Structured dosage routines, intervals, and food instructions",
      "One-click print & PDF download in official medical format",
      "Pharmacy-ready QR verification for instant authentication",
      "Permanent historical health vault for long-term tracking",
    ],
  },
];

const SPECIALTY_LIST = [
  { name: "Cardiology", icon: HeartPulseIcon, count: "42 Specialists", desc: "Heart & Vascular" },
  { name: "Neurology", icon: BrainIcon, count: "36 Specialists", desc: "Brain & Nerves" },
  { name: "General Medicine", icon: DoctorIcon, count: "85 Specialists", desc: "Primary & Internal Care" },
  { name: "Pediatrics", icon: BabyIcon, count: "29 Specialists", desc: "Infant & Child Health" },
  { name: "Pulmonology", icon: LungsIcon, count: "34 Specialists", desc: "Lungs & Respiratory" },
  { name: "Orthopedics", icon: BoneIcon, count: "31 Specialists", desc: "Bones & Joints" },
  { name: "Dentistry", icon: ToothIcon, count: "24 Specialists", desc: "Oral & Dental Care" },
  { name: "Ophthalmology", icon: EyeIcon, count: "22 Specialists", desc: "Vision & Eye Care" },
];

function App() {
  const [activeTriage, setActiveTriage] = useState(PRESET_SYMPTOMS[0]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState(FEATURE_TABS[0].id);

  function handleSelectPreset(preset) {
    setIsAnalyzing(true);
    setTimeout(() => {
      setActiveTriage(preset);
      setIsAnalyzing(false);
    }, 320);
  }

  function handleCustomSearch(e) {
    e.preventDefault();
    if (!customSymptom.trim()) return;

    setIsAnalyzing(true);
    setTimeout(() => {
      setActiveTriage({
        id: "custom",
        label: customSymptom,
        icon: DoctorIcon,
        specialty: "Internal Medicine & General Care",
        urgency: "Moderate",
        confidence: "95.6%",
        doctor: "Dr. Alexander Reed, MD",
        fee: "₹500",
        recommendation: `Analysis for "${customSymptom}": Clinical review by a certified general physician is recommended to formulate a targeted diagnostic protocol.`,
      });
      setIsAnalyzing(false);
    }, 400);
  }

  const selectedFeature = FEATURE_TABS.find((t) => t.id === activeTab) || FEATURE_TABS[0];
  const ActiveTriageIcon = activeTriage.icon || BrainIcon;

  return (
    <div className="landing-container">
      {/* TOP LIVE NETWORK TICKER */}
      <div className="top-banner-ticker">
        <div className="ticker-inner">
          <span className="ticker-badge">
            <span className="ticker-dot"></span>
            LIVE NETWORK STATUS
          </span>
          <span className="ticker-text">
            <strong>Dr. Reed</strong> accepted consultation slot (2m ago) ·{" "}
            <strong>Dr. Patel</strong> available for HD video consultation ·{" "}
            <span className="ticker-highlight">
              <ShieldCheckIcon size={14} className="inline-icon" /> Guaranteed: Pay consultation fees only upon doctor confirmation.
            </span>
          </span>
        </div>
      </div>

      {/* NAVBAR */}
      <nav className="landing-navbar">
        <Link to="/" className="brand-logo">
          <div className="brand-icon-box">
            <span>+</span>
          </div>
          <div className="brand-name">
            MediCare<span>+</span>
          </div>
        </Link>

        <div className="landing-nav-links">
          <a href="#triage-demo">AI Symptom Triage</a>
          <a href="#features">Platform Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#specialties">Specialties</a>
        </div>

        <div className="nav-actions">
          <Link to="/login" className="btn-nav-login">
            Sign In
          </Link>
          <Link to="/register" className="btn-nav-signup">
            <span>Get Started</span>
            <ArrowRightIcon size={16} />
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="landing-hero">
        <div className="hero-glow-orb orb-teal"></div>
        <div className="hero-glow-orb orb-indigo"></div>

        <div className="hero-left">
          <div className="hero-tag">
            <span className="pulse-dot"></span>
            <span>NEXT-GEN TELEHEALTH & CLINICAL MANAGEMENT</span>
          </div>

          <h1 className="hero-title">
            Futuristic Healthcare. <br />
            <span className="gradient-text">Zero Upfront Risk.</span>
          </h1>

          <p className="hero-subtitle">
            Find verified medical specialists, run AI-guided symptom analysis, and attend
            ultra-HD encrypted video consultations. <strong>Pay the doctor's consultation fee only after your slot is confirmed.</strong>
          </p>

          <div className="hero-cta-group">
            <Link to="/register" className="btn-hero-primary">
              <span>Book Appointment (₹0 Upfront)</span>
              <ArrowRightIcon size={18} />
            </Link>
            <a href="#triage-demo" className="btn-hero-secondary">
              <SparklesIcon size={16} />
              <span>Test AI Symptom Demo</span>
            </a>
          </div>

          <div className="hero-social-proof">
            <div className="hero-proof-badges">
              <div className="proof-badge-item">
                <ShieldCheckIcon size={18} />
                <span>100% Protected Payments</span>
              </div>
              <div className="proof-badge-item">
                <StarIcon size={18} />
                <span>4.95 / 5 Rating</span>
              </div>
              <div className="proof-badge-item">
                <DoctorIcon size={18} />
                <span>500+ Verified Specialists</span>
              </div>
            </div>
          </div>
        </div>

        {/* HERO VISUAL TELEMETRY STACK */}
        <div className="hero-right">
          <div className="hero-visual-stack">
            {/* FLOATING LIVE VITALS TELEMETRY HUD */}
            <div className="floating-vitals-pill">
              <div className="vitals-icon-box">
                <HeartPulseIcon size={22} />
              </div>
              <div className="vitals-data">
                <div className="vitals-val">
                  <strong>74 BPM</strong>
                  <span className="vitals-tag">Normal Sinus</span>
                </div>
                <div className="vitals-sub">SpO2: 99% · BP: 118/78 mmHg · HR Stable</div>
              </div>
              <svg className="vitals-wave" viewBox="0 0 100 24">
                <path
                  d="M0 12 L28 12 L33 4 L38 20 L43 8 L48 16 L53 12 L100 12"
                  fill="none"
                  stroke="#2dd4bf"
                  strokeWidth="2.4"
                />
              </svg>
            </div>

            {/* MAIN CLINICAL APPOINTMENT CARD */}
            <div className="hero-visual-card">
              <div className="visual-card-header">
                <div className="doctor-status-online">
                  <span className="pulse-dot"></span>
                  <span>In Clinic & Available Online</span>
                </div>
                <span className="visual-badge">Verified Cardiologist</span>
              </div>

              <div className="mock-doctor-profile">
                <div className="mock-doctor-avatar">
                  <DoctorIcon size={26} />
                </div>
                <div className="mock-doctor-info">
                  <h4>Dr. Alexander Reed</h4>
                  <p>Chief Cardiologist · MD, FACC</p>
                  <div className="mock-rating-row">
                    <div className="rating-stars-wrapper">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} size={13} className="star-filled" />
                      ))}
                    </div>
                    <span className="rating-count">4.95 (1,420+ verified consultations)</span>
                  </div>
                </div>
              </div>

              <div className="mock-appointment-details">
                <div className="mock-detail-item">
                  <span className="mock-label">Consultation Mode</span>
                  <strong className="mock-val">
                    <VideoIcon size={14} className="inline-icon" /> 4K Ultra-HD Telehealth
                  </strong>
                </div>
                <div className="mock-detail-item">
                  <span className="mock-label">Slot Time</span>
                  <strong className="mock-val">
                    <ClockIcon size={14} className="inline-icon" /> Today · 04:30 PM
                  </strong>
                </div>
                <div className="mock-detail-item">
                  <span className="mock-label">Appointment Status</span>
                  <strong className="status-confirmed-text">
                    <CheckCircleIcon size={14} className="inline-icon" /> Confirmed by Doctor
                  </strong>
                </div>
                <div className="mock-detail-item">
                  <span className="mock-label">Payment Model</span>
                  <strong className="status-pay-badge">
                    <CreditCardIcon size={14} className="inline-icon" /> Pay After Confirmation
                  </strong>
                </div>
              </div>

              <div className="mock-fee-row">
                <div>
                  <span className="fee-title">Consultation Fee</span>
                  <small className="fee-sub">Zero booking fee · Digital Rx & follow-up included</small>
                </div>
                <strong className="mock-fee-amount">₹600</strong>
              </div>

              <Link to="/register" className="mock-card-btn">
                <span>Book Confirmed Slot</span>
                <ArrowRightIcon size={16} />
              </Link>
            </div>

            {/* FLOATING PAYMENT GUARANTEE BADGE */}
            <div className="floating-payment-pill">
              <div className="payment-pill-icon">
                <ShieldCheckIcon size={20} />
              </div>
              <div className="payment-pill-text">
                <strong>Pay-On-Confirmation</strong>
                <span>100% Protected · Zero upfront charge</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* STATS STRIP */}
      <section className="landing-stats-strip">
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-icon-hud">
              <DoctorIcon size={22} />
            </div>
            <div>
              <h3>500+</h3>
              <p>Certified Specialists</p>
            </div>
          </div>
          <div className="stat-separator"></div>
          <div className="stat-item">
            <div className="stat-icon-hud">
              <CalendarIcon size={22} />
            </div>
            <div>
              <h3>15,000+</h3>
              <p>Completed Consultations</p>
            </div>
          </div>
          <div className="stat-separator"></div>
          <div className="stat-item">
            <div className="stat-icon-hud">
              <ActivityIcon size={22} />
            </div>
            <div>
              <h3>99.4%</h3>
              <p>Patient Satisfaction</p>
            </div>
          </div>
          <div className="stat-separator"></div>
          <div className="stat-item">
            <div className="stat-icon-hud">
              <ShieldCheckIcon size={22} />
            </div>
            <div>
              <h3>100%</h3>
              <p>Zero-Risk Booking Guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE AI SYMPTOM TRIAGE DEMO */}
      <section id="triage-demo" className="landing-triage-section">
        <div className="section-header">
          <span className="section-label">
            <SparklesIcon size={14} className="inline-icon" /> Real-time Clinical Intelligence
          </span>
          <h2 className="section-title">Test Our AI Symptom Assistant</h2>
          <p className="section-description">
            Experience our clinical triaging engine. Select a common medical condition below or type custom symptoms to see immediate specialist recommendations.
          </p>
        </div>

        <div className="triage-demo-box">
          {/* SYMPTOM BUTTONS */}
          <div className="symptom-preset-pills">
            {PRESET_SYMPTOMS.map((preset) => {
              const PresetIcon = preset.icon;
              const isActive = activeTriage.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`symptom-pill-btn ${isActive ? "active" : ""}`}
                  onClick={() => handleSelectPreset(preset)}
                >
                  <PresetIcon size={18} className="pill-icon" />
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>

          {/* CUSTOM SYMPTOM SEARCH */}
          <form className="triage-search-bar" onSubmit={handleCustomSearch}>
            <div className="search-input-wrapper">
              <SearchIcon size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Or type custom symptoms (e.g. sharp lower abdomen pain, dizziness)..."
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
              />
            </div>
            <button type="submit" disabled={isAnalyzing}>
              {isAnalyzing ? "Analyzing Parameters..." : "Analyze with AI"}
              <ArrowRightIcon size={16} />
            </button>
          </form>

          {/* LIVE SIMULATOR RESULTS CARD */}
          <div className={`triage-result-card ${isAnalyzing ? "loading" : ""}`}>
            {isAnalyzing ? (
              <div className="triage-analyzing-state">
                <div className="ai-spin-circle"></div>
                <p>Analyzing symptom parameters with Clinical AI Diagnostic Engine...</p>
              </div>
            ) : (
              <div className="triage-result-content">
                <div className="result-top-bar">
                  <div className="result-dept-badge">
                    <span className="dept-tag">Department Match</span>
                    <strong>{activeTriage.specialty}</strong>
                  </div>

                  <div className="result-metrics">
                    <span className="confidence-chip">
                      <SparklesIcon size={14} /> {activeTriage.confidence} Precision Match
                    </span>
                    <span className={`urgency-chip ${activeTriage.urgency.toLowerCase()}`}>
                      Urgency: {activeTriage.urgency}
                    </span>
                  </div>
                </div>

                <div className="result-recommendation-box">
                  <div className="recommendation-header">
                    <ActiveTriageIcon size={20} className="recommendation-icon" />
                    <strong>Clinical Assessment Protocol</strong>
                  </div>
                  <p>{activeTriage.recommendation}</p>
                </div>

                <div className="result-doctor-match">
                  <div className="matched-doc-info">
                    <div className="matched-doc-avatar">
                      <DoctorIcon size={24} />
                    </div>
                    <div>
                      <h4>{activeTriage.doctor}</h4>
                      <p>{activeTriage.specialty} · Verified Telehealth Specialist</p>
                    </div>
                  </div>

                  <div className="matched-doc-action">
                    <div className="matched-doc-fee">
                      <span>Consultation Fee:</span>
                      <strong>{activeTriage.fee}</strong>
                      <small>(Pay only once doctor confirms)</small>
                    </div>
                    <Link to="/register" className="btn-matched-book">
                      <span>Book Doctor Slot</span>
                      <ArrowRightIcon size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* INTERACTIVE FEATURE SHOWCASE TABS */}
      <section id="features" className="landing-feature-showcase">
        <div className="section-header">
          <span className="section-label">Engineered for Excellence</span>
          <h2 className="section-title">The Complete Telehealth Experience</h2>
          <p className="section-description">
            Explore how MediCare+ redefines appointments, payments, and remote doctor consultations with zero upfront charge.
          </p>
        </div>

        {/* TABS HEADER */}
        <div className="showcase-tabs-nav">
          {FEATURE_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`showcase-tab-btn ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <TabIcon size={18} className="tab-icon-svg" />
                <span className="tab-title">{tab.title}</span>
              </button>
            );
          })}
        </div>

        {/* ACTIVE TAB DISPLAY CARD */}
        <div className="showcase-card">
          <div className="showcase-card-left">
            <span className="showcase-badge">{selectedFeature.badge}</span>
            <h3>{selectedFeature.title}</h3>
            <p className="showcase-tagline">{selectedFeature.tagline}</p>
            <p className="showcase-desc">{selectedFeature.description}</p>

            <ul className="showcase-perks-list">
              {selectedFeature.perks.map((perk, idx) => (
                <li key={idx}>
                  <span className="perk-check">
                    <CheckCircleIcon size={16} />
                  </span>
                  <span>{perk}</span>
                </li>
              ))}
            </ul>

            <Link to="/register" className="btn-showcase-action">
              <span>Get Started with {selectedFeature.title}</span>
              <ArrowRightIcon size={16} />
            </Link>
          </div>

          <div className="showcase-card-right">
            {selectedFeature.id === "payment" && (
              <div className="feature-demo-mockup payment-mockup">
                <div className="mockup-header">
                  <div className="mockup-title-wrap">
                    <CreditCardIcon size={18} />
                    <span>MediCare+ Protected Payment Flow</span>
                  </div>
                  <span className="pill-secure">
                    <LockIcon size={12} /> 256-bit E2EE
                  </span>
                </div>
                <div className="mockup-payment-card">
                  <div className="mockup-payment-row">
                    <div className="step-num-pill">01</div>
                    <div className="step-text-wrap">
                      <span>Patient Slot Request</span>
                      <strong>Slot Reserved (₹0 Charged Upfront)</strong>
                    </div>
                  </div>
                  <div className="mockup-payment-row doctor-step">
                    <div className="step-num-pill">02</div>
                    <div className="step-text-wrap">
                      <span>Doctor Reviews Schedule</span>
                      <strong className="text-teal">Doctor Confirms Availability ✓</strong>
                    </div>
                  </div>
                  <div className="mockup-payment-row highlight">
                    <div className="step-num-pill active">03</div>
                    <div className="step-text-wrap">
                      <span>Patient Pays Fee</span>
                      <strong className="text-emerald">Instant UPI / Card Checkout (₹600)</strong>
                    </div>
                  </div>
                  <div className="mockup-payment-row">
                    <div className="step-num-pill">04</div>
                    <div className="step-text-wrap">
                      <span>Instant Consultation & Receipt</span>
                      <strong>Official Tax Invoice & Room Access Unlocked</strong>
                    </div>
                  </div>
                </div>
                <div className="mockup-footer-note">
                  <ShieldCheckIcon size={16} />
                  <span>You are never billed for appointments that doctors cannot attend.</span>
                </div>
              </div>
            )}

            {selectedFeature.id === "ai" && (
              <div className="feature-demo-mockup ai-mockup">
                <div className="mockup-header">
                  <div className="mockup-title-wrap">
                    <SparklesIcon size={18} />
                    <span>Clinical AI Diagnosis Engine</span>
                  </div>
                  <span className="pill-ai">NLP 4.0 Neural</span>
                </div>
                <div className="mockup-ai-console">
                  <div className="console-line">
                    <span className="line-prefix">&gt;</span>
                    <span>Input: "Acute throbbing unilateral headache with nausea"</span>
                  </div>
                  <div className="console-line success">
                    <span className="line-prefix">✓</span>
                    <span>Classified: Migraine with visual aura (98.4% Confidence)</span>
                  </div>
                  <div className="console-line">
                    <span className="line-prefix">→</span>
                    <span>Suggested Dept: Neurology & Neurovascular Medicine</span>
                  </div>
                  <div className="console-line highlight">
                    <span className="line-prefix">★</span>
                    <span>Recommended Specialists: 8 Verified Doctors Ready Today</span>
                  </div>
                </div>
              </div>
            )}

            {selectedFeature.id === "telehealth" && (
              <div className="feature-demo-mockup video-mockup">
                <div className="mockup-header">
                  <div className="mockup-title-wrap">
                    <VideoIcon size={18} />
                    <span>WebRTC Consultation Studio</span>
                  </div>
                  <span className="pill-live">
                    <span className="pulse-dot"></span> 1080p 60fps Encrypted
                  </span>
                </div>
                <div className="mockup-video-canvas">
                  <div className="video-avatar-holder">
                    <div className="telehealth-doctor-avatar">
                      <DoctorIcon size={40} />
                    </div>
                    <strong>Dr. Alexander Reed, MD</strong>
                    <small>Speaking... (Microphone Encrypted & Active)</small>
                  </div>
                  <div className="video-controls-bar">
                    <span className="control-btn active">Audio ON</span>
                    <span className="control-btn active">Video ON</span>
                    <span className="control-btn">Share Screen</span>
                    <span className="control-btn danger">End Call</span>
                  </div>
                </div>
              </div>
            )}

            {selectedFeature.id === "records" && (
              <div className="feature-demo-mockup records-mockup">
                <div className="mockup-header">
                  <div className="mockup-title-wrap">
                    <FileTextIcon size={18} />
                    <span>Certified Digital Prescription</span>
                  </div>
                  <span className="pill-rx">
                    <QrCodeIcon size={14} /> Official Rx
                  </span>
                </div>
                <div className="mockup-rx-sheet">
                  <div className="rx-doctor-header">
                    <div>
                      <strong>MediCare+ Clinical Center</strong>
                      <small>Dr. Sophia Patel · Reg #MED-94021</small>
                    </div>
                    <div className="rx-qr-placeholder">
                      <QrCodeIcon size={32} />
                    </div>
                  </div>
                  <div className="rx-meds-list">
                    <div className="rx-med-item">
                      <strong>1. Amoxicillin 500mg</strong>
                      <span>1 capsule · Thrice daily after meals · 5 Days</span>
                    </div>
                    <div className="rx-med-item">
                      <strong>2. Paracetamol 650mg</strong>
                      <span>1 tablet · SOS if body temperature &gt; 100°F</span>
                    </div>
                  </div>
                  <div className="rx-footer-stamp">
                    <CheckCircleIcon size={14} />
                    <span>CRYPTOGRAPHICALLY SEALED & DIGITALLY VERIFIED</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="landing-steps">
        <div className="section-header">
          <span className="section-label">Transparent Experience</span>
          <h2 className="section-title">How MediCare+ Works</h2>
          <p className="section-description">
            Experience reliable medical consultations in four simple, transparent steps with guaranteed zero upfront billing.
          </p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-badge">STEP 01</div>
            <div className="step-icon-box">
              <SearchIcon size={24} />
            </div>
            <h4>Search or Check Symptoms</h4>
            <p>Describe your discomfort in our AI triage or browse verified doctors by specialty, ratings, and fees.</p>
          </div>

          <div className="step-card">
            <div className="step-badge">STEP 02</div>
            <div className="step-icon-box">
              <ClockIcon size={24} />
            </div>
            <h4>Doctor Confirms Slot</h4>
            <p>Your doctor reviews your symptoms and scheduled time to accept and confirm your appointment.</p>
          </div>

          <div className="step-card highlight-step">
            <div className="step-badge">STEP 03</div>
            <div className="step-icon-box highlight-icon">
              <CreditCardIcon size={24} />
            </div>
            <h4>Pay After Confirmation</h4>
            <p>Only pay the consultation fee once confirmed. Settle securely via UPI, Card, or Net Banking.</p>
          </div>

          <div className="step-card">
            <div className="step-badge">STEP 04</div>
            <div className="step-icon-box">
              <DoctorIcon size={24} />
            </div>
            <h4>Consult & Receive Rx</h4>
            <p>Attend in-person or join the HD video room, then download your official medical record and digital prescription.</p>
          </div>
        </div>
      </section>

      {/* CLINICAL SPECIALTIES GRID */}
      <section id="specialties" className="landing-specialties-section">
        <div className="section-header">
          <span className="section-label">Comprehensive Healthcare</span>
          <h2 className="section-title">Specialties Covered</h2>
          <p className="section-description">
            Top doctors across 8 core clinical branches ready for in-clinic or video consultations.
          </p>
        </div>

        <div className="specialties-grid">
          {SPECIALTY_LIST.map((spec) => {
            const SpecIcon = spec.icon;
            return (
              <div key={spec.name} className="specialty-card">
                <div className="specialty-icon-box">
                  <SpecIcon size={26} />
                </div>
                <h4>{spec.name}</h4>
                <span className="specialty-sub">{spec.desc}</span>
                <p className="specialty-count">{spec.count}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="landing-cta-banner">
        <div className="cta-banner-content">
          <h2>Ready for Smarter, Stress-Free Healthcare?</h2>
          <p>
            Join thousands of patients and doctors experiencing seamless telehealth and guaranteed pay-on-confirmation appointments.
          </p>
          <div className="cta-banner-buttons">
            <Link to="/register" className="btn-cta-white">
              <span>Create Free Account</span>
              <ArrowRightIcon size={16} />
            </Link>
            <Link to="/login" className="btn-cta-ghost">
              Sign In to Your Portal
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo-box">+</div>
            <div className="footer-logo-text">
              MediCare<span>+</span>
            </div>
          </div>

          <div className="footer-links">
            <Link to="/login">Sign In</Link>
            <Link to="/register">Create Account</Link>
            <a href="#triage-demo">AI Symptom Triage</a>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 MediCare+. All rights reserved.</p>
          <p>Protected by 256-bit SSL · HIPAA Compliant Telehealth Infrastructure</p>
        </div>
      </footer>
    </div>
  );
}

export default App;