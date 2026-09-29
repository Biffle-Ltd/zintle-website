import { resolvePageAuthToken, setJwtForOrganisation } from "./authStorage";
import { headerSafeToken } from "./headerSafeToken";
import { HOST } from "./host";
import { ZINTLE_POST_LOGIN_REDIRECT_KEY } from "./postLoginRedirect";
import {
  fetchWebCallProfileOnce,
  userNeedsIdentityGender,
  userNeedsLanguageSelection,
} from "./userProfileApi";
import { persistWebCallLoginOption, readPackIdFromSearch } from "./webCampaign";
import { formatIncomingDisplayName } from "./webCallPreviewCreators";

export type WebCallOffer = {
  pack_configured: boolean;
  is_eligible: boolean;
  already_claimed: boolean;
  coin_pack_id: number | null;
  amount: number | null;
  coin_value: number | null;
  currency: string;
};

export type CallInitiateResult = {
  session_id: string;
  channel_name: string;
  token: string;
  uid: number;
  app_id: string;
};

type ApiError = {
  error_code?: string | null;
  error_message?: string | null;
};

function authHeaders(organisationId: string, authToken: string) {
  const token = headerSafeToken(authToken);
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "X-Organisation-ID": organisationId,
  };
}

export async function fetchWebCallOffer(opts: {
  organisationId: string;
  authToken: string;
  coinPackId?: number | null;
}): Promise<WebCallOffer | null> {
  const url = new URL(`${HOST}/api/v1/monetization/orders/web-call-offer/`);
  if (opts.coinPackId) {
    url.searchParams.set("pack_id", String(opts.coinPackId));
  }
  const r = await fetch(url.toString(), {
    headers: authHeaders(opts.organisationId, opts.authToken),
  });
  const json = (await r.json().catch(() => null)) as { data?: WebCallOffer } | null;
  if (!r.ok || !json?.data) return null;
  return json.data;
}

export async function initiateWebCall(opts: {
  organisationId: string;
  authToken: string;
  creatorId: number;
  callType?: "audio" | "video";
}): Promise<{ ok: true; data: CallInitiateResult } | { ok: false; error: ApiError }> {
  const r = await fetch(`${HOST}/api/v1/call_manager/call/action/`, {
    method: "POST",
    headers: authHeaders(opts.organisationId, opts.authToken),
    body: JSON.stringify({
      action: "initiate",
      creator_id: opts.creatorId,
      call_type: opts.callType || "audio",
    }),
  });
  const json = (await r.json().catch(() => null)) as {
    data?: CallInitiateResult;
    error_code?: string;
    error_message?: string;
  } | null;
  if (!r.ok || !json?.data?.token) {
    return {
      ok: false,
      error: {
        error_code: json?.error_code,
        error_message: json?.error_message,
      },
    };
  }
  return { ok: true, data: json.data };
}

export async function postCallSessionAction(opts: {
  organisationId: string;
  authToken: string;
  action: "end" | "cancel";
  sessionId: string;
}): Promise<void> {
  await fetch(`${HOST}/api/v1/call_manager/call/action/`, {
    method: "POST",
    headers: authHeaders(opts.organisationId, opts.authToken),
    body: JSON.stringify({
      action: opts.action,
      session_id: opts.sessionId,
    }),
  });
}

export async function fetchCallState(opts: {
  organisationId: string;
  authToken: string;
  sessionId: string;
}): Promise<string | null> {
  const url = new URL(`${HOST}/api/v1/call_manager/call/state/`);
  url.searchParams.set("session_id", opts.sessionId);
  const r = await fetch(url.toString(), {
    headers: authHeaders(opts.organisationId, opts.authToken),
  });
  const json = (await r.json().catch(() => null)) as {
    data?: { call_status?: string };
  } | null;
  if (!r.ok) return null;
  return json?.data?.call_status || null;
}

const PENDING_IDENTITY_KEY = "zintle_web_call_pending_identity";

export function savePendingIdentityGender(
  gender: "Male" | "Female" | "Other",
): void {
  sessionStorage.setItem(PENDING_IDENTITY_KEY, gender);
}

export function readPendingIdentityGender(): "Male" | "Female" | "Other" | null {
  const value = sessionStorage.getItem(PENDING_IDENTITY_KEY);
  return value === "Male" || value === "Female" || value === "Other"
    ? value
    : null;
}

export function clearPendingIdentityGender(): void {
  sessionStorage.removeItem(PENDING_IDENTITY_KEY);
}

export function readIdentityGenderFromSearch(
  search: string,
): "Male" | "Female" | "Other" | null {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const value = params.get("identity_gender");
  return value === "Male" || value === "Female" || value === "Other"
    ? value
    : null;
}

export function searchWithIdentityGender(
  search: string,
  gender: "Male" | "Female" | "Other",
): string {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  params.set("identity_gender", gender);
  params.delete("creator_gender");
  const query = params.toString();
  return query ? `?${query}` : "";
}

const PREFS_READY_KEY = "zintle_web_call_prefs_ready";
const LEFT_PREVIEW_KEY = "zintle_web_call_left_preview";
const INCOMING_ACCEPTED_KEY = "zintle_web_call_incoming_accepted";

/** Rupees shown until the offer pack amount loads. Matches the ₹9 welcome pack. */
export const WEB_CALL_OFFER_FALLBACK_RUPEES = 9;

export function isWebCallOfferPreview(search: string): boolean {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  return params.get("preview") === "offer";
}

/** Show in-call quick recharge when wallet cannot cover this many minutes. */
export const WEB_CALL_LOW_BALANCE_MINUTES = 2;
export const WEB_CALL_WALLET_POLL_MS = 60_000;
/** Backup only: Agora/Firestore should end the room. 15s caps stuck-UI lag. */
export const WEB_CALL_STATE_POLL_MS = 15_000;

export function isWebCallLowBalance(
  balance: number,
  pricePerMinute: number | null | undefined,
  minutes = WEB_CALL_LOW_BALANCE_MINUTES,
): boolean {
  if (pricePerMinute == null || !(pricePerMinute > 0)) return false;
  return balance < pricePerMinute * minutes;
}

export type WebCallOnboardingStep =
  | "gender"
  | "language"
  | "paywall"
  | "incoming"
  | "install";

/** JWT from `id=` query or org storage. */
export function resolveWebCallToken(
  organisationId: string,
  search: string,
): string | null {
  const token = resolvePageAuthToken(search, organisationId);
  if (token) setJwtForOrganisation(organisationId, token);
  return token;
}

/**
 * Next screen after login / onboarding, from the live profile.
 * Gender → language → welcome offer if unclaimed → incoming/room after this
 * session's purchase. After the call ends, and for returning users who already
 * claimed the pack, go to install — web has no pre-call coin store.
 */
export async function nextLoggedInWebCallStep(opts: {
  organisationId: string;
  authToken: string;
  coinPackId?: number | null;
  search?: string;
}): Promise<WebCallOnboardingStep> {
  const details = await fetchWebCallProfileOnce(
    opts.authToken,
    opts.organisationId,
  );
  const pendingGender =
    readPendingIdentityGender() ||
    (opts.search != null ? readIdentityGenderFromSearch(opts.search) : null);
  if (userNeedsIdentityGender(details) && !pendingGender) return "gender";
  if (userNeedsLanguageSelection(details)) return "language";
  markWebCallPrefsReady();
  if (webCallCallFinished()) return "install";
  if (webCallOfferPaid()) return "incoming";
  const offer = await fetchWebCallOffer({
    organisationId: opts.organisationId,
    authToken: opts.authToken,
    coinPackId: opts.coinPackId,
  });
  if (!offer) return "paywall";
  if (offer.already_claimed) return "install";
  if (offer.pack_configured) return "paywall";
  return "install";
}

export function webCallPathForStep(
  step: WebCallOnboardingStep | "room" | "incoming",
  search: string,
): string {
  if (step === "paywall") return webCallOfferPath(search);
  if (step === "install") return webCallInstallPath(search);
  return webCallStepPath(step, search);
}

export function requireWebCallLogin(
  pathname: string,
  search: string,
  setShowLogin: (open: boolean) => void,
): void {
  markWebCallLeftPreview();
  persistWebCallLoginOption(search);
  sessionStorage.setItem(
    ZINTLE_POST_LOGIN_REDIRECT_KEY,
    `${pathname}${search}`,
  );
  setShowLogin(true);
}

/** After login, pick gender / language / offer / incoming / install from the live profile. */
export async function webCallPathAfterLogin(opts: {
  pendingPath: string;
  organisationId: string;
  authToken: string;
}): Promise<string> {
  const path = canonicalizeWebCallPostLoginPath(opts.pendingPath);
  let search = "";
  try {
    search = new URL(path, "http://local.invalid").search;
  } catch {
    const q = path.indexOf("?");
    search = q >= 0 ? path.slice(q) : "";
  }
  const pack = readPackIdFromSearch(search);
  const next = await nextLoggedInWebCallStep({
    organisationId: opts.organisationId,
    authToken: opts.authToken,
    coinPackId: pack,
    search,
  });
  if (isWebCallOfferPreview(search) && next === "paywall") {
    return webCallOfferPath(search);
  }
  return webCallPathForStep(next, search);
}

/** Drop JWT / login flags from the address bar after copying the token to storage. */
export function maybeStripWebCallSecrets(
  pathname: string,
  search: string,
  navigate: (to: string, opts: { replace: boolean }) => void,
): void {
  if (!pathname.startsWith("/campaign/call")) return;
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  if (!params.has("id") && !params.has("login")) return;
  params.delete("id");
  params.delete("login");
  const query = params.toString();
  navigate(query ? `${pathname}?${query}` : pathname, { replace: true });
}

/** After OTP, never dump into the room. Claimed users go through install, not incoming. */
export function canonicalizeWebCallPostLoginPath(path: string): string {
  if (!path.startsWith("/campaign/call")) return path;
  try {
    const url = new URL(path, "http://local.invalid");
    if (
      url.pathname === "/campaign/call/room" ||
      url.pathname === "/campaign/call/incoming"
    ) {
      url.pathname = "/campaign/call";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return path;
  }
}

/** Set only after gender and language are known on the profile. */
export function markWebCallPrefsReady(): void {
  sessionStorage.setItem(PREFS_READY_KEY, "1");
}

export function clearWebCallPrefsReady(): void {
  sessionStorage.removeItem(PREFS_READY_KEY);
}

export function markWebCallIncomingAccepted(): void {
  sessionStorage.setItem(INCOMING_ACCEPTED_KEY, "1");
}

export function webCallIncomingAccepted(): boolean {
  return sessionStorage.getItem(INCOMING_ACCEPTED_KEY) === "1";
}

export function clearWebCallIncomingAccepted(): void {
  sessionStorage.removeItem(INCOMING_ACCEPTED_KEY);
}

/** Accept on the fake pre-login trigger. Landing must not show that card again. */
export function markWebCallLeftPreview(): void {
  sessionStorage.setItem(LEFT_PREVIEW_KEY, "1");
}

export function webCallLeftPreview(): boolean {
  return sessionStorage.getItem(LEFT_PREVIEW_KEY) === "1";
}

export function readForcedCreatorIdFromSearch(search: string): number | null {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const value = Number(params.get("creator_id"));
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function webCallOfferPath(search: string): string {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  params.delete("id");
  params.delete("login");
  params.delete("resume");
  params.set("step", "paywall");
  const query = params.toString();
  return query ? `/campaign/call?${query}` : "/campaign/call?step=paywall";
}

export function webCallInstallPath(search: string): string {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  params.delete("id");
  params.delete("login");
  params.delete("resume");
  params.set("step", "install");
  const query = params.toString();
  return query ? `/campaign/call?${query}` : "/campaign/call?step=install";
}

export function webCallStepPath(
  step: "language" | "gender" | "incoming" | "room",
  search: string,
): string {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  params.delete("id");
  params.delete("login");
  const query = params.toString();
  const path =
    step === "room" ? "/campaign/call/room" : `/campaign/call/${step}`;
  return query ? `${path}?${query}` : path;
}

export type WebCallCreatorCard = {
  id: number;
  name: string;
  profilePicUrl: string;
  audioPricePerMinute: number | null;
};

export type WebCallCreatorPair = {
  creator: WebCallCreatorCard;
  fallback: WebCallCreatorCard | null;
};

function creatorDisplayName(user: Record<string, unknown> | null): string {
  const first = user?.first_name != null ? String(user.first_name).trim() : "";
  const last = user?.last_name != null ? String(user.last_name).trim() : "";
  const name = [first, last].filter(Boolean).join(" ");
  return name || "Creator";
}

function audioPricePerMinute(raw: Record<string, unknown>): number | null {
  const rates =
    raw.call_rates && typeof raw.call_rates === "object"
      ? (raw.call_rates as Record<string, unknown>)
      : null;
  const discounted =
    rates?.discounted_call_rates &&
    typeof rates.discounted_call_rates === "object"
      ? (rates.discounted_call_rates as Record<string, unknown>)
          .audio_call_rates
      : null;
  const standard =
    rates?.standard_call_rates &&
    typeof rates.standard_call_rates === "object"
      ? (
          (rates.standard_call_rates as Record<string, unknown>)
            .audio_call_details as Record<string, unknown> | undefined
        )?.price_per_minute
      : null;
  const value = Number(discounted ?? standard);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function driveFileId(url: string): string | null {
  const fromQuery = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (fromQuery?.[1]) return fromQuery[1];
  const fromPath = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return fromPath?.[1] || null;
}

/** Drive `uc?export=view` 403s in the browser; thumbnails load in <img>. */
export function usableCreatorPhotoUrl(raw: string | null | undefined): string {
  const url = String(raw || "").trim();
  if (!url) return "";
  if (!url.includes("drive.google.com")) return url;
  const fileId = driveFileId(url);
  if (!fileId) return url;
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
}

function cardFromAutoCall(raw: unknown): WebCallCreatorCard | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = Number(row.id);
  if (!Number.isInteger(id) || id <= 0) return null;
  const user =
    row.user_details && typeof row.user_details === "object"
      ? (row.user_details as Record<string, unknown>)
      : null;
  const profilePicUrl = usableCreatorPhotoUrl(
    String(row.profile_pic_url || user?.profile_pic || "").trim(),
  );
  return {
    id,
    name: formatIncomingDisplayName(creatorDisplayName(user)),
    profilePicUrl,
    audioPricePerMinute: audioPricePerMinute(row),
  };
}

const OFFER_PAID_KEY = "zintle_web_call_offer_paid";
const CALL_FINISHED_KEY = "zintle_web_call_call_finished";

/** Payment poll said SUCCESS; fulfil / already_claimed may still be a few hundred ms behind. */
export function markWebCallOfferPaid(): void {
  sessionStorage.setItem(OFFER_PAID_KEY, "1");
}

export function webCallOfferPaid(): boolean {
  return sessionStorage.getItem(OFFER_PAID_KEY) === "1";
}

export function clearWebCallOfferPaid(): void {
  sessionStorage.removeItem(OFFER_PAID_KEY);
}

/** Hang-up / no-connect after this session's call — later routing goes to install. */
export function markWebCallCallFinished(): void {
  sessionStorage.setItem(CALL_FINISHED_KEY, "1");
}

export function webCallCallFinished(): boolean {
  return sessionStorage.getItem(CALL_FINISHED_KEY) === "1";
}

const INSTALL_VARIANT_KEY = "zintle_web_call_install_variant";

export type WebCallInstallScreenVariant =
  | "pending"
  | "ended"
  | "unconnected"
  | "purchased";

export function markWebCallInstallVariant(
  variant: WebCallInstallScreenVariant,
): void {
  sessionStorage.setItem(INSTALL_VARIANT_KEY, variant);
}

export function readWebCallInstallVariant(): WebCallInstallScreenVariant {
  const value = sessionStorage.getItem(INSTALL_VARIANT_KEY);
  switch (value) {
    case "pending":
    case "ended":
    case "unconnected":
    case "purchased":
      return value;
    default:
      return "purchased";
  }
}

export async function waitForWebCallOfferClaimed(opts: {
  organisationId: string;
  authToken: string;
  coinPackId?: number | null;
  attempts?: number;
  delayMs?: number;
}): Promise<boolean> {
  const attempts = opts.attempts ?? 12;
  const delayMs = opts.delayMs ?? 500;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, delayMs));
    }
    const offer = await fetchWebCallOffer({
      organisationId: opts.organisationId,
      authToken: opts.authToken,
      coinPackId: opts.coinPackId,
    });
    if (offer?.already_claimed) {
      return true;
    }
  }
  return false;
}

/**
 * Android Chrome skips history entries that were not created during a user
 * tap, and one `pushState` without a tap marks every same-document entry
 * skippable — the next back then leaves the tab. Push once per event, from
 * the event itself. Never from useEffect, after an await, or inside popstate.
 */
const PAYWALL_BACK_STOPS = 2;

type PaywallBackSeed = {
  pushed: number;
  href: string;
  state: unknown;
};

let paywallBackSeed: PaywallBackSeed | null = null;
let paywallBackStopsKept = false;
let suppressHistoryPop = false;

function clonedHistoryState(idx: number, trap: string): Record<string, unknown> {
  const current = window.history.state as Record<string, unknown> | null;
  const base = current && typeof current === "object" ? { ...current } : {};
  return { ...base, idx, webCallBackTrap: trap };
}

/**
 * Call synchronously from pointerdown and from click — two events, so Chrome
 * keeps two paywall entries. The current entry is rewritten to the offer URL
 * and two more are pushed, so back stays on the welcome offer twice
 * (guilt, then install) even when the offer itself was never tapped.
 */
export function notePaywallBackGesture(): void {
  if (paywallBackStopsKept) return;
  if (paywallBackSeed && paywallBackSeed.pushed >= PAYWALL_BACK_STOPS) return;
  const url = webCallOfferPath(window.location.search);
  try {
    if (!paywallBackSeed) {
      const current = window.history.state as { idx?: number } | null;
      const baseIdx = typeof current?.idx === "number" ? current.idx : 0;
      paywallBackSeed = {
        pushed: 0,
        href: window.location.href,
        state: window.history.state,
      };
      window.history.replaceState(
        clonedHistoryState(baseIdx, "paywall-base"),
        "",
        url,
      );
    }
    const current = window.history.state as { idx?: number } | null;
    const nextIdx = (typeof current?.idx === "number" ? current.idx : 0) + 1;
    window.history.pushState(
      clonedHistoryState(nextIdx, `paywall-stop-${paywallBackSeed.pushed}`),
      "",
      url,
    );
    paywallBackSeed.pushed += 1;
  } catch {
    /* private mode / quota */
  }
}

export function paywallBackStopsPlanted(): boolean {
  return paywallBackSeed !== null && paywallBackSeed.pushed > 0;
}

export function destinationKeepsPaywallBackStops(path: string): boolean {
  try {
    const url = new URL(path, "http://local.invalid");
    const pathname = url.pathname.replace(/\/+$/, "") || "/";
    return pathname === "/campaign/call" && url.searchParams.get("step") === "paywall";
  } catch {
    return false;
  }
}

function historyGo(delta: number): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener("popstate", onPop);
      window.clearTimeout(timer);
      resolve();
    };
    const onPop = () => finish();
    window.addEventListener("popstate", onPop);
    const timer = window.setTimeout(finish, 400);
    window.history.go(delta);
  });
}

/** Keep the planted offer entries, or walk them back off when login goes elsewhere. */
export async function settlePaywallBackStops(keep: boolean): Promise<void> {
  const seed = paywallBackSeed;
  if (!seed) return;
  paywallBackSeed = null;
  if (keep) {
    paywallBackStopsKept = true;
    return;
  }
  paywallBackStopsKept = false;
  suppressHistoryPop = true;
  try {
    if (seed.pushed > 0) {
      await historyGo(-seed.pushed);
    }
    window.history.replaceState(seed.state, "", seed.href);
  } catch {
    /* history unavailable */
  } finally {
    suppressHistoryPop = false;
  }
}

function pushBackTrap(): void {
  try {
    const current = window.history.state as { idx?: number } | null;
    const idx = (typeof current?.idx === "number" ? current.idx : 0) + 1;
    window.history.pushState(
      clonedHistoryState(idx, "back"),
      "",
      window.location.href,
    );
  } catch {
    /* private mode / quota */
  }
}

/** One entry per call. A second push in the same turn is what makes Android skip the rest. */
export function armBrowserBackTrap(depth = 1): void {
  const n = Math.max(0, Math.min(1, Math.floor(depth)));
  for (let i = 0; i < n; i++) {
    pushBackTrap();
  }
}

/** Listen only. Never re-arms — that would be skippable after a back. */
export function listenBrowserBack(
  onBack: () => void,
  options?: { isPaused?: () => boolean },
): () => void {
  const onPop = () => {
    if (suppressHistoryPop) return;
    if (options?.isPaused?.()) return;
    onBack();
  };
  window.addEventListener("popstate", onPop);
  return () => window.removeEventListener("popstate", onPop);
}

export async function fetchWebCallCreatorById(opts: {
  organisationId: string;
  authToken: string;
  creatorId: number;
}): Promise<WebCallCreatorCard | null> {
  const url = new URL(
    `${HOST}/api/v1/creator_center/details/get-creator-profile-details/`,
  );
  url.searchParams.set("creator_id", String(opts.creatorId));
  const r = await fetch(url.toString(), {
    headers: authHeaders(opts.organisationId, opts.authToken),
  });
  const json = (await r.json().catch(() => null)) as { data?: unknown } | null;
  if (!r.ok || !json?.data) return null;
  return cardFromAutoCall(json.data);
}

export async function fetchWebCallCreators(opts: {
  organisationId: string;
  authToken: string;
}): Promise<WebCallCreatorPair | null> {
  const url = new URL(
    `${HOST}/api/v1/creator_center/details/get-auto-call-trigger-creators/`,
  );
  url.searchParams.set("call_type", "audio");
  url.searchParams.set("skip_randomize", "true");
  const r = await fetch(url.toString(), {
    headers: authHeaders(opts.organisationId, opts.authToken),
  });
  const json = (await r.json().catch(() => null)) as {
    data?: { creator?: unknown; fallback_creator?: unknown };
  } | null;
  if (!r.ok || !json?.data) return null;
  const creator = cardFromAutoCall(json.data.creator);
  if (!creator) return null;
  return {
    creator,
    fallback: cardFromAutoCall(json.data.fallback_creator),
  };
}

export async function fetchWalletBalance(opts: {
  organisationId: string;
  authToken: string;
}): Promise<number | null> {
  const r = await fetch(
    `${HOST}/api/v1/user_center/details/get-wallet-balance/`,
    { headers: authHeaders(opts.organisationId, opts.authToken) },
  );
  const json = (await r.json().catch(() => null)) as {
    data?: { user_wallet?: { balance?: number | string } };
  } | null;
  if (!r.ok) return null;
  const balance = Number(json?.data?.user_wallet?.balance);
  return Number.isFinite(balance) ? balance : null;
}

export const CREATOR_FALLBACK_ERROR_CODES = new Set([
  "creator_offline",
  "creator_busy",
  "creator_not_found",
  "call_type_not_accepted",
]);
