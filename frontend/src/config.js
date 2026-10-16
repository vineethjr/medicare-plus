// Centralized configuration for API endpoints and WebSockets
const envBackendUrl = import.meta.env.VITE_BACKEND_URL;

// Deployed Render live backend URL
const PRODUCTION_BACKEND_URL = "https://medicare-backend-os98.onrender.com";

export const BACKEND_URL = envBackendUrl
  ? envBackendUrl.replace(/\/+$/, "")
  : typeof window !== "undefined" && window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : PRODUCTION_BACKEND_URL;

export const API_URL = `${BACKEND_URL}/api`;
export const SOCKET_URL = BACKEND_URL;
