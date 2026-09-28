import { useEffect } from "react";
import { HOST } from "./host";
import { headerSafeToken } from "./headerSafeToken";
import { ZINTLE_POST_LOGIN_REDIRECT_KEY } from "./postLoginRedirect";
import {
  resolveCampaignFbclid,
  syncWebCallFacebookAttribution,
} from "./fbAttribution";

export const WEB_CAMPAIGN_STORAGE_KEY = "zintle_web_campaign_context";

export type WebLoginMode = "phone" | "google" | "both";

export type WebCallLoginOption = "A" | "B";

const WEB_CALL_LOGIN_OPTION_KEY = "zintle_web_call_login_option";
const WEB_CAMPAIGN_CLICK_ID_KEY = "zintle_web_campaign_click_id";
const WEB_CAMPAIGN_LAST_CAPTURE_KEY = "zintle_web_campaign_last_capture";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function optionFromSearch(search: string): WebCallLoginOption | null {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const raw = (params.get("option") || "").trim().toUpperCase();
  if (raw === "A" || raw === "B") return raw;
  return null;
}

export function persistWebCallLoginOption(search: string): void {
  const option = optionFromSearch(search);
  if (!option) return;
  try {
    sessionStorage.setItem(WEB_CALL_LOGIN_OPTION_KEY, option);
  } catch {
    /* private mode */
  }
}

/** Ad flag: A = phone + Google, B = Google only. Defaults to A. */
export function readWebCallLoginOption(search?: string): WebCallLoginOption {
  if (search != null) {
    const fromSearch = optionFromSearch(search);
    if (fromSearch) return fromSearch;
  }
  if (typeof window !== "undefined") {
    const fromWindow = optionFromSearch(window.location.search);
    if (fromWindow) return fromWindow;
    const stored = sessionStorage.getItem(WEB_CALL_LOGIN_OPTION_KEY);
    if (stored === "A" || stored === "B") return stored;
    const pending = sessionStorage.getItem(ZINTLE_POST_LOGIN_REDIRECT_KEY) || "";
    const q = pending.indexOf("?");
    if (q >= 0) {
      const fromPending = optionFromSearch(pending.slice(q));
      if (fromPending) return fromPending;
    }
  }
  return "A";
}

export type WebCampaignContext = {
  campaignId: string | null;
  coinPackId: number | null;
  fbclid: string | null;
};

function positiveInt(raw: string | null): number | null {
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
}

/** Ad URL uses `pack_id`. Older links may still send `coin_pack_id`. */
export function readPackIdFromSearch(search: string): number | null {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  return positiveInt(params.get("pack_id")) ?? positiveInt(params.get("coin_pack_id"));
}

export function parseWebCampaignContext(search: string): WebCampaignContext {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  return {
    campaignId:
      params.get("campaign_id")?.trim() ||
      params.get("meta_campaign_id")?.trim() ||
      null,
    coinPackId: readPackIdFromSearch(search),
    fbclid: params.get("fbclid")?.trim() || null,
  };
}

export function persistWebCampaignContext(ctx: WebCampaignContext): void {
  try {
    sessionStorage.setItem(WEB_CAMPAIGN_STORAGE_KEY, JSON.stringify(ctx));
  } catch {
    /* private mode */
  }
}

export function loadWebCampaignContext(): WebCampaignContext | null {
  try {
    const raw = sessionStorage.getItem(WEB_CAMPAIGN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WebCampaignContext;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Persist URL campaign params and keep fbclid even after it is stripped from the address bar. */
export function persistWebCampaignContextFromSearch(
  organisationId: string,
  search: string,
): WebCampaignContext {
  const parsed = parseWebCampaignContext(search);
  const prev = loadWebCampaignContext();
  const fbclid =
    resolveCampaignFbclid(
      organisationId,
      parsed.fbclid || prev?.fbclid,
    ) ||
    parsed.fbclid ||
    prev?.fbclid ||
    null;
  const ctx: WebCampaignContext = {
    campaignId: parsed.campaignId || prev?.campaignId || null,
    coinPackId: parsed.coinPackId ?? prev?.coinPackId ?? null,
    fbclid,
  };
  persistWebCampaignContext(ctx);
  persistWebCallLoginOption(search);
  return ctx;
}

function newWebCampaignClickId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
  } catch {
    /* fall through */
  }
  return `click-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
}

export function getOrCreateWebCampaignClickId(): string {
  try {
    const existing = sessionStorage.getItem(WEB_CAMPAIGN_CLICK_ID_KEY);
    if (existing && UUID_RE.test(existing)) return existing;
    const created = newWebCampaignClickId();
    sessionStorage.setItem(WEB_CAMPAIGN_CLICK_ID_KEY, created);
    return created;
  } catch {
    return newWebCampaignClickId();
  }
}

function isWebCallPreviewSearch(search: string): boolean {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const preview = (params.get("preview") || "").trim();
  return Boolean(preview && preview !== "0");
}

function webCampaignCaptureBody(
  organisationId: string,
  search: string,
): Record<string, string | number> {
  const ctx = persistWebCampaignContextFromSearch(organisationId, search);
  const body: Record<string, string | number> = {
    click_id: getOrCreateWebCampaignClickId(),
    login_option: readWebCallLoginOption(search),
  };
  if (ctx.campaignId) body.campaign_id = ctx.campaignId;
  if (ctx.coinPackId != null) body.pack_id = ctx.coinPackId;
  if (ctx.fbclid) body.fbclid = ctx.fbclid;
  return body;
}

/** Public: write campaign landing data before login (same idea as fbclid capture). */
export async function captureWebCampaignClick(opts: {
  organisationId: string;
  search: string;
}): Promise<void> {
  if (typeof window === "undefined") return;
  if (isWebCallPreviewSearch(opts.search)) return;
  const body = webCampaignCaptureBody(opts.organisationId, opts.search);
  const fingerprint = JSON.stringify(body);
  try {
    if (sessionStorage.getItem(WEB_CAMPAIGN_LAST_CAPTURE_KEY) === fingerprint) {
      return;
    }
  } catch {
    /* ignore */
  }
  const r = await fetch(`${HOST}/api/v1/attribution/redirect/web_campaign/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Organisation-ID": opts.organisationId,
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    throw new Error(`web_campaign capture failed (${r.status})`);
  }
  try {
    sessionStorage.setItem(WEB_CAMPAIGN_LAST_CAPTURE_KEY, fingerprint);
  } catch {
    /* ignore */
  }
}

export function captureWebCampaignClickSafe(opts: {
  organisationId: string;
  search: string;
}): void {
  void captureWebCampaignClick(opts).catch((err) => {
    console.warn("Campaign landing store failed", err);
  });
}

export function useWebCallFacebookAttribution(
  organisationId: string,
  search: string,
  authToken?: string | null,
): void {
  useEffect(() => {
    persistWebCampaignContextFromSearch(organisationId, search);
    captureWebCampaignClickSafe({ organisationId, search });
    syncWebCallFacebookAttribution({
      organisationId,
      search,
      authToken,
    });
  }, [organisationId, search, authToken]);
}

export function isWhaleLoginPath(): boolean {
  const pending = sessionStorage.getItem(ZINTLE_POST_LOGIN_REDIRECT_KEY) || "";
  return (
    window.location.pathname.startsWith("/campaign/call") ||
    pending.startsWith("/campaign/call")
  );
}

/** Phone-only off-campaign. On m-web call, option A = both, B = Google only. */
export function whaleLoginMode(): WebLoginMode {
  if (!isWhaleLoginPath()) return "phone";
  return readWebCallLoginOption() === "B" ? "google" : "both";
}

export function buildWebCallPath(search: string, step?: string): string {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  if (step) params.set("step", step);
  params.delete("id");
  params.delete("login");
  const query = params.toString();
  return query ? `/campaign/call?${query}` : "/campaign/call";
}

export async function saveWebCampaignLink(opts: {
  organisationId: string;
  authToken: string;
  context: WebCampaignContext;
}): Promise<void> {
  const { context } = opts;
  const token = headerSafeToken(opts.authToken);
  await fetch(`${HOST}/api/v1/attribution/associate/web_campaign/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-Organisation-ID": opts.organisationId,
    },
    body: JSON.stringify({
      click_id: getOrCreateWebCampaignClickId(),
      campaign_id: context.campaignId,
      pack_id: context.coinPackId,
      fbclid: context.fbclid,
      login_option: readWebCallLoginOption(),
    }),
  });
}

export type StoredWebCampaignLink = {
  click_id: string | null;
  campaign_id: string | null;
  coin_pack_id: number | null;
  fbclid: string | null;
  login_option: string | null;
};

export async function fetchWebCampaignLink(opts: {
  organisationId: string;
  authToken: string;
}): Promise<StoredWebCampaignLink | null> {
  const token = headerSafeToken(opts.authToken);
  const r = await fetch(`${HOST}/api/v1/attribution/associate/web_campaign/`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-Organisation-ID": opts.organisationId,
    },
  });
  const json = (await r.json().catch(() => null)) as {
    data?: StoredWebCampaignLink;
  } | null;
  if (!r.ok || !json?.data) return null;
  return json.data;
}
