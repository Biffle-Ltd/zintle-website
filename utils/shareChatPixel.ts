type ShareChatQueue = (
  eventName: string,
  eventType: string,
  meta?: Record<string, unknown>,
) => void;

function sendShareChatPredefined(eventName: string): void {
  if (typeof window === "undefined") return;
  const scq = (window as Window & { scq?: ShareChatQueue }).scq;
  if (typeof scq !== "function") return;
  scq(eventName, "pre_defined");
}

/** ShareChat's pre-defined free-trial event. Call flow does not use this. */
export function sendShareChatStartTrial(): void {
  sendShareChatPredefined("Start trial");
}

/** Fires when the free-trial page Start Free Trial button is clicked. */
export function sendShareChatViewContent(): void {
  sendShareChatPredefined("View content");
}

/** Fires when Continue is clicked after language selection on the free-trial flow. */
export function sendShareChatSubmitApplication(): void {
  sendShareChatPredefined("Submit application");
}
