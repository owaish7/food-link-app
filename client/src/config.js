// Central API configuration.
// In production, set VITE_API_URL in your hosting environment (e.g. Vercel)
// to your deployed backend URL, e.g. https://foodlink-api.onrender.com
import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8800";

// The backend authenticates via an httpOnly `accessToken` cookie. Browsers only
// attach that cookie to cross-origin XHR when withCredentials is set, so enable
// it globally for every axios request.
axios.defaults.withCredentials = true;
