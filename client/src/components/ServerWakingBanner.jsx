import React, { useEffect, useState } from 'react';
import { serverStatus } from '../lib/serverStatus';
import Spinner from './ui/Spinner';

// Shows a thin banner when a request is taking a while — usually the Render
// free-tier backend cold-starting after idle (~50s). Driven by the axios
// interceptors in config.js via the serverStatus pub/sub.
export default function ServerWakingBanner() {
  const [waking, setWaking] = useState(serverStatus.waking);

  useEffect(() => serverStatus.subscribe(setWaking), []);

  if (!waking) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[300] flex items-center justify-center gap-2 bg-accent-500 text-white text-sm font-medium py-2 px-4 animate-fade-in">
      <Spinner size={15} />
      Waking up the server — the first request after idle can take up to a minute…
    </div>
  );
}
