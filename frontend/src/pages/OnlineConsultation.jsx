
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import "./OnlineConsultation.css";

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
  const [participantConnected, setParticipantConnected] =
    useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatError, setChatError] = useState("");

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

        if (!["doctor", "patient"].includes(user.role)) {
          throw new Error("Your account cannot join this consultation.");
        }

        const response = await fetch(
          `${API_URL}/appointments/${user.role}`,
          { headers: authHeaders }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Could not load your appointments."
          );
        }

        const found = Array.isArray(data)
          ? data.find(
              (item) => String(item.id) === String(appointmentId)
            )
          : null;

        if (!found) {
          throw new Error(
            "Appointment not found or you do not have access to it."
          );
        }

        if (found.consultation_mode !== "Online") {
          throw new Error(
            "This appointment is not an online consultation."
          );
        }

        if (
          ["Cancelled", "Rejected"].includes(found.status)
        ) {
          throw new Error(
            `This appointment is ${found.status.toLowerCase()}.`
          );
        }

        if (!cancelled) {
          appointmentRef.current = found;
          setAppointment(found);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load the consultation.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAppointment();

    return () => {
      cancelled = true;
    };
    // authHeaders is intentionally not a dependency; token/user identity
    // changes are represented by the primitive dependencies below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId, token, user.id, user.role]);

  // --------------------------------------------------
  // PERSISTENT CHAT
  // Requires GET and POST /api/appointments/:id/messages
  // --------------------------------------------------

  const fetchMessages = useCallback(async () => {
    if (!token || !appointmentId) return;

    try {
      const response = await fetch(
        `${API_URL}/appointments/${appointmentId}/messages`,
        { headers: authHeaders }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load messages.");
      }

      const list = Array.isArray(data) ? data : data.messages || [];

      setMessages((previous) => {
        const byId = new Map();

        [...previous, ...list].forEach((message, index) => {
          const key = message.id ?? `${message.user_id}-${message.created_at}-${index}`;
          byId.set(String(key), message);
        });

        return [...byId.values()].sort((a, b) => {
          const timeA = new Date(a.created_at || 0).getTime();
          const timeB = new Date(b.created_at || 0).getTime();
          return timeA - timeB;
        });
      });

      setChatError("");
    } catch (err) {
      setChatError(err.message || "Unable to load chat messages.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId, token]);

  useEffect(() => {
    if (!appointment) return;

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);

    return () => clearInterval(interval);
  }, [appointment, fetchMessages]);

  async function sendMessage(event) {
    event?.preventDefault();

    const message = messageText.trim();

    if (!message || sendingMessage) return;

    try {
      setSendingMessage(true);
      setChatError("");

      const response = await fetch(
        `${API_URL}/appointments/${appointmentId}/messages`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ message }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Message could not be sent.");
      }

      const savedMessage = data.message || data;

      if (savedMessage.id != null) {
        setMessages((previous) => {
          const exists = previous.some(
            (item) => String(item.id) === String(savedMessage.id)
          );

          return exists ? previous : [...previous, savedMessage];
        });
      } else {
        await fetchMessages();
      }

      setMessageText("");
      await fetchMessages();
    } catch (err) {
      setChatError(err.message || "Message could not be sent.");
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
  // CAMERA AND MICROPHONE
  // --------------------------------------------------

  async function startMedia() {
    try {
      setMediaError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera access requires a supported browser and a secure connection."
        );
      }

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

      setCameraOn(stream.getVideoTracks().some((track) => track.enabled));
      setMicOn(stream.getAudioTracks().some((track) => track.enabled));

      return stream;
    } catch (err) {
      setMediaError(
        err.name === "NotAllowedError"
          ? "Camera or microphone permission was denied. Allow access in your browser settings."
          : err.message || "Unable to access the camera or microphone."
      );

      setMicOn(false);
      setCameraOn(false);
      return null;
    }
  }

  // --------------------------------------------------
  // SOCKET.IO SIGNALING
  // Only the doctor creates the initial offer.
  // --------------------------------------------------

  useEffect(() => {
    if (!appointment || !token) return;

    let cancelled = false;
    let socket;

    async function connectConsultation() {
      try {
        const stream = await startMedia();

        if (cancelled) {
          stream?.getTracks().forEach((track) => track.stop());
          return;
        }

        socket = io(SOCKET_URL, {
          transports: ["websocket", "polling"],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit("join-consultation", {
            appointmentId,
            user: {
              id: user.id,
              name: user.name,
              role: user.role,
            },
          });
        });

        socket.on("room-status", async ({ participantCount }) => {
          const connected = participantCount > 1;
          setParticipantConnected(connected);

          if (!connected || !isDoctor) return;

          const pc = createPeerConnection();

          // Avoid creating a second offer if negotiation already started.
          if (
            pc.signalingState !== "stable" ||
            pc.localDescription
          ) {
            return;
          }

          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit("webrtc-offer", {
              appointmentId,
              offer: pc.localDescription,
            });
          } catch (err) {
            console.error("Could not create WebRTC offer:", err);
          }
        });

        socket.on("participant-joined", async () => {
          setParticipantConnected(true);

          // The doctor is the designated offer creator. This prevents
          // both users from sending competing offers.
          if (!isDoctor) return;

          const pc = createPeerConnection();

          if (pc.signalingState !== "stable" || pc.localDescription) {
            return;
          }

          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit("webrtc-offer", {
              appointmentId,
              offer: pc.localDescription,
            });
          } catch (err) {
            console.error("Offer creation failed:", err);
          }
        });

        socket.on("webrtc-offer", async ({ offer }) => {
          if (isDoctor) return;

          try {
            const pc = createPeerConnection();

            await pc.setRemoteDescription(
              new RTCSessionDescription(offer)
            );

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit("webrtc-answer", {
              appointmentId,
              answer: pc.localDescription,
            });
          } catch (err) {
            console.error("Could not process WebRTC offer:", err);
          }
        });

        socket.on("webrtc-answer", async ({ answer }) => {
          if (!isDoctor) return;

          const pc = peerConnectionRef.current;
          if (!pc || pc.signalingState !== "have-local-offer") return;

          try {
            await pc.setRemoteDescription(
              new RTCSessionDescription(answer)
            );
          } catch (err) {
            console.error("Could not process WebRTC answer:", err);
          }
        });

        socket.on("ice-candidate", async ({ candidate }) => {
          const pc = peerConnectionRef.current;

          if (!pc || !candidate) return;

          try {
            await pc.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          } catch (err) {
            // ICE candidates can arrive before the remote description.
            // Log this for debugging; the connection may still recover.
            console.warn("Could not add ICE candidate:", err);
          }
        });

        socket.on("participant-left", () => {
          setParticipantConnected(false);

          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }

          if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
          }
        });

        socket.on("connect_error", (err) => {
          console.error("Signaling connection error:", err.message);
          setMediaError(
            "Could not connect to the consultation server. Check that the backend is running."
          );
        });
      } catch (err) {
        console.error("Consultation startup error:", err);
        setMediaError(err.message || "Could not start the consultation.");
      }
    }

    connectConsultation();

    return () => {
      cancelled = true;

      if (socket) {
        socket.emit("leave-consultation", { appointmentId });
        socket.removeAllListeners();
        socket.disconnect();
      }

      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      if (peerConnectionRef.current) {
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;

      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment, appointmentId, token, user.id, user.name, user.role]);

  // --------------------------------------------------
  // MEDIA CONTROLS
  // --------------------------------------------------

  function toggleMicrophone() {
    const tracks = localStreamRef.current?.getAudioTracks() || [];
    if (!tracks.length) {
      setMediaError("Microphone is not available.");
      return;
    }

    const nextEnabled = !tracks.some((track) => track.enabled);
    tracks.forEach((track) => {
      track.enabled = nextEnabled;
    });

    setMicOn(nextEnabled);
  }

  function toggleCamera() {
    const tracks = localStreamRef.current?.getVideoTracks() || [];
    if (!tracks.length) {
      setMediaError("Camera is not available.");
      return;
    }

    const nextEnabled = !tracks.some((track) => track.enabled);
    tracks.forEach((track) => {
      track.enabled = nextEnabled;
    });

    setCameraOn(nextEnabled);
  }

  async function shareScreen() {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error("Screen sharing is not supported in this browser.");
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      screenStreamRef.current = screenStream;

      const screenTrack = screenStream.getVideoTracks()[0];
      const pc = peerConnectionRef.current;

      const videoSender = pc
        ?.getSenders()
        .find((sender) => sender.track?.kind === "video");

      if (videoSender && screenTrack) {
        await videoSender.replaceTrack(screenTrack);
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
        localVideoRef.current.play().catch(() => {});
      }

      if (screenTrack) {
        screenTrack.onended = async () => {
          const cameraTrack =
            localStreamRef.current?.getVideoTracks()[0];

          if (videoSender && cameraTrack) {
            await videoSender.replaceTrack(cameraTrack);
          }

          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
            localVideoRef.current.play().catch(() => {});
          }

          screenStream.getTracks().forEach((track) => track.stop());
          screenStreamRef.current = null;
        };
      }
    } catch (err) {
      if (err.name !== "NotAllowedError") {
        setMediaError(err.message || "Unable to share your screen.");
      }
    }
  }

  // --------------------------------------------------
  // END CONSULTATION
  // --------------------------------------------------

  async function endConsultation() {
    const confirmed = window.confirm(
      "Leave this online consultation?"
    );

    if (!confirmed) return;

    // Stop local media and close connections immediately.
    socketRef.current?.emit("leave-consultation", { appointmentId });
    socketRef.current?.disconnect();
    socketRef.current = null;

    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;

    // Do not mark an appointment Completed merely because one user
    // leaves. The doctor should complete it through the proper workflow.
    navigate(
      isDoctor ? "/doctor-appointments" : "/patient-appointments"
    );
  }

  // --------------------------------------------------
  // LOADING / ERROR STATES
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="consultation-loading">
        <div className="loading-spinner" />
        <h2>Preparing consultation room...</h2>
        <p>Please wait while we load your appointment.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="consultation-error-page">
        <div className="consultation-error-card">
          <div className="error-icon">⚠️</div>
          <h2>Unable to Join Consultation</h2>
          <p>{error}</p>
          <button
            onClick={() =>
              navigate(
                isDoctor
                  ? "/doctor-appointments"
                  : "/patient-appointments"
              )
            }
          >
            ← Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  if (!appointment) return null;

  const otherPersonName = isDoctor
    ? appointment.patient_name || "Patient"
    : appointment.doctor_name || "Doctor";

  // --------------------------------------------------
  // CONSULTATION ROOM
  // --------------------------------------------------

  return (
    <div className="consultation-room">
      <header className="consultation-header">
        <div className="consultation-brand">
          <div className="brand-icon">+</div>
          <div>
            <h1>MediCare+</h1>
            <span>Secure Online Consultation</span>
          </div>
        </div>

        <div className="consultation-status">
          <span
            className={`status-dot ${
              participantConnected ? "status-connected" : ""
            }`}
          />
          {participantConnected
            ? "Connected"
            : "Waiting for participant"}
        </div>
      </header>

      <main className="consultation-main">
        <section className="video-section">
          <div className="remote-video-card">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="remote-video"
            />

            {!participantConnected && (
              <div className="remote-video-placeholder">
                <div className="participant-avatar">
                  {otherPersonName.charAt(0).toUpperCase()}
                </div>
                <h2>
                  {isDoctor ? otherPersonName : `Dr. ${otherPersonName}`}
                </h2>
                <p>Waiting for video connection...</p>
              </div>
            )}

            <div className="participant-label">
              {isDoctor ? "Patient" : "Doctor"}
            </div>
          </div>

          <div className="local-video-card">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="local-video"
            />

            {!cameraOn && (
              <div className="camera-off-overlay">
                <div className="camera-off-icon">📷</div>
                <span>Camera Off</span>
              </div>
            )}

            <div className="self-label">You</div>
          </div>

          {mediaError && (
            <div className="media-error" role="alert">
              ⚠️ {mediaError}
            </div>
          )}

          <div className="consultation-controls">
            <button
              className={`control-btn ${!micOn ? "control-off" : ""}`}
              onClick={toggleMicrophone}
              title={micOn ? "Mute microphone" : "Unmute microphone"}
              aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
            >
              {micOn ? "🎙️" : "🔇"}
            </button>

            <button
              className={`control-btn ${!cameraOn ? "control-off" : ""}`}
              onClick={toggleCamera}
              title={cameraOn ? "Turn camera off" : "Turn camera on"}
              aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
            >
              {cameraOn ? "📹" : "🚫"}
            </button>

            <button
              className="control-btn"
              onClick={shareScreen}
              title="Share screen"
              aria-label="Share screen"
            >
              🖥️
            </button>

            <button
              className={`control-btn ${
                chatOpen ? "control-active" : ""
              }`}
              onClick={() => setChatOpen((open) => !open)}
              title="Open chat"
              aria-label="Toggle chat"
            >
              💬
            </button>

            <button className="end-call-btn" onClick={endConsultation}>
              📞 Leave
            </button>
          </div>
        </section>

        <aside className="consultation-sidebar">
          <div className="sidebar-header">
            <h2>Consultation Details</h2>
            <span>#{appointment.id}</span>
          </div>

          <div className="consultation-detail">
            <span>📅 Date</span>
            <strong>{appointment.appointment_date || "Not available"}</strong>
          </div>

          <div className="consultation-detail">
            <span>⏰ Scheduled time</span>
            <strong>{appointment.appointment_time || "Not available"}</strong>
          </div>

          <div className="consultation-detail">
            <span>👤 {isDoctor ? "Patient" : "Doctor"}</span>
            <strong>
              {isDoctor ? otherPersonName : `Dr. ${otherPersonName}`}
            </strong>
          </div>

          {appointment.specialization && (
            <div className="consultation-detail">
              <span>🩺 Specialization</span>
              <strong>{appointment.specialization}</strong>
            </div>
          )}

          {appointment.symptoms && (
            <div className="symptoms-panel">
              <span>Symptoms</span>
              <p>{appointment.symptoms}</p>
            </div>
          )}

          {chatOpen && (
            <div className="chat-panel">
              <div className="chat-header">
                <span>Appointment Chat</span>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  aria-label="Close chat"
                >
                  ×
                </button>
              </div>

              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="chat-empty">
                    💬
                    <p>No messages yet.</p>
                  </div>
                ) : (
                  messages.map((item, index) => {
                    const senderId =
                      item.user_id ?? item.sender_id ?? item.user?.id;

                    const ownMessage =
                      String(senderId) === String(user.id);

                    return (
                      <div
                        key={item.id ?? `${item.created_at}-${index}`}
                        className={`chat-message ${
                          ownMessage ? "my-message" : "other-message"
                        }`}
                      >
                        <strong>
                          {item.user_name ||
                            item.sender_name ||
                            item.user?.name ||
                            (ownMessage ? "You" : "Participant")}
                        </strong>
                        <p>{item.message || item.content}</p>
                        {item.created_at && (
                          <small>
                            {new Date(item.created_at).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </small>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {chatError && (
                <p className="chat-error" role="alert">
                  {chatError}
                </p>
              )}

              <form className="chat-input-row" onSubmit={sendMessage}>
                <input
                  type="text"
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder="Type a message..."
                  maxLength={2000}
                  aria-label="Chat message"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim() || sendingMessage}
                >
                  {sendingMessage ? "…" : "➤"}
                </button>
              </form>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

export default OnlineConsultation;
