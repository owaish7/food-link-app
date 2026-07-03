// Central API configuration.
// In production, set VITE_API_URL in your hosting environment (e.g. Vercel)
// to your deployed backend URL, e.g. https://foodlink-api.onrender.com
import axios from "axios";
import { serverStatus } from "./lib/serverStatus";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8800";

// The backend authenticates via an httpOnly `accessToken` cookie. Browsers only
// attach that cookie to cross-origin XHR when withCredentials is set, so enable
// it globally for every axios request.
axios.defaults.withCredentials = true;

// Fail rather than hang forever if the backend never responds.
axios.defaults.timeout = 90000;

// Track in-flight requests; if anything is slow for >3s (typically the Render
// free-tier backend cold-starting), surface a "waking up" banner globally.
let inflight = 0;
let wakeTimer = null;

const onStart = () => {
  inflight += 1;
  if (inflight === 1 && !wakeTimer) {
    wakeTimer = setTimeout(() => serverStatus.setWaking(true), 3000);
  }
};

const onEnd = () => {
  inflight = Math.max(0, inflight - 1);
  if (inflight === 0) {
    clearTimeout(wakeTimer);
    wakeTimer = null;
    serverStatus.setWaking(false);
  }
};

axios.interceptors.request.use(
  (c) => {
    onStart();
    return c;
  },
  (e) => {
    onEnd();
    return Promise.reject(e);
  }
);

axios.interceptors.response.use(
  (r) => {
    onEnd();
    return r;
  },
  (e) => {
    onEnd();
    return Promise.reject(e);
  }
);
