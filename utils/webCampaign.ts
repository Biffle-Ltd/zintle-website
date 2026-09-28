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
  sessionStorage.setItem(WEB_CAMPAIGN_STORAGE_KEY, JSON.stringify(ctx));
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
  return ctx;
}

export function useWebCallFacebookAttribution(
  organisationId: string,
  search: string,
  authToken?: string | null,
): void {
  useEffect(() => {
    persistWebCampaignContextFromSearch(organisationId, search);
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

/** Phone-only off-campaign. On m-web call, Google + phone. */
export function whaleLoginMode(): WebLoginMode {
  return isWhaleLoginPath() ? "both" : "phone";
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
      campaign_id: context.campaignId,
      pack_id: context.coinPackId,
      fbclid: context.fbclid,
    }),
  });
}

export type StoredWebCampaignLink = {
  campaign_id: string | null;
  coin_pack_id: number | null;
  fbclid: string | null;
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
