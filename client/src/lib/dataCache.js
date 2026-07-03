// Tiny in-memory cache for stale-while-revalidate. Lets a page re-mount
// (e.g. navigating back from chat) render its last data instantly instead of
// flashing a skeleton, while it refetches fresh data in the background.
// Lives for the session (cleared on full reload) — good enough, no staleness risk
// because pages always refetch on mount and on real-time order_update events.
const store = new Map();

export const readCache = (key) => store.get(key);
export const writeCache = (key, value) => {
  store.set(key, value);
};
export const clearCache = () => store.clear();
