// Minimal pub/sub bridge so the (non-React) axios interceptors in config.js can
// tell a React banner that the free-tier backend is cold-starting.
let waking = false;
const listeners = new Set();

export const serverStatus = {
  get waking() {
    return waking;
  },
  setWaking(value) {
    if (waking !== value) {
      waking = value;
      listeners.forEach((l) => l(value));
    }
  },
  subscribe(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};
