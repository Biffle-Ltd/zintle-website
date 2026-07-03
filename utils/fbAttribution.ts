import { headerSafeToken } from "./headerSafeToken";
import { HOST } from "./host";

const CAMPAIGN_FBCLID_KEY = "zintle_campaign_fbclid";
const CAMPAIGN_FB_STORED_KEY = "zintle_campaign_fb_stored";
const CAMPAIGN_FB_ATTRIBUTION_LINKED_KEY = "zintle_campaign_fb_attribution_linked";

type FbRedirectApiResponse = {
  success?: boolean;
  data?: { redirect_url?: string };
};

type FbAssociateApiResponse = {
  success?: boolean;
  error_code?: string;
  error_message?: string;
};

function normalizeFbclid(fbclid: string | null | undefined): string {
  return fbclid?.trim() ?? "";
}

function attributionKey(organisationId: string, fbclid: string): string {
  return `${organisationId.trim()}:${fbclid}`;
}

function readStringList(key: string): string[] {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function appendStringList(key: string, entry: string): void {
  try {
    const list = readStringList(key);
    if (!list.includes(entry)) list.push(entry);
    sessionStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function listIncludes(key: string, entry: string): boolean {
  return readStringList(key).includes(entry);
}

/** Persist fbclid per org so it survives URL stripping / in-app navigation. */
export function persistCampaignFbclid(
  organisationId: string,
  fbclid: string,
): void {
  const org = organisationId.trim();
  const clickId = normalizeFbclid(fbclid);
  if (!org || !clickId) return;
  try {
    const raw = sessionStorage.getItem(CAMPAIGN_FBCLID_KEY);
    const map: Record<string, string> = raw
      ? (JSON.parse(raw) as Record<string, string>)
      : {};
    map[org] = clickId;
    sessionStorage.setItem(CAMPAIGN_FBCLID_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getPersistedCampaignFbclid(organisationId: string): string {
  try {
    const raw = sessionStorage.getItem(CAMPAIGN_FBCLID_KEY);
    if (!raw) return "";
    const map = JSON.parse(raw) as Record<string, string>;
    return normalizeFbclid(map[organisationId.trim()]);
  } catch {
    return "";
  }
}

/** Prefer URL fbclid when present; otherwise fall back to session persistence. */
export function resolveCampaignFbclid(
  organisationId: string,
  fbclidFromUrl?: string | null,
): string {
  const fromUrl = normalizeFbclid(fbclidFromUrl);
  if (fromUrl) {
    persistCampaignFbclid(organisationId, fromUrl);
    return fromUrl;
  }
  return getPersistedCampaignFbclid(organisationId);
}

/** Store click attribution (public). Same API as `/fb-redirect` page. */
export async function storeFacebookClickAttribution(
  fbclid: string,
  organisationId: string,
): Promise<string | null> {
  const clickId = normalizeFbclid(fbclid);
  if (!clickId) return null;

  const url = `${HOST}/api/v1/attribution/redirect/fb_redirect/?fbclid=${encodeURIComponent(clickId)}`;
  const r = await fetch(url, {
    headers: { "X-Organisation-ID": organisationId },
  });
  if (!r.ok) {
    throw new Error(`fb_redirect failed (${r.status})`);
  }
  const body = (await r.json()) as FbRedirectApiResponse;
  if (body.success === false) {
    throw new Error("fb_redirect returned success=false");
  }
  return body.data?.redirect_url?.trim() || null;
}

/** Link authenticated user to a stored fbclid (requires JWT). */
export async function associateFacebookClickAttribution(
  fbclid: string,
  authToken: string,
  organisationId: string,
): Promise<void> {
  const clickId = normalizeFbclid(fbclid);
  const token = headerSafeToken(authToken);
  if (!clickId || !token) return;

  const r = await fetch(
    `${HOST}/api/v1/attribution/associate/fb_associate/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Organisation-ID": organisationId,
      },
      body: JSON.stringify({ click_id: clickId }),
    },
  );

  const body = (await r.json().catch(() => ({}))) as FbAssociateApiResponse;

  if (r.ok) return;

  if (
    r.status === 409 &&
    body.error_code === "click_attribution_already_associated"
  ) {
    return;
  }

  throw new Error(
    body.error_message ??
      `fb_associate failed (${r.status}${body.error_code ? `: ${body.error_code}` : ""})`,
  );
}

/**
 * Campaign landing: persist fbclid locally and store click server-side.
 * Runs once per org+fbclid per browser session; does not require login.
 */
export async function captureCampaignFbclidOnLanding(
  organisationId: string,
  fbclid: string,
): Promise<void> {
  const clickId = normalizeFbclid(fbclid);
  if (!clickId) return;

  persistCampaignFbclid(organisationId, clickId);

  const key = attributionKey(organisationId, clickId);
  if (listIncludes(CAMPAIGN_FB_STORED_KEY, key)) return;

  await storeFacebookClickAttribution(clickId, organisationId);
  appendStringList(CAMPAIGN_FB_STORED_KEY, key);
}

export function captureCampaignFbclidOnLandingSafe(
  organisationId: string,
  fbclid: string,
): void {
  void captureCampaignFbclidOnLanding(organisationId, fbclid).catch((err) => {
    console.warn("Campaign FB click store failed", err);
  });
}

/**
 * Campaign flow: ensure click is stored, then associate with logged-in user.
 * Uses persisted fbclid when the URL no longer has it.
 */
export async function linkCampaignFacebookAttribution(params: {
  fbclid?: string | null;
  organisationId: string;
  authToken: string;
}): Promise<void> {
  const { organisationId, authToken } = params;
  const fbclid = resolveCampaignFbclid(organisationId, params.fbclid);
  const token = headerSafeToken(authToken);
  if (!fbclid || !token) return;

  const key = attributionKey(organisationId, fbclid);
  if (listIncludes(CAMPAIGN_FB_ATTRIBUTION_LINKED_KEY, key)) return;

  if (!listIncludes(CAMPAIGN_FB_STORED_KEY, key)) {
    await storeFacebookClickAttribution(fbclid, organisationId);
    appendStringList(CAMPAIGN_FB_STORED_KEY, key);
  }

  await associateFacebookClickAttribution(fbclid, token, organisationId);
  appendStringList(CAMPAIGN_FB_ATTRIBUTION_LINKED_KEY, key);
}

export function linkCampaignFacebookAttributionSafe(params: {
  fbclid?: string | null;
  organisationId: string;
  authToken: string;
}): void {
  void linkCampaignFacebookAttribution(params).catch((err) => {
    console.warn("Campaign FB attribution link failed", err);
  });
}
