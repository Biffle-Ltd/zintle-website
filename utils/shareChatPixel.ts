type ShareChatQueue = (
  eventName: string,
  eventType: string,
  meta?: Record<string, unknown>,
) => void;

/**
 * Query params on ShareChat's test link. While pixel tracking is still off,
 * the browser script drops events unless these are on the page or were saved
 * from an earlier page in this tab.
 */
export const SHARE_CHAT_VERIFY_QUERY_KEYS = [
  "verify",
  "campaignId",
  "creativeId",
  "adsUuid",
  "advertiserId",
] as const;

const SHARE_CHAT_VERIFY_STORAGE_KEY = "zintle_sharechat_verify_query";

function searchParamsFrom(search: string): URLSearchParams {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(raw);
}

export function copyShareChatVerifyParams(
  source: URLSearchParams,
  target: URLSearchParams,
): void {
  for (const key of SHARE_CHAT_VERIFY_QUERY_KEYS) {
    const value = source.get(key)?.trim() ?? "";
    if (value) target.set(key, value);
  }
}

/** Fills keys the current page lost. Returns true when `current` changed. */
export function fillMissingShareChatVerifyParams(
  current: URLSearchParams,
  remembered: URLSearchParams,
): boolean {
  let changed = false;
  for (const key of SHARE_CHAT_VERIFY_QUERY_KEYS) {
    if (current.get(key)?.trim()) continue;
    const value = remembered.get(key)?.trim() ?? "";
    if (!value) continue;
    current.set(key, value);
    changed = true;
  }
  return changed;
}

export function shareChatVerifySearchHasParams(search: string): boolean {
  const params = searchParamsFrom(search);
  return SHARE_CHAT_VERIFY_QUERY_KEYS.some(
    (key) => (params.get(key)?.trim() ?? "") !== "",
  );
}

export function rememberShareChatVerifySearch(search: string): void {
  if (typeof sessionStorage === "undefined") return;
  if (!shareChatVerifySearchHasParams(search)) return;
  const kept = new URLSearchParams();
  copyShareChatVerifyParams(searchParamsFrom(search), kept);
  try {
    sessionStorage.setItem(SHARE_CHAT_VERIFY_STORAGE_KEY, kept.toString());
  } catch {
    /* private mode */
  }
}

export function clearShareChatVerifySearch(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(SHARE_CHAT_VERIFY_STORAGE_KEY);
  } catch {
    /* private mode */
  }
}

/** Full replacement search (`?…`) when this tab still has test params the URL lost. */
export function mergeRememberedShareChatVerifySearch(
  search: string,
): string | null {
  if (typeof sessionStorage === "undefined") return null;
  let raw = "";
  try {
    raw = sessionStorage.getItem(SHARE_CHAT_VERIFY_STORAGE_KEY) || "";
  } catch {
    return null;
  }
  if (!raw) return null;
  const current = searchParamsFrom(search);
  if (!fillMissingShareChatVerifyParams(current, new URLSearchParams(raw))) {
    return null;
  }
  const query = current.toString();
  return query ? `?${query}` : null;
}

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
