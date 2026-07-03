import React, { useEffect, useState } from 'react';
import { serverStatus } from '../lib/serverStatus';
import Spinner from './ui/Spinner';

// Shows a small, non-blocking pill when a request is taking a long time —
// usually the Render free-tier backend cold-starting after idle (~50s). Driven
// by the axios interceptors in config.js via the serverStatus pub/sub.
// It sits at the bottom centre and is pointer-events-none so it never covers
// or blocks the navbar or any controls.
export default function ServerWakingBanner() {
  const [waking, setWaking] = useState(serverStatus.waking);

  useEffect(() => serverStatus.subscribe(setWaking), []);

  if (!waking) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 inset-x-0 z-[300] flex justify-center px-4 animate-fade-in-up">
      <div className="flex items-center gap-2 rounded-full bg-stone-900/90 dark:bg-stone-800/90 text-white text-sm font-medium py-2 px-4 shadow-card backdrop-blur">
        <Spinner size={15} />
        Waking up the server — this can take up to a minute…
      </div>
    </div>
  );
}
