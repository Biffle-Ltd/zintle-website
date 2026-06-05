
const TIMER_SESSION_KEY = "zintle_coin_store_timer_end";

/** Random duration under 24h (subtract 1–8 hours from 24h), persisted per tab session. */
export function getCoinStoreTimerEndMs(): number {
  if (typeof sessionStorage !== "undefined") {
    const stored = sessionStorage.getItem(TIMER_SESSION_KEY);
    if (stored) {
      const n = Number(stored);
      if (Number.isFinite(n) && n > Date.now()) return n;
    }
  }

  const hoursToSubtract = 1 + Math.floor(Math.random() * 8);
  const durationMs = (24 - hoursToSubtract) * 60 * 60 * 1000;
  const end = Date.now() + durationMs;

  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(TIMER_SESSION_KEY, String(end));
  }
  return end;
}

export function formatCountdown(remainingMs: number): string {
  const total = Math.max(0, Math.floor(remainingMs / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${h}h:${pad(m)}m:${pad(s)}s`;
}
