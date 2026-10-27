type ShareChatQueue = (
  eventName: string,
  eventType: string,
  meta?: Record<string, unknown>,
) => void;

/** ShareChat's pre-defined free-trial event. Call flow does not use this. */
export function sendShareChatStartTrial(): void {
  if (typeof window === "undefined") return;
  const scq = (window as Window & { scq?: ShareChatQueue }).scq;
  if (typeof scq !== "function") return;
  scq("Start trial", "pre_defined");
}
