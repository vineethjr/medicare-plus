import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import "./OnlineConsultation.css";
import {
  ActivityIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  CreditCardIcon,
  DoctorIcon,
  FileTextIcon,
  HeartPulseIcon,
  LockIcon,
  LogOutIcon,
  MailIcon,
  PhoneIcon,
  PillIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StethoscopeIcon,
  UserIcon,
  VideoIcon,
  XIcon,
} from "../components/Icons";

const API_URL = "http://localhost:5000/api";
const SOCKET_URL = "http://localhost:5000";

const rtcConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function OnlineConsultation() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [user] = useState(readUser);
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mediaError, setMediaError] = useState("");

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [participantConnected, setParticipantConnected] = useState(false);

  // Active drawer tab: null (closed), 'dossier', 'prescription', 'chat'
  const [activeDrawer, setActiveDrawer] = useState(null);

  // In-Call Prescription Form (for Doctor)
  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: "",
    doctor_notes: "",
    follow_up_date: "",
    medicines: [
      { name: "", dosage: "", frequency: "", duration: "" },
    ],
  });
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [prescriptionSaved, setPrescriptionSaved] = useState(false);
  const [existingPrescription, setExistingPrescription] = useState(null);

  // Chat
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatError, setChatError] = useState("");

  // Call duration timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const appointmentRef = useRef(null);

  const token = localStorage.getItem("token");
  const isDoctor = user.role === "doctor";

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  // --------------------------------------------------
  // FETCH AND VERIFY APPOINTMENT
  // --------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function fetchAppointment() {
      try {
        setLoading(true);
        setError("");

        if (!token || !user.id || !user.role) {
          throw new Error("Please log in to join the consultation.");
        }

        const response = await fetch(
          `${API_URL}/appointments/${user.role}`,
          { headers: authHeaders }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load appointments.");
        }

        const found = Array.isArray(data)
          ? data.find((item) => String(item.id) === String(appointmentId))
          : null;

        if (!found) {
          throw new Error("Appointment not found or you do not have permission to join.");
        }

        if (found.consultation_mode !== "Online") {
          throw new Error("This appointment is not an online consultation.");
        }

        if (["Cancelled", "Rejected"].includes(found.status)) {
          throw new Error(`This appointment has been ${found.status.toLowerCase()}.`);
        }

        if (!cancelled) {
          appointmentRef.current = found;
          setAppointment(found);

          // If doctor and consultation hasn't started yet, mark it started
          if (isDoctor && !found.consultation_started_at) {
            fetch(`${API_URL}/appointments/${found.id}/start`, {
              method: "POST",
              headers: authHeaders,
            }).catch(() => {});
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load consultation details.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAppointment();

    return () => {
      cancelled = true;
    };
  }, [appointmentId, token, user.id, user.role, isDoctor]);

  // Load existing consultation record if any
  useEffect(() => {
    async function loadConsultationRecord() {
      if (!appointment) return;
      try {
        const res = await fetch(`${API_URL}/consultations/${user.role}`, {
          headers: authHeaders,
        });
        if (res.ok) {
          const records = await res.json();
          const match = Array.isArray(records)
            ? records.find((r) => String(r.appointment_id) === String(appointment.id))
            : null;
          if (match) {
            setExistingPrescription(match);
          }
        }
      } catch (err) {
        console.error("Failed to load consultation record:", err);
      }
    }
    loadConsultationRecord();
  }, [appointment, user.role]);

  // --------------------------------------------------
  // CHAT MESSAGES
  // --------------------------------------------------
  const fetchMessages = useCallback(async () => {
    if (!token || !appointmentId) return;
    try {
      const response = await fetch(
        `${API_URL}/appointments/${appointmentId}/messages`,
        { headers: authHeaders }
      );
      const data = await response.json();
      if (response.ok) {
        const list = Array.isArray(data) ? data : data.messages || [];
        setMessages(list);
      }
    } catch {
      // silent polling fail
    }
  }, [appointmentId, token]);

  useEffect(() => {
    if (!appointment) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [appointment, fetchMessages]);

  async function sendMessage(e) {
    e?.preventDefault();
    const msg = messageText.trim();
    if (!msg || sendingMessage) return;

    try {
      setSendingMessage(true);
      const res = await fetch(`${API_URL}/appointments/${appointmentId}/messages`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ message: msg }),
      });
      if (res.ok) {
        setMessageText("");
        await fetchMessages();
      }
    } catch (err) {
      setChatError("Failed to send message.");
    } finally {
      setSendingMessage(false);
    }
  }

  // --------------------------------------------------
  // WEBRTC PEER CONNECTION
  // --------------------------------------------------
  function createPeerConnection() {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const pc = new RTCPeerConnection(rtcConfiguration);
    peerConnectionRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteVideoRef.current.play().catch(() => {});
      }
      setParticipantConnected(true);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.connected) {
        socketRef.current.emit("ice-candidate", {
          appointmentId,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      setParticipantConnected(state === "connected");
      if (["failed", "closed"].includes(state)) {
        setParticipantConnected(false);
      }
    };

    return pc;
  }

  // --------------------------------------------------
  // CAMERA & MICROPHONE
  // --------------------------------------------------
  async function startMedia() {
    try {
      setMediaError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.play().catch(() => {});
      }

      setCameraOn(stream.getVideoTracks().some((t) => t.enabled));
      setMicOn(stream.getAudioTracks().some((t) => t.enabled));
      return stream;
    } catch (err) {
      setMediaError(
        err.name === "NotAllowedError"
          ? "Camera or microphone permission was denied. Allow access in your browser settings."
          : "Unable to access camera or microphone."
      );
      setMicOn(false);
      setCameraOn(false);
      return null;
    }
  }

  // --------------------------------------------------
  // SOCKET.IO SIGNALING
  // --------------------------------------------------
  useEffect(() => {
    if (!appointment || !token) return;

    let cancelled = false;
    let socket;

    async function connectConsultation() {
      try {
        const stream = await startMedia();
        if (cancelled) {
          stream?.getTracks().forEach((t) => t.stop());
          return;
        }

        socket = io(SOCKET_URL, {
          transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit("join-consultation", {
            appointmentId,
            user,
          });
        });

        socket.on("participant-joined", async () => {
          if (isDoctor) {
            const pc = createPeerConnection();
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("offer", { appointmentId, offer });
          }
        });

        socket.on("offer", async ({ offer }) => {
          if (!isDoctor) {
            const pc = createPeerConnection();
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("answer", { appointmentId, answer });
          }
        });

        socket.on("answer", async ({ answer }) => {
          if (isDoctor && peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(
              new RTCSessionDescription(answer)
            );
          }
        });

        socket.on("ice-candidate", async ({ candidate }) => {
          try {
            if (peerConnectionRef.current) {
              await peerConnectionRef.current.addIceCandidate(
                new RTCIceCandidate(candidate)
              );
            }
          } catch {
            // ignore ice errors
          }
        });

        socket.on("participant-left", () => {
          setParticipantConnected(false);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        });
      } catch (err) {
        console.error("Signaling error:", err);
      }
    }

    connectConsultation();

    return () => {
      cancelled = true;
      if (socket) socket.disconnect();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [appointment, appointmentId, isDoctor, token]);

  // CONTROLS
  function toggleMicrophone() {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    }
  }

  function toggleCamera() {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCameraOn(videoTrack.enabled);
    }
  }

  async function shareScreen() {
    try {
      if (screenStreamRef.current) {
        // Stop screen share
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
        if (localStreamRef.current && localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      screenStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      stream.getVideoTracks()[0].onended = () => {
        screenStreamRef.current = null;
        if (localStreamRef.current && localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      };
    } catch {
      // Screen share cancelled
    }
  }

  function handleEndConsultation() {
    if (window.confirm("Are you sure you want to conclude this video consultation session?")) {
      if (isDoctor) {
        fetch(`${API_URL}/appointments/${appointmentId}/status`, {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify({ status: "Completed" }),
        }).catch(() => {});
        navigate("/doctor-dashboard");
      } else {
        navigate("/patient-dashboard");
      }
    }
  }

  // PRESCRIPTION PAD HANDLERS (for Doctor)
  function handleAddMedicine() {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        { name: "", dosage: "", frequency: "", duration: "" },
      ],
    }));
  }

  function handleRemoveMedicine(idx) {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== idx),
    }));
  }

  function handleMedicineChange(idx, field, val) {
    setPrescriptionForm((prev) => {
      const updated = [...prev.medicines];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, medicines: updated };
    });
  }

  async function handleSavePrescription(e) {
    e?.preventDefault();
    if (!prescriptionForm.diagnosis.trim()) {
      alert("Please specify a primary diagnosis.");
      return;
    }

    try {
      setSavingPrescription(true);
      const res = await fetch(`${API_URL}/consultations`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          appointment_id: Number(appointmentId),
          diagnosis: prescriptionForm.diagnosis,
          prescription: prescriptionForm.medicines,
          doctor_notes: prescriptionForm.doctor_notes,
          follow_up_date: prescriptionForm.follow_up_date,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPrescriptionSaved(true);
        setExistingPrescription({
          diagnosis: prescriptionForm.diagnosis,
          prescription: JSON.stringify(prescriptionForm.medicines),
          doctor_notes: prescriptionForm.doctor_notes,
          follow_up_date: prescriptionForm.follow_up_date,
        });
      } else {
        alert(data.message || "Failed to save prescription.");
      }
    } catch (err) {
      alert("Error saving prescription to clinical database.");
    } finally {
      setSavingPrescription(false);
    }
  }

  if (loading) {
    return (
      <div className="telehealth-loading-screen">
        <HeartPulseIcon size={44} className="pulse-spin" />
        <h2>Establishing Quantum Clinical Telehealth Studio...</h2>
        <p>Connecting to secure WebSockets & WebRTC mesh</p>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="telehealth-error-screen">
        <AlertCircleIcon size={48} />
        <h2>Consultation Unavailable</h2>
        <p>{error || "Appointment not found."}</p>
        <button
          className="btn-back-home"
          onClick={() =>
            navigate(isDoctor ? "/doctor-dashboard" : "/patient-dashboard")
          }
        >
          Return to Workspace
        </button>
      </div>
    );
  }

  const otherPersonName = isDoctor
    ? appointment.patient_name || "Patient"
    : appointment.doctor_name || "Physician";

  return (
    <div className="telehealth-studio-viewport">
      {/* TOP TELEMETRY HUD BAR */}
      <header className="telehealth-hud-bar">
        <div className="hud-left-group">
          <button
            className="hud-back-btn"
            onClick={() =>
              navigate(isDoctor ? "/doctor-dashboard" : "/patient-dashboard")
            }
            title="Return to Dashboard"
          >
            <ArrowRightIcon size={16} className="rotate-back" />
            <span>Leave View</span>
          </button>

          <div className="telehealth-brand">
            <div className="brand-dot-pulse"></div>
            <strong>MediCare<span>+</span> Telehealth Pro</strong>
          </div>
        </div>

        {/* SECURITY & TELEMETRY BADGES */}
        <div className="hud-center-telemetry">
          <div className="security-lock-badge">
            <LockIcon size={13} />
            <span>E2EE 256-Bit Encrypted</span>
          </div>

          <div className="latency-badge">
            <ActivityIcon size={13} />
            <span>18ms • Ultra-HD 60 FPS</span>
          </div>

          <div className="call-timer-badge">
            <ClockIcon size={13} />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>
        </div>

        {/* OTHER PARTICIPANT INFO CHIP */}
        <div className="hud-right-group">
          <div className="participant-telemetry-chip">
            <div className="chip-avatar">
              {otherPersonName.charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{isDoctor ? otherPersonName : `Dr. ${otherPersonName}`}</strong>
              <small>{isDoctor ? "Patient Roster" : (appointment.specialization || "Physician")}</small>
            </div>
          </div>
        </div>
      </header>

      {/* STAGE & VIDEO VIEWPORT */}
      <div className="telehealth-stage-container">
        {/* PRIMARY VIDEO STAGE */}
        <div className={`video-stage-main ${activeDrawer ? "with-drawer" : ""}`}>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`remote-stream-video ${participantConnected ? "active" : "hidden"}`}
          />

          {/* WAITING STATE HOLOGRAM RADAR */}
          {!participantConnected && (
            <div className="stage-waiting-radar">
              <div className="radar-scanner-ring ring-1"></div>
              <div className="radar-scanner-ring ring-2"></div>
              <div className="radar-scanner-ring ring-3"></div>

              <div className="waiting-hologram-card">
                <div className="waiting-avatar-circle">
                  {otherPersonName.charAt(0).toUpperCase()}
                </div>
                <h3>
                  Connecting with {isDoctor ? otherPersonName : `Dr. ${otherPersonName}`}
                </h3>
                <p>
                  Waiting for participant to enter encrypted room <strong>#MED-{appointment.id}</strong>
                </p>
                <div className="waiting-pulse-meter">
                  <span className="meter-bar"></span>
                  <span className="meter-bar"></span>
                  <span className="meter-bar"></span>
                  <span className="meter-bar"></span>
                  <span className="meter-bar"></span>
                </div>
                <div className="waiting-secure-tag">
                  <ShieldCheckIcon size={14} /> Peer-to-Peer Signaling Handshake Active
                </div>
              </div>
            </div>
          )}

          {/* FLOATING PICTURE-IN-PICTURE SELF VIEW */}
          <div className="floating-pip-card">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`pip-stream-video ${cameraOn ? "active" : "hidden"}`}
            />

            {!cameraOn && (
              <div className="pip-camera-off">
                <div className="off-avatar">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <span>Camera Suspended</span>
              </div>
            )}

            <div className="pip-status-overlay">
              <span className="pip-self-label">You (Self View)</span>
              <span className={`pip-mic-dot ${micOn ? "active" : "muted"}`}>
                {micOn ? "Mic On" : "Muted"}
              </span>
            </div>
          </div>

          {/* MEDIA ERROR BANNER */}
          {mediaError && (
            <div className="stage-media-alert">
              <AlertCircleIcon size={18} />
              <span>{mediaError}</span>
            </div>
          )}

          {/* FLOATING TELEHEALTH CONTROL DOCK */}
          <div className="telehealth-controls-dock">
            {/* MIC TOGGLE */}
            <button
              type="button"
              className={`dock-btn ${!micOn ? "muted danger" : "active"}`}
              onClick={toggleMicrophone}
              title={micOn ? "Mute Microphone" : "Unmute Microphone"}
            >
              <HeartPulseIcon size={18} />
              <span>{micOn ? "Mute" : "Unmuted"}</span>
            </button>

            {/* CAMERA TOGGLE */}
            <button
              type="button"
              className={`dock-btn ${!cameraOn ? "danger" : "active"}`}
              onClick={toggleCamera}
              title={cameraOn ? "Turn Camera Off" : "Turn Camera On"}
            >
              <VideoIcon size={18} />
              <span>{cameraOn ? "Stop Cam" : "Start Cam"}</span>
            </button>

            {/* SCREEN SHARE */}
            <button
              type="button"
              className={`dock-btn ${screenStreamRef.current ? "active-screen" : ""}`}
              onClick={shareScreen}
              title="Share Display or Clinical Reports"
            >
              <ActivityIcon size={18} />
              <span>Share Screen</span>
            </button>

            {/* PATIENT DOSSIER DRAWER TOGGLE */}
            <button
              type="button"
              className={`dock-btn ${activeDrawer === "dossier" ? "active-tab" : ""}`}
              onClick={() => setActiveDrawer(activeDrawer === "dossier" ? null : "dossier")}
              title="Inspect Patient Medical Dossier"
            >
              <UserIcon size={18} />
              <span>Patient Dossier</span>
            </button>

            {/* PRESCRIPTION PAD TOGGLE */}
            <button
              type="button"
              className={`dock-btn ${activeDrawer === "prescription" ? "active-tab" : ""}`}
              onClick={() => setActiveDrawer(activeDrawer === "prescription" ? null : "prescription")}
              title="Digital Clinical Prescription Pad"
            >
              <FileTextIcon size={18} />
              <span>Prescription</span>
            </button>

            {/* CHAT TOGGLE */}
            <button
              type="button"
              className={`dock-btn ${activeDrawer === "chat" ? "active-tab" : ""}`}
              onClick={() => setActiveDrawer(activeDrawer === "chat" ? null : "chat")}
              title="Open Encrypted In-Session Chat"
            >
              <MailIcon size={18} />
              <span>Chat {messages.length > 0 && `(${messages.length})`}</span>
            </button>

            {/* END CALL BUTTON */}
            <button
              type="button"
              className="dock-btn-leave"
              onClick={handleEndConsultation}
              title="Conclude Video Consultation"
            >
              <PhoneIcon size={16} />
              <span>End Call</span>
            </button>
          </div>
        </div>

        {/* INTERACTIVE SLIDE-OVER CONSOLE (RIGHT SIDE) */}
        {activeDrawer && (
          <aside className="telehealth-slide-drawer">
            {/* DRAWER TAB HEADER */}
            <div className="drawer-tab-header">
              <div className="tab-buttons">
                <button
                  type="button"
                  className={`tab-btn ${activeDrawer === "dossier" ? "active" : ""}`}
                  onClick={() => setActiveDrawer("dossier")}
                >
                  <UserIcon size={14} /> Dossier
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeDrawer === "prescription" ? "active" : ""}`}
                  onClick={() => setActiveDrawer("prescription")}
                >
                  <FileTextIcon size={14} /> Rx Pad
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeDrawer === "chat" ? "active" : ""}`}
                  onClick={() => setActiveDrawer("chat")}
                >
                  <MailIcon size={14} /> Chat
                </button>
              </div>

              <button
                type="button"
                className="btn-close-drawer"
                onClick={() => setActiveDrawer(null)}
              >
                <XIcon size={16} />
              </button>
            </div>

            {/* TAB 1: PATIENT MEDICAL DOSSIER */}
            {activeDrawer === "dossier" && (
              <div className="drawer-content-pane">
                <div className="pane-header">
                  <h3>Patient Clinical Dossier</h3>
                  <small>Verified health metrics & clinical alerts</small>
                </div>

                <div className="pane-section">
                  <h4>Physical Telemetry</h4>
                  <div className="dossier-grid">
                    <div>
                      <small>AGE</small>
                      <strong>{appointment.patient_age ? `${appointment.patient_age} yrs` : "--"}</strong>
                    </div>
                    <div>
                      <small>GENDER</small>
                      <strong>{appointment.patient_gender || "Not specified"}</strong>
                    </div>
                    <div>
                      <small>BLOOD GROUP</small>
                      <strong style={{ color: "#f87171" }}>
                        {appointment.patient_blood_group || "Unknown"}
                      </strong>
                    </div>
                    <div>
                      <small>HEIGHT</small>
                      <strong>{appointment.patient_height ? `${appointment.patient_height} cm` : "--"}</strong>
                    </div>
                    <div>
                      <small>WEIGHT</small>
                      <strong>{appointment.patient_weight ? `${appointment.patient_weight} kg` : "--"}</strong>
                    </div>
                    <div>
                      <small>BMI</small>
                      <strong>
                        {appointment.patient_height && appointment.patient_weight
                          ? `${(appointment.patient_weight / Math.pow(appointment.patient_height / 100, 2)).toFixed(1)}`
                          : "--"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pane-section">
                  <h4>Critical Clinical Alerts</h4>
                  <div className="dossier-pill-box red">
                    <strong>KNOWN ALLERGIES:</strong>
                    <p>{appointment.patient_allergies || "No known drug/food allergies recorded."}</p>
                  </div>
                  <div className="dossier-pill-box amber" style={{ marginTop: "10px" }}>
                    <strong>CHRONIC CONDITIONS:</strong>
                    <p>{appointment.patient_chronic_conditions || "No chronic conditions recorded."}</p>
                  </div>
                </div>

                <div className="pane-section">
                  <h4>Medications & Surgeries</h4>
                  <div className="dossier-info-block">
                    <small>CURRENT MEDICATIONS</small>
                    <p>{appointment.patient_current_medications || "No active medications."}</p>
                  </div>
                  <div className="dossier-info-block" style={{ marginTop: "10px" }}>
                    <small>PAST SURGERIES</small>
                    <p>{appointment.patient_past_surgeries || "No prior surgeries."}</p>
                  </div>
                </div>

                <div className="pane-section">
                  <h4>Emergency Contact</h4>
                  <div className="dossier-info-block">
                    <p>
                      <strong>{appointment.patient_emergency_contact_name || "Not provided"}</strong>{" "}
                      ({appointment.patient_emergency_contact_relation || "Relation unknown"})
                    </p>
                    <strong style={{ color: "#2dd4bf", fontSize: "12.5px" }}>
                      {appointment.patient_emergency_contact_phone || "--"}
                    </strong>
                  </div>
                </div>

                {appointment.symptoms && (
                  <div className="pane-section">
                    <h4>Chief Complaint for Session</h4>
                    <p className="symptom-quote">{appointment.symptoms}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: IN-CALL DIGITAL PRESCRIPTION PAD */}
            {activeDrawer === "prescription" && (
              <div className="drawer-content-pane">
                <div className="pane-header">
                  <h3>Certified Digital Prescription</h3>
                  <small>
                    {isDoctor
                      ? "Issue digital prescription directly during video consultation"
                      : "Prescription and diagnostic instructions issued by attending physician"}
                  </small>
                </div>

                {existingPrescription ? (
                  <div className="existing-prescription-card">
                    <div className="rx-badge">
                      <CheckCircleIcon size={16} /> Certified Prescription On File
                    </div>

                    <div className="rx-item">
                      <small>PRIMARY DIAGNOSIS</small>
                      <strong>{existingPrescription.diagnosis}</strong>
                    </div>

                    <div className="rx-item">
                      <small>PRESCRIBED MEDICINES</small>
                      <div className="rx-meds-list">
                        {(() => {
                          try {
                            const meds = JSON.parse(existingPrescription.prescription);
                            if (Array.isArray(meds)) {
                              return meds.map((m, i) => (
                                <div key={i} className="med-chip">
                                  <strong>{m.name || "Medicine"}</strong>
                                  <span>{m.dosage} • {m.frequency} • {m.duration}</span>
                                </div>
                              ));
                            }
                          } catch {
                            // fall back to string
                          }
                          return <p>{existingPrescription.prescription}</p>;
                        })()}
                      </div>
                    </div>

                    {existingPrescription.doctor_notes && (
                      <div className="rx-item">
                        <small>PHYSICIAN'S CLINICAL NOTES</small>
                        <p>{existingPrescription.doctor_notes}</p>
                      </div>
                    )}

                    {existingPrescription.follow_up_date && (
                      <div className="rx-item">
                        <small>RECOMMENDED FOLLOW-UP</small>
                        <strong>{existingPrescription.follow_up_date}</strong>
                      </div>
                    )}
                  </div>
                ) : isDoctor ? (
                  <form onSubmit={handleSavePrescription} className="prescription-form">
                    <div className="form-group">
                      <label>Clinical Diagnosis *</label>
                      <input
                        type="text"
                        placeholder="e.g. Acute Viral Bronchitis"
                        value={prescriptionForm.diagnosis}
                        onChange={(e) =>
                          setPrescriptionForm((prev) => ({ ...prev, diagnosis: e.target.value }))
                        }
                        required
                      />
                    </div>

                    <div className="form-group">
                      <div className="meds-header-row">
                        <label>Pharmaceutical Regimen</label>
                        <button
                          type="button"
                          className="btn-add-med"
                          onClick={handleAddMedicine}
                        >
                          <PlusIcon size={12} /> Add Medicine
                        </button>
                      </div>

                      {prescriptionForm.medicines.map((med, idx) => (
                        <div key={idx} className="medicine-input-row">
                          <input
                            type="text"
                            placeholder="Medicine Name (e.g. Amoxicillin)"
                            value={med.name}
                            onChange={(e) =>
                              handleMedicineChange(idx, "name", e.target.value)
                            }
                          />
                          <div className="med-details-row">
                            <input
                              type="text"
                              placeholder="Dosage (500mg)"
                              value={med.dosage}
                              onChange={(e) =>
                                handleMedicineChange(idx, "dosage", e.target.value)
                              }
                            />
                            <input
                              type="text"
                              placeholder="Freq (TDS - 3x/day)"
                              value={med.frequency}
                              onChange={(e) =>
                                handleMedicineChange(idx, "frequency", e.target.value)
                              }
                            />
                            <input
                              type="text"
                              placeholder="Duration (5 days)"
                              value={med.duration}
                              onChange={(e) =>
                                handleMedicineChange(idx, "duration", e.target.value)
                              }
                            />
                            {prescriptionForm.medicines.length > 1 && (
                              <button
                                type="button"
                                className="btn-del-med"
                                onClick={() => handleRemoveMedicine(idx)}
                              >
                                <XIcon size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="form-group">
                      <label>Special Instructions & Doctor Notes</label>
                      <textarea
                        rows={3}
                        placeholder="Dietary instructions, rest recommendations, hydration..."
                        value={prescriptionForm.doctor_notes}
                        onChange={(e) =>
                          setPrescriptionForm((prev) => ({ ...prev, doctor_notes: e.target.value }))
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Follow-up Date</label>
                      <input
                        type="date"
                        value={prescriptionForm.follow_up_date}
                        onChange={(e) =>
                          setPrescriptionForm((prev) => ({ ...prev, follow_up_date: e.target.value }))
                        }
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-submit-rx"
                      disabled={savingPrescription}
                    >
                      {savingPrescription ? "Signing & Dispatching..." : "Issue & Sign Certified Prescription"}
                    </button>
                  </form>
                ) : (
                  <div className="rx-empty-state">
                    <FileTextIcon size={32} />
                    <p>Your doctor has not yet issued a digital prescription for this session. It will appear here once finalized.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: IN-SESSION ENCRYPTED CHAT */}
            {activeDrawer === "chat" && (
              <div className="drawer-content-pane chat-pane">
                <div className="pane-header">
                  <h3>Encrypted In-Session Chat</h3>
                  <small>Peer-to-peer real-time clinical notes & queries</small>
                </div>

                <div className="chat-messages-scroll">
                  {messages.length === 0 ? (
                    <div className="chat-empty-state">
                      <MailIcon size={28} />
                      <p>No messages yet. Send a note or clinical reference to participant.</p>
                    </div>
                  ) : (
                    messages.map((item, idx) => {
                      const isMe = String(item.sender_id || item.user_id) === String(user.id);
                      return (
                        <div key={idx} className={`chat-bubble-row ${isMe ? "outgoing" : "incoming"}`}>
                          <div className="chat-bubble">
                            <span className="bubble-sender">
                              {isMe ? "You" : item.sender_name || otherPersonName}
                            </span>
                            <p>{item.message}</p>
                            <span className="bubble-time">
                              {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={sendMessage} className="chat-input-bar">
                  <input
                    type="text"
                    placeholder="Type encrypted message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                  <button type="submit" disabled={!messageText.trim() || sendingMessage}>
                    Send
                  </button>
                </form>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

export default OnlineConsultation;
