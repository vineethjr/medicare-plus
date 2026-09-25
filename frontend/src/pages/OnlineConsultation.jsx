import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import "./OnlineConsultation.css";

const SOCKET_URL = "http://localhost:5000";

const rtcConfiguration = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

function OnlineConsultation() {
  const navigate = useNavigate();
  const { appointmentId } = useParams();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  const [chatOpen, setChatOpen] = useState(false);
  const [mediaError, setMediaError] = useState("");

  const [participantConnected, setParticipantConnected] =
    useState(false);

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const localStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);

  const token = localStorage.getItem("token");

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  // ========================================
  // FETCH APPOINTMENT
  // ========================================

  useEffect(() => {
    async function fetchAppointment() {
      try {
        setLoading(true);
        setError("");

        if (!token) {
          throw new Error(
            "Please login to access the consultation."
          );
        }

        const role =
          user.role === "doctor"
            ? "doctor"
            : "patient";

        const response = await fetch(
          `${SOCKET_URL}/api/appointments/${role}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load consultation."
          );
        }

        const foundAppointment = data.find(
          (item) =>
            String(item.id) ===
            String(appointmentId)
        );

        if (!foundAppointment) {
          throw new Error(
            "Appointment not found."
          );
        }

        if (
          foundAppointment.consultation_mode !==
          "Online"
        ) {
          throw new Error(
            "This appointment is not an online consultation."
          );
        }

        setAppointment(foundAppointment);
      } catch (error) {
        console.error(
          "Consultation error:",
          error
        );

        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAppointment();
  }, [appointmentId, token, user.role]);

  // ========================================
  // CREATE PEER CONNECTION
  // ========================================

  function createPeerConnection() {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const peerConnection =
      new RTCPeerConnection(
        rtcConfiguration
      );

    peerConnectionRef.current =
      peerConnection;

    // Add local camera and microphone
    if (localStreamRef.current) {
      localStreamRef.current
        .getTracks()
        .forEach((track) => {
          peerConnection.addTrack(
            track,
            localStreamRef.current
          );
        });
    }

    // Receive remote tracks
    peerConnection.ontrack = (event) => {
      console.log(
        "Remote media received"
      );

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject =
          event.streams[0];
      }

      setParticipantConnected(true);
    };

    // Send ICE candidates
    peerConnection.onicecandidate = (
      event
    ) => {
      if (
        event.candidate &&
        socketRef.current
      ) {
        socketRef.current.emit(
          "ice-candidate",
          {
            appointmentId,
            candidate: event.candidate,
          }
        );
      }
    };

    peerConnection.onconnectionstatechange =
      () => {
        console.log(
          "WebRTC connection state:",
          peerConnection.connectionState
        );

        if (
          peerConnection.connectionState ===
          "connected"
        ) {
          setParticipantConnected(true);
        }

        if (
          peerConnection.connectionState ===
            "disconnected" ||
          peerConnection.connectionState ===
            "failed" ||
          peerConnection.connectionState ===
            "closed"
        ) {
          setParticipantConnected(false);
        }
      };

    return peerConnection;
  }

  // ========================================
  // START MEDIA
  // ========================================

  async function startMedia() {
    try {
      setMediaError("");

      if (!navigator.mediaDevices) {
        throw new Error(
          "Camera and microphone are not supported by this browser."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: true,
            audio: true,
          }
        );

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject =
          stream;
      }

      return stream;
    } catch (error) {
      console.error(
        "Media permission error:",
        error
      );

      setMediaError(
        "Camera or microphone permission was denied. Please allow access in your browser."
      );

      setMicOn(false);
      setCameraOn(false);

      return null;
    }
  }

  // ========================================
  // SOCKET + WEBRTC
  // ========================================

  useEffect(() => {
    if (!appointment) {
      return;
    }

    let cancelled = false;

    async function startConsultation() {
      try {
        // First start camera/microphone
        const stream =
          await startMedia();

        if (cancelled) {
          return;
        }

        // Connect Socket.IO
        const socket = io(SOCKET_URL);

        socketRef.current = socket;

        // ==================================
        // SOCKET CONNECTED
        // ==================================

        socket.on("connect", () => {
          console.log(
            "Connected to signaling server:",
            socket.id
          );

          socket.emit(
            "join-consultation",
            {
              appointmentId,
              user: {
                id: user.id,
                name: user.name,
                role: user.role,
              },
            }
          );
        });

        // ==================================
        // PARTICIPANT JOINED
        // ==================================

        socket.on(
          "participant-joined",
          async () => {
            console.log(
              "Other participant joined"
            );

            setParticipantConnected(true);

            const peerConnection =
              createPeerConnection();

            try {
              const offer =
                await peerConnection.createOffer();

              await peerConnection.setLocalDescription(
                offer
              );

              socket.emit(
                "webrtc-offer",
                {
                  appointmentId,
                  offer,
                }
              );
            } catch (error) {
              console.error(
                "Offer error:",
                error
              );
            }
          }
        );

        // ==================================
        // RECEIVE OFFER
        // ==================================

        socket.on(
          "webrtc-offer",
          async ({ offer }) => {
            console.log(
              "Received WebRTC offer"
            );

            const peerConnection =
              createPeerConnection();

            try {
              await peerConnection.setRemoteDescription(
                new RTCSessionDescription(
                  offer
                )
              );

              const answer =
                await peerConnection.createAnswer();

              await peerConnection.setLocalDescription(
                answer
              );

              socket.emit(
                "webrtc-answer",
                {
                  appointmentId,
                  answer,
                }
              );
            } catch (error) {
              console.error(
                "Answer error:",
                error
              );
            }
          }
        );

        // ==================================
        // RECEIVE ANSWER
        // ==================================

        socket.on(
          "webrtc-answer",
          async ({ answer }) => {
            console.log(
              "Received WebRTC answer"
            );

            const peerConnection =
              peerConnectionRef.current;

            if (!peerConnection) {
              return;
            }

            try {
              await peerConnection.setRemoteDescription(
                new RTCSessionDescription(
                  answer
                )
              );
            } catch (error) {
              console.error(
                "Remote description error:",
                error
              );
            }
          }
        );

        // ==================================
        // ICE CANDIDATE
        // ==================================

        socket.on(
          "ice-candidate",
          async ({ candidate }) => {
            const peerConnection =
              peerConnectionRef.current;

            if (!peerConnection) {
              return;
            }

            try {
              await peerConnection.addIceCandidate(
                new RTCIceCandidate(
                  candidate
                )
              );
            } catch (error) {
              console.error(
                "ICE candidate error:",
                error
              );
            }
          }
        );

        // ==================================
        // PARTICIPANT LEFT
        // ==================================

        socket.on(
          "participant-left",
          () => {
            console.log(
              "Other participant left"
            );

            setParticipantConnected(false);

            if (
              remoteVideoRef.current
            ) {
              remoteVideoRef.current.srcObject =
                null;
            }

            if (
              peerConnectionRef.current
            ) {
              peerConnectionRef.current.close();

              peerConnectionRef.current =
                null;
            }
          }
        );

        // ==================================
        // ROOM STATUS
        // ==================================

        socket.on(
          "room-status",
          ({ participantCount }) => {
            console.log(
              "Participants:",
              participantCount
            );

            setParticipantConnected(
              participantCount > 1
            );
          }
        );

        // ==================================
        // CHAT
        // ==================================

        socket.on(
          "consultation-message",
          (message) => {
            setMessages((previous) => [
              ...previous,
              message,
            ]);
          }
        );
      } catch (error) {
        console.error(
          "Consultation startup error:",
          error
        );
      }
    }

    startConsultation();

    // ======================================
    // CLEANUP
    // ======================================

    return () => {
      cancelled = true;

      if (socketRef.current) {
        socketRef.current.emit(
          "leave-consultation",
          {
            appointmentId,
          }
        );

        socketRef.current.disconnect();

        socketRef.current = null;
      }

      if (
        peerConnectionRef.current
      ) {
        peerConnectionRef.current.close();

        peerConnectionRef.current = null;
      }

      if (
        localStreamRef.current
      ) {
        localStreamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        localStreamRef.current = null;
      }
    };
  }, [appointment, appointmentId]);

  // ========================================
  // MICROPHONE
  // ========================================

  function toggleMicrophone() {
    if (!localStreamRef.current) {
      return;
    }

    const audioTracks =
      localStreamRef.current.getAudioTracks();

    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });

    setMicOn(
      audioTracks.some(
        (track) => track.enabled
      )
    );
  }

  // ========================================
  // CAMERA
  // ========================================

  function toggleCamera() {
    if (!localStreamRef.current) {
      return;
    }

    const videoTracks =
      localStreamRef.current.getVideoTracks();

    videoTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });

    setCameraOn(
      videoTracks.some(
        (track) => track.enabled
      )
    );
  }

  // ========================================
  // SCREEN SHARE
  // ========================================

  async function shareScreen() {
    try {
      if (
        !navigator.mediaDevices?.getDisplayMedia
      ) {
        alert(
          "Screen sharing is not supported by this browser."
        );

        return;
      }

      const screenStream =
        await navigator.mediaDevices.getDisplayMedia(
          {
            video: true,
          }
        );

      const screenTrack =
        screenStream.getVideoTracks()[0];

      const peerConnection =
        peerConnectionRef.current;

      if (peerConnection) {
        const sender =
          peerConnection
            .getSenders()
            .find(
              (item) =>
                item.track?.kind ===
                "video"
            );

        if (sender) {
          await sender.replaceTrack(
            screenTrack
          );
        }
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject =
          screenStream;
      }

      screenTrack.onended = async () => {
        const cameraTrack =
          localStreamRef.current?.getVideoTracks()[0];

        if (cameraTrack) {
          const peerConnection =
            peerConnectionRef.current;

          if (peerConnection) {
            const sender =
              peerConnection
                .getSenders()
                .find(
                  (item) =>
                    item.track?.kind ===
                    "video"
                );

            if (sender) {
              await sender.replaceTrack(
                cameraTrack
              );
            }
          }

          if (
            localVideoRef.current
          ) {
            localVideoRef.current.srcObject =
              localStreamRef.current;
          }
        }
      };
    } catch (error) {
      console.log(
        "Screen sharing cancelled."
      );
    }
  }

  // ========================================
  // SEND CHAT MESSAGE
  // ========================================

  function sendMessage() {
    const message =
      messageText.trim();

    if (
      !message ||
      !socketRef.current
    ) {
      return;
    }

    socketRef.current.emit(
      "consultation-message",
      {
        appointmentId,
        message,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
      }
    );

    setMessageText("");
  }

  // ========================================
  // END CONSULTATION
  // ========================================

  function endConsultation() {
    const confirmed =
      window.confirm(
        "Are you sure you want to leave the consultation?"
      );

    if (!confirmed) {
      return;
    }

    if (socketRef.current) {
      socketRef.current.emit(
        "leave-consultation",
        {
          appointmentId,
        }
      );

      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (
      peerConnectionRef.current
    ) {
      peerConnectionRef.current.close();

      peerConnectionRef.current = null;
    }

    if (
      localStreamRef.current
    ) {
      localStreamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      localStreamRef.current = null;
    }

    if (user.role === "doctor") {
      navigate(
        "/doctor-appointments"
      );
    } else {
      navigate(
        "/patient-appointments"
      );
    }
  }

  // ========================================
  // LOADING
  // ========================================

  if (loading) {
    return (
      <div className="consultation-loading">

        <div className="loading-spinner"></div>

        <h2>
          Preparing consultation room...
        </h2>

        <p>
          Please wait while we connect you.
        </p>

      </div>
    );
  }

  // ========================================
  // ERROR
  // ========================================

  if (error) {
    return (
      <div className="consultation-error-page">

        <div className="consultation-error-card">

          <div className="error-icon">
            ⚠️
          </div>

          <h2>
            Unable to Join Consultation
          </h2>

          <p>
            {error}
          </p>

          <button
            onClick={() =>
              user.role === "doctor"
                ? navigate(
                    "/doctor-appointments"
                  )
                : navigate(
                    "/patient-appointments"
                  )
            }
          >
            ← Back to Appointments
          </button>

        </div>

      </div>
    );
  }

  const isDoctor =
    user.role === "doctor";

  const otherPersonName = isDoctor
    ? appointment.patient_name
    : appointment.doctor_name;

  return (
    <div className="consultation-room">

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="consultation-header">

        <div className="consultation-brand">

          <div className="brand-icon">
            +
          </div>

          <div>
            <h1>
              MediCare+
            </h1>

            <span>
              Secure Online Consultation
            </span>
          </div>

        </div>

        <div className="consultation-status">

          <span className="status-dot"></span>

          {participantConnected
            ? "Connected"
            : "Waiting for participant"}

        </div>

      </header>

      {/* ======================================
          MAIN
      ====================================== */}

      <main className="consultation-main">

        <section className="video-section">

          {/* ==================================
              REMOTE VIDEO
          ================================== */}

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
                  {otherPersonName
                    ?.charAt(0)
                    .toUpperCase() || "?"}
                </div>

                <h2>
                  {isDoctor
                    ? appointment.patient_name ||
                      "Patient"
                    : `Dr. ${
                        appointment.doctor_name ||
                        "Doctor"
                      }`}
                </h2>

                <p>
                  Waiting for video connection...
                </p>

              </div>
            )}

            <div className="participant-label">

              {isDoctor
                ? "Patient"
                : "Doctor"}

            </div>

          </div>

          {/* ==================================
              LOCAL VIDEO
          ================================== */}

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

                <div className="camera-off-icon">
                  📷
                </div>

                <span>
                  Camera Off
                </span>

              </div>
            )}

            <div className="self-label">
              You
            </div>

          </div>

          {/* ==================================
              MEDIA ERROR
          ================================== */}

          {mediaError && (
            <div className="media-error">

              <span>
                ⚠️
              </span>

              {mediaError}

            </div>
          )}

          {/* ==================================
              CONTROLS
          ================================== */}

          <div className="consultation-controls">

            <button
              className={`control-btn ${
                !micOn
                  ? "control-off"
                  : ""
              }`}
              onClick={
                toggleMicrophone
              }
              title={
                micOn
                  ? "Mute microphone"
                  : "Unmute microphone"
              }
            >
              {micOn
                ? "🎙️"
                : "🔇"}
            </button>

            <button
              className={`control-btn ${
                !cameraOn
                  ? "control-off"
                  : ""
              }`}
              onClick={
                toggleCamera
              }
              title={
                cameraOn
                  ? "Turn camera off"
                  : "Turn camera on"
              }
            >
              {cameraOn
                ? "📹"
                : "🚫"}
            </button>

            <button
              className="control-btn"
              onClick={
                shareScreen
              }
              title="Share screen"
            >
              🖥️
            </button>

            <button
              className={`control-btn ${
                chatOpen
                  ? "control-active"
                  : ""
              }`}
              onClick={() =>
                setChatOpen(
                  !chatOpen
                )
              }
              title="Open chat"
            >
              💬
            </button>

            <button
              className="end-call-btn"
              onClick={
                endConsultation
              }
            >
              📞 End
            </button>

          </div>

        </section>

        {/* ======================================
            SIDEBAR
        ====================================== */}

        <aside className="consultation-sidebar">

          <div className="sidebar-header">

            <h2>
              Consultation Details
            </h2>

            <span>
              #{appointment.id}
            </span>

          </div>

          <div className="consultation-detail">

            <span>
              📅 Date
            </span>

            <strong>
              {appointment.appointment_date}
            </strong>

          </div>

          <div className="consultation-detail">

            <span>
              ⏰ Time
            </span>

            <strong>
              {appointment.appointment_time}
            </strong>

          </div>

          <div className="consultation-detail">

            <span>
              👤{" "}
              {isDoctor
                ? "Patient"
                : "Doctor"}
            </span>

            <strong>
              {isDoctor
                ? appointment.patient_name
                : `Dr. ${
                    appointment.doctor_name ||
                    "Doctor"
                  }`}
            </strong>

          </div>

          {!isDoctor &&
            appointment.specialization && (
              <div className="consultation-detail">

                <span>
                  🩺 Specialization
                </span>

                <strong>
                  {appointment.specialization}
                </strong>

              </div>
            )}

          {appointment.symptoms && (
            <div className="symptoms-panel">

              <span>
                Symptoms
              </span>

              <p>
                {appointment.symptoms}
              </p>

            </div>
          )}

          {/* ==================================
              CHAT
          ================================== */}

          {chatOpen && (
            <div className="chat-panel">

              <div className="chat-header">
                Consultation Chat
              </div>

              <div className="chat-messages">

                {messages.length === 0 ? (
                  <div className="chat-empty">

                    💬

                    <p>
                      No messages yet.
                    </p>

                  </div>
                ) : (
                  messages.map(
                    (item, index) => (
                      <div
                        className={`chat-message ${
                          item.user?.id ===
                          user.id
                            ? "my-message"
                            : "other-message"
                        }`}
                        key={index}
                      >
                        <strong>
                          {item.user?.name ||
                            "User"}
                        </strong>

                        <p>
                          {item.message}
                        </p>
                      </div>
                    )
                  )
                )}

              </div>

              <div className="chat-input-row">

                <input
                  type="text"
                  value={
                    messageText
                  }
                  onChange={(event) =>
                    setMessageText(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                />

                <button
                  onClick={
                    sendMessage
                  }
                >
                  ➤
                </button>

              </div>

            </div>
          )}

        </aside>

      </main>

    </div>
  );
}

export default OnlineConsultation;