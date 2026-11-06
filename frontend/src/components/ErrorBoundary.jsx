import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Clinical System Caught Unhandled Render Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#050b0e",
            color: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "480px",
              width: "100%",
              background: "#0a161c",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "16px",
              padding: "2rem",
              textAlign: "center",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.15)",
                color: "#f87171",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
                fontSize: "1.75rem",
              }}
            >
              ⚠️
            </div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
              Consultation Interface Recovered
            </h2>
            <p style={{ fontSize: "0.88rem", color: "#94a3b8", lineHeight: 1.5, margin: "0 0 1.5rem" }}>
              A temporary display exception occurred while loading the consultation studio. Your appointment and data remain secure.
            </p>
            {this.state.error && (
              <pre
                style={{
                  background: "rgba(0, 0, 0, 0.5)",
                  color: "#fca5a5",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  fontSize: "0.75rem",
                  textAlign: "left",
                  overflowX: "auto",
                  marginBottom: "1.5rem",
                }}
              >
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: "linear-gradient(135deg, #0d9488 0%, #0284c7 100%)",
                  color: "#fff",
                  border: "none",
                  padding: "0.65rem 1.25rem",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Reload Studio
              </button>
              <button
                onClick={() => (window.location.href = "/patient-appointments")}
                style={{
                  background: "transparent",
                  color: "#94a3b8",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  padding: "0.65rem 1.25rem",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Return to Appointments
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
