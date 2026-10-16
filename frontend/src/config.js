// Centralized configuration for API endpoints and WebSockets
const envBackendUrl = import.meta.env.VITE_BACKEND_URL;

export const BACKEND_URL = envBackendUrl
  ? envBackendUrl.replace(/\/+$/, "")
  : typeof window !== "undefined" && window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : "";

export const API_URL = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";
export const SOCKET_URL =
  BACKEND_URL || (typeof window !== "undefined" ? window.location.origin : "");
