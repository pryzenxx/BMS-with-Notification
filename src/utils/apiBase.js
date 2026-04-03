// Centralized API base URL for both local dev and production (Vercel).
// Set VITE_API_URL in Vercel to your Render backend URL, e.g. https://your-service.onrender.com
export const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
export const API_BASE = `${API_ORIGIN}/api`;

