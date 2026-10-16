// Centralized configuration for API endpoints and WebSockets
const rawBackendUrl =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const BACKEND_URL = rawBackendUrl.replace(/\/+$/, "");
export const API_URL = `${BACKEND_URL}/api`;
export const SOCKET_URL = BACKEND_URL;
