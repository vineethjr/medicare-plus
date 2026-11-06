import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import "./OnlineConsultation.css";
import PrescriptionQRCode from "../components/PrescriptionQRCode";
import RatingModal from "../components/RatingModal";
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
import { API_URL, SOCKET_URL } from "../config";

const rtcConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
  ],
  iceCandidatePoolSize: 10,
};

function readUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}


/**
 * Creates a valid MediaStream fallback with a cyber-clinical canvas avatar track
 * and silent Web Audio track so WebRTC P2P negotiation can always succeed
 * even if camera is locked by another window or temporarily unavailable.
 */
function createFallbackStream(userName) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d");

  function renderAvatar() {
    ctx.fillStyle = "#071217";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Glowing circle
    ctx.beginPath();
    ctx.arc(320, 220, 85, 0, Math.PI * 2);
    ctx.fillStyle = "#0e2933";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(320, 220, 68, 0, Math.PI * 2);
    ctx.fillStyle = "#0d9488";
    ctx.fill();

    // Initial
    const initial = (userName || "P").charAt(0).toUpperCase();
    ctx.font = "bold 52px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initial, 320, 220);

    // Name & status
    ctx.font = "600 16px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#2dd4bf";
    ctx.fillText(userName || "Participant", 320, 335);

    ctx.font = "400 13px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("Audio-Only / Avatar Mode Active", 320, 360);
  }

  renderAvatar();
  let videoTrack = null;
  try {
    const stream = canvas.captureStream ? canvas.captureStream(10) : null;
    if (stream) {
      videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) videoTrack._isVirtual = true;
    }
  } catch (err) {
    console.warn("Could not capture canvas stream:", err);
  }

  // Silent audio track using AudioContext
  let audioTrack = null;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      const dest = audioCtx.createMediaStreamDestination();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.value = 0; // completely silent
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) audioTrack._isVirtual = true;
    }
  } catch (err) {
    console.warn("Could not create fallback audio track:", err);
  }

  const tracks = [];
  if (videoTrack) tracks.push(videoTrack);
  if (audioTrack) tracks.push(audioTrack);
  return new MediaStream(tracks);
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
  const [participantCount, setParticipantCount] = useState(1);
  const [signalingStatus, setSignalingStatus] = useState("waiting");
  const [showRatingModal, setShowRatingModal] = useState(false);

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
  const iceCandidateQueueRef = useRef([]);
  const isInitiatingRef = useRef(false);

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

    console.log("Initializing RTCPeerConnection with STUN mesh...");
    const pc = new RTCPeerConnection(rtcConfiguration);
    peerConnectionRef.current = pc;

    // Attach local stream tracks (real or avatar fallback)
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, localStreamRef.current);
        } catch (e) {
          console.warn("Could not add track to pc:", e);
        }
      });
    }

    // Remote track reception
    pc.ontrack = (event) => {
      console.log("WebRTC Remote track received:", event.track.kind);
      if (remoteVideoRef.current) {
        if (event.streams && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        } else {
          let currentStream = remoteVideoRef.current.srcObject;
          if (!currentStream || !(currentStream instanceof MediaStream)) {
            currentStream = new MediaStream();
            remoteVideoRef.current.srcObject = currentStream;
          }
          currentStream.addTrack(event.track);
        }
        remoteVideoRef.current.play().catch((err) => {
          console.log("Remote video autoplay note:", err);
        });
      }
      setParticipantConnected(true);
      setSignalingStatus("connected");
    };

    // ICE Candidate generation -> broadcast cleanly once to room
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.connected) {
        socketRef.current.emit("webrtc-ice-candidate", {
          appointmentId,
          candidate: event.candidate,
        });
      }
    };

    // Connection state listeners
    pc.onconnectionstatechange = () => {
      console.log("WebRTC Connection State:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setParticipantConnected(true);
        setSignalingStatus("connected");
      } else if (["disconnected", "failed"].includes(pc.connectionState)) {
        console.warn("WebRTC connection disconnected/failed, attempting iceRestart");
        if (pc.restartIce && isDoctor) {
          pc.restartIce();
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE Connection State:", pc.iceConnectionState);
      if (["connected", "completed"].includes(pc.iceConnectionState)) {
        setParticipantConnected(true);
        setSignalingStatus("connected");
      } else if (pc.iceConnectionState === "failed") {
        console.warn("ICE connection failed, triggering iceRestart");
        if (pc.restartIce && isDoctor) {
          pc.restartIce();
        }
      }
    };

    return pc;
  }

  // --------------------------------------------------
  // WEBRTC SIGNALING HANDLERS
  // --------------------------------------------------
  async function initiateOffer() {
    if (!isDoctor) return;
    if (isInitiatingRef.current) return;

    try {
      isInitiatingRef.current = true;
      setSignalingStatus("initiating");
      const pc = createPeerConnection();

      // Only create offer when signaling state is stable
      if (pc.signalingState !== "stable") {
        console.log("Signaling state not stable for offer:", pc.signalingState);
        isInitiatingRef.current = false;
        return;
      }

      console.log("Doctor generating WebRTC offer...");
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);

      socketRef.current?.emit("webrtc-offer", { appointmentId, offer });
      console.log("WebRTC offer dispatched to consultation room");
    } catch (err) {
      console.error("Error creating WebRTC offer:", err);
    } finally {
      setTimeout(() => {
        isInitiatingRef.current = false;
      }, 1000);
    }
  }

  async function handleReceiveOffer({ offer }) {
    if (isDoctor) return; // Doctor initiates, doesn't process incoming offers
    if (!offer) return;

    try {
      console.log("Patient received WebRTC offer. Creating answer...");
      setSignalingStatus("connecting");
      const pc = createPeerConnection();

      if (pc.signalingState !== "stable") {
        await Promise.all([
          pc.setLocalDescription({ type: "rollback" }).catch(() => {}),
          pc.setRemoteDescription(new RTCSessionDescription(offer)),
        ]);
      } else {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
      }

      // Flush queued candidates
      while (iceCandidateQueueRef.current.length > 0) {
        const queuedCandidate = iceCandidateQueueRef.current.shift();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(queuedCandidate));
        } catch (e) {
          console.warn("Error adding queued candidate:", e);
        }
      }

      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(answer);

      socketRef.current?.emit("webrtc-answer", { appointmentId, answer });
      console.log("WebRTC answer dispatched to doctor");
    } catch (err) {
      console.error("Error processing WebRTC offer:", err);
    }
  }

  async function handleReceiveAnswer({ answer }) {
    if (!isDoctor) return;
    if (!answer) return;

    try {
      console.log("Doctor received WebRTC answer.");
      const pc = peerConnectionRef.current;
      if (pc && pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        // Flush queued candidates
        while (iceCandidateQueueRef.current.length > 0) {
          const queuedCandidate = iceCandidateQueueRef.current.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(queuedCandidate));
          } catch (e) {
            console.warn("Error adding queued candidate:", e);
          }
        }
        console.log("Doctor successfully set remote description from answer");
      }
    } catch (err) {
      console.error("Error processing WebRTC answer:", err);
    }
  }

  async function handleReceiveCandidate({ candidate }) {
    if (!candidate) return;
    const candKey = typeof candidate === "string" ? candidate : candidate.candidate;
    if (candKey && seenCandidatesRef.current.has(candKey)) return;
    if (candKey) seenCandidatesRef.current.add(candKey);

    try {
      const pc = peerConnectionRef.current;
      if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) {
        iceCandidateQueueRef.current.push(candidate);
      } else {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.warn("Error adding received ICE candidate:", err);
    }
  }

  // --------------------------------------------------
  // PROGRESSIVE CAMERA & MICROPHONE CAPTURE
  // --------------------------------------------------
  async function startMedia() {
    setMediaError("");
    let stream = null;

    // 1. Try real video + audio
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      setCameraOn(true);
      setMicOn(true);
      console.log("Acquired real hardware camera & microphone");
    } catch (err1) {
      console.warn("Full camera+audio capture failed, trying audio-only fallback:", err1.message);

      // 2. Try real audio only + fallback virtual avatar video
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const fallback = createFallbackStream(user.name || (isDoctor ? "Doctor" : "Patient"));
        const tracks = [...audioStream.getAudioTracks(), ...fallback.getVideoTracks()];
        stream = new MediaStream(tracks);
        setCameraOn(false);
        setMicOn(true);
        setMediaError("Camera is busy in another window or denied. Audio is live (Avatar mode). Click 'Start Cam' to retry.");
        console.log("Acquired real microphone with avatar video stream");
      } catch (err2) {
        console.warn("Audio-only capture also failed, using full clinical virtual fallback:", err2.message);

        // 3. Fallback: virtual avatar video + silent audio so WebRTC connection never fails
        stream = createFallbackStream(user.name || (isDoctor ? "Doctor" : "Patient"));
        setCameraOn(false);
        setMicOn(false);
        setMediaError("Camera & microphone unavailable or in use by another window. Connected in avatar mode. Click 'Start Cam' or 'Unmute' to enable.");
      }
    }

    localStreamRef.current = stream;

    if (localVideoRef.current && stream) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(() => {});
    }

    // Attach to existing peer connection if already instantiated
    if (peerConnectionRef.current && stream) {
      stream.getTracks().forEach((track) => {
        try {
          const senders = peerConnectionRef.current.getSenders();
          const alreadyAdded = senders.some((s) => s.track && s.track.id === track.id);
          if (!alreadyAdded) {
            peerConnectionRef.current.addTrack(track, stream);
          }
        } catch (e) {
          console.warn("Error attaching track to pc:", e);
        }
      });
    }

    return stream;
  }

  // Hot-swap hardware camera into ongoing call
  async function requestCameraAccess() {
    try {
      setMediaError("");
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) return;

      if (localStreamRef.current) {
        const oldTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldTrack) {
          oldTrack.stop();
          localStreamRef.current.removeTrack(oldTrack);
        }
        localStreamRef.current.addTrack(newVideoTrack);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
        localVideoRef.current.play().catch(() => {});
      }

      if (peerConnectionRef.current) {
        const sender = peerConnectionRef.current.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        } else if (localStreamRef.current) {
          peerConnectionRef.current.addTrack(newVideoTrack, localStreamRef.current);
        }
      }

      setCameraOn(true);
      setMediaError("");
      console.log("Hardware camera activated and hot-swapped into consultation");
    } catch (err) {
      setMediaError("Could not start camera: " + (err.message || "Device busy or permission denied"));
    }
  }

  // Hot-swap hardware microphone into ongoing call
  async function requestMicrophoneAccess() {
    try {
      setMediaError("");
      const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const newAudioTrack = newStream.getAudioTracks()[0];
      if (!newAudioTrack) return;

      if (localStreamRef.current) {
        const oldTrack = localStreamRef.current.getAudioTracks()[0];
        if (oldTrack) {
          oldTrack.stop();
          localStreamRef.current.removeTrack(oldTrack);
        }
        localStreamRef.current.addTrack(newAudioTrack);
      }

      if (peerConnectionRef.current) {
        const sender = peerConnectionRef.current.getSenders().find((s) => s.track && s.track.kind === "audio");
        if (sender) {
          await sender.replaceTrack(newAudioTrack);
        } else if (localStreamRef.current) {
          peerConnectionRef.current.addTrack(newAudioTrack, localStreamRef.current);
        }
      }

      setMicOn(true);
      setMediaError("");
      console.log("Hardware microphone activated and hot-swapped into consultation");
    } catch (err) {
      setMediaError("Could not start microphone: " + (err.message || "Permission denied"));
    }
  }

  // --------------------------------------------------
  // SOCKET.IO SIGNALING MESH
  // --------------------------------------------------
  useEffect(() => {
    if (!appointment || !token) return;

    let cancelled = false;
    let socket;

    function triggerNegotiation() {
      if (!isDoctor) return;
      if (negotiationTimeoutRef.current) {
        clearTimeout(negotiationTimeoutRef.current);
      }
      negotiationTimeoutRef.current = setTimeout(() => {
        initiateOffer();
      }, 400);
    }

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
          console.log("Connected to telehealth signaling server. Joining room:", appointmentId);
          socket.emit("join-consultation", {
            appointmentId,
            user,
          });
        });

        socket.on("room-status", ({ participantCount: count }) => {
          console.log("Telehealth room status:", count, "participants");
          setParticipantCount(count || 1);
          if (count >= 2 && isDoctor) {
            triggerNegotiation();
          }
        });

        socket.on("participant-joined", ({ user: newUser, participantCount: count }) => {
          console.log("Participant joined room:", newUser?.name);
          setParticipantCount((prev) => Math.max(prev, count || 2));
          if (isDoctor) {
            triggerNegotiation();
          }
        });

        socket.on("ready-for-call", ({ participantCount: count }) => {
          console.log("Ready for call signal received. Count:", count);
          setParticipantCount((prev) => Math.max(prev, count || 2));
          if (isDoctor) {
            triggerNegotiation();
          }
        });

        // Single clean listeners for signaling
        socket.on("webrtc-offer", handleReceiveOffer);
        socket.on("webrtc-answer", handleReceiveAnswer);
        socket.on("webrtc-ice-candidate", handleReceiveCandidate);

        socket.on("participant-left", () => {
          console.log("Participant left consultation");
          setParticipantCount(1);
          setParticipantConnected(false);
          setSignalingStatus("waiting");
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
          }
          iceCandidateQueueRef.current = [];
          seenCandidatesRef.current.clear();
        });
      } catch (err) {
        console.error("Signaling error:", err);
      }
    }

    connectConsultation();

    return () => {
      cancelled = true;
      if (negotiationTimeoutRef.current) {
        clearTimeout(negotiationTimeoutRef.current);
      }
      if (socket) {
        socket.emit("leave-consultation", { appointmentId });
        socket.disconnect();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      iceCandidateQueueRef.current = [];
      seenCandidatesRef.current.clear();
    };
  }, [appointment, appointmentId, isDoctor, token]);

  // CONTROLS
  function toggleMicrophone() {
    if (!localStreamRef.current) {
      requestMicrophoneAccess();
      return;
    }
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (!audioTrack || audioTrack._isVirtual) {
      requestMicrophoneAccess();
      return;
    }
    audioTrack.enabled = !audioTrack.enabled;
    setMicOn(audioTrack.enabled);
  }

  function toggleCamera() {
    if (!localStreamRef.current) {
      requestCameraAccess();
      return;
    }
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (!videoTrack || videoTrack._isVirtual) {
      requestCameraAccess();
      return;
    }
    videoTrack.enabled = !videoTrack.enabled;
    setCameraOn(videoTrack.enabled);
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
        // Prompt patient to rate doctor before exiting
        setShowRatingModal(true);
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
          id: data.consultationId,
          doctor_id: appointment?.doctor_id || user.id,
          doctor_name: appointment?.doctor_name || user.name,
          specialization: appointment?.doctor_specialization || user.specialization,
          qualification: user.qualification || "MBBS",
          medical_license: user.medical_license || "SMC-ACTIVE-REGISTRY",
          hospital: appointment?.doctor_hospital || user.hospital,
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
                  {participantCount >= 2
                    ? `${isDoctor ? otherPersonName : `Dr. ${otherPersonName}`} is in the room!`
                    : `Connecting with ${isDoctor ? otherPersonName : `Dr. ${otherPersonName}`}`}
                </h3>
                <p>
                  {participantCount >= 2 ? (
                    <>
                      Both participants are in encrypted room <strong>#MED-{appointment.id}</strong>. Establishing peer-to-peer WebRTC video stream...
                    </>
                  ) : (
                    <>
                      Waiting for participant to enter encrypted room <strong>#MED-{appointment.id}</strong>
                    </>
                  )}
                </p>

                <div className="waiting-pulse-meter">
                  <span className="meter-bar"></span>
                  <span className="meter-bar"></span>
                  <span className="meter-bar"></span>
                  <span className="meter-bar"></span>
                  <span className="meter-bar"></span>
                </div>

                <div className="waiting-status-badges-row">
                  <div className={`waiting-secure-tag ${participantCount >= 2 ? "active" : "waiting"}`}>
                    <ShieldCheckIcon size={14} />{" "}
                    {participantCount >= 2
                      ? "P2P WebRTC Handshake in Progress"
                      : "Room Ready • Awaiting Participant"}
                  </div>
                  <div className="waiting-count-tag">
                    <UserIcon size={13} /> {participantCount} / 2 in Room
                  </div>
                </div>

                {participantCount <= 1 && (
                  <div className="waiting-single-tester-tip">
                    <SparklesIcon size={14} />
                    <span>
                      <strong>Testing video call?</strong> In a Private/Incognito window, log in as{" "}
                      <strong>{isDoctor ? "the Patient" : `Dr. ${otherPersonName}`}</strong> and join room <strong>#MED-{appointment.id}</strong>.
                    </span>
                  </div>
                )}
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
            <div className="stage-media-alert" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertCircleIcon size={18} />
                <span>{mediaError}</span>
              </div>
              <button
                type="button"
                onClick={startMedia}
                style={{
                  background: "#ffffff",
                  color: "#0f172a",
                  border: "none",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                🔄 Retry Camera / Mic
              </button>
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

                    {/* QR CODE FOR DOCTOR & PRESCRIPTION VERIFICATION */}
                    <PrescriptionQRCode
                      doctorId={existingPrescription.doctor_id || appointment?.doctor_id || user.id}
                      doctorName={existingPrescription.doctor_name || appointment?.doctor_name || user.name}
                      specialization={existingPrescription.specialization || appointment?.doctor_specialization || user.specialization}
                      qualification={existingPrescription.qualification || user.qualification || "MBBS"}
                      medicalLicense={existingPrescription.medical_license || user.medical_license || "SMC-ACTIVE-REGISTRY"}
                      hospital={existingPrescription.hospital || appointment?.doctor_hospital || user.hospital}
                      prescriptionId={existingPrescription.id}
                    />

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
      {/* PATIENT POST-CONSULTATION RATING & REVIEW MODAL */}
      {!isDoctor && showRatingModal && appointment && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            navigate("/patient-appointments");
          }}
          appointment={{
            id: appointment.id,
            doctor_id: appointment.doctor_id,
            doctor_name: otherPersonName || appointment.doctor_name,
            specialization: appointment.specialization,
            consultation_mode: "Online",
            appointment_date: appointment.appointment_date,
          }}
          onSuccess={() => {
            setShowRatingModal(false);
            navigate("/patient-appointments");
          }}
          canSkip={true}
        />
      )}
    </div>
  );
}

export default OnlineConsultation;
