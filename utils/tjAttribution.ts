import { headerSafeToken } from "./headerSafeToken";
import { HOST } from "./host";
import {
  normalizeCampaignAclid,
  readCampaignAclidFromSearch,
} from "./tjAclid";

const CAMPAIGN_ACLID_KEY = "zintle_campaign_aclid";
const CAMPAIGN_TJ_STORED_KEY = "zintle_campaign_tj_stored";
const CAMPAIGN_TJ_LINKED_KEY = "zintle_campaign_tj_attribution_linked";

const captureInflight = new Map<string, Promise<void>>();
const linkInflight = new Map<string, Promise<void>>();

export { normalizeCampaignAclid } from "./tjAclid";

type TjRedirectApiResponse = {
  success?: boolean;
};

type TjAssociateApiResponse = {
  success?: boolean;
  error_code?: string;
  error_message?: string;
};

function attributionKey(organisationId: string, aclid: string): string {
  return `${organisationId.trim()}:${aclid}`;
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

function readAclidMap(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(CAMPAIGN_ACLID_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const map: Record<string, string> = {};
    for (const [org, value] of Object.entries(parsed)) {
      const clickId = normalizeCampaignAclid(value);
      if (org.trim() && clickId) map[org] = clickId;
    }
    return map;
  } catch {
    return {};
  }
}

/** Persist aclid per org so it survives URL stripping / in-app navigation. */
export function persistCampaignAclid(
  organisationId: string,
  aclid: string,
): void {
  const org = organisationId.trim();
  const clickId = normalizeCampaignAclid(aclid);
  if (!org || !clickId) return;
  try {
    const map = readAclidMap();
    map[org] = clickId;
    sessionStorage.setItem(CAMPAIGN_ACLID_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getPersistedCampaignAclid(organisationId: string): string {
  return readAclidMap()[organisationId.trim()] ?? "";
}

function clearPersistedCampaignAclid(organisationId: string): void {
  const org = organisationId.trim();
  if (!org) return;
  try {
    const map = readAclidMap();
    if (!map[org]) return;
    delete map[org];
    sessionStorage.setItem(CAMPAIGN_ACLID_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

let adLandingNoted = false;
let adLandingWithoutAclid = false;

function isAdLandingPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === "/campaign" || path === "/campaign/call";
}

/**
 * A full load of the ad page decides the click for this document.
 * No `aclid` in that URL drops a click left behind by an earlier ad,
 * so a Meta visit does not inherit a TrafficJunky id.
 */
export function noteAdLandingAclid(organisationId: string, search: string): void {
  if (adLandingNoted || typeof window === "undefined") return;
  if (!isAdLandingPath(window.location.pathname)) return;
  adLandingNoted = true;
  if (readCampaignAclidFromSearch(search)) return;
  adLandingWithoutAclid = true;
  clearPersistedCampaignAclid(organisationId);
}

/** True after this document opened an ad URL that had no TrafficJunky click. */
export function adLandingDroppedAclid(): boolean {
  return adLandingWithoutAclid;
}

/** Prefer URL aclid when it is a real click id; otherwise fall back to session. */
export function resolveCampaignAclid(
  organisationId: string,
  aclidFromUrl?: string | null,
): string {
  if (typeof window !== "undefined") {
    noteAdLandingAclid(organisationId, window.location.search);
  }
  const fromUrl = normalizeCampaignAclid(aclidFromUrl);
  if (fromUrl) {
    persistCampaignAclid(organisationId, fromUrl);
    return fromUrl;
  }
  if (adLandingWithoutAclid) return "";
  return getPersistedCampaignAclid(organisationId);
}

async function storeTjClick(
  aclid: string,
  organisationId: string,
): Promise<void> {
  const clickId = normalizeCampaignAclid(aclid);
  if (!clickId) return;

  const r = await fetch(`${HOST}/api/v1/attribution/redirect/tj_redirect/`, {
    method: "POST",
    keepalive: true,
    headers: {
      "Content-Type": "application/json",
      "X-Organisation-ID": organisationId,
    },
    body: JSON.stringify({ aclid: clickId }),
  });
  // A repeat store is success. Do not retry it on every page.
  if (r.status === 409) return;
  if (!r.ok) {
    throw new Error(`tj_redirect failed (${r.status})`);
  }
  const body = (await r.json().catch(() => ({}))) as TjRedirectApiResponse;
  if (body.success === false) {
    throw new Error("tj_redirect returned success=false");
  }
}

/**
 * Campaign landing: persist aclid locally and store the click server-side.
 * The session "already sent" flag is written only after a 2xx response.
 */
export function captureCampaignAclidOnLanding(
  organisationId: string,
  aclid: string,
): Promise<void> {
  const clickId = normalizeCampaignAclid(aclid);
  if (!clickId) return Promise.resolve();

  persistCampaignAclid(organisationId, clickId);

  const key = attributionKey(organisationId, clickId);
  if (listIncludes(CAMPAIGN_TJ_STORED_KEY, key)) return Promise.resolve();

  const existing = captureInflight.get(key);
  if (existing) return existing;

  const job = storeTjClick(clickId, organisationId)
    .then(() => {
      appendStringList(CAMPAIGN_TJ_STORED_KEY, key);
    })
    .finally(() => {
      captureInflight.delete(key);
    });
  captureInflight.set(key, job);
  return job;
}

export function captureCampaignAclidOnLandingSafe(
  organisationId: string,
  aclid: string,
): void {
  void captureCampaignAclidOnLanding(organisationId, aclid).catch((err) => {
    console.warn("Campaign TJ click store failed", err);
  });
}

/**
 * Ensure the click is stored, then associate it with the logged-in user.
 * Resolves on 2xx and on 409 already-associated. Rejects otherwise so the
 * caller can retry. Does not mark the session linked until that success.
 */
async function linkCampaignTjAttributionOnce(params: {
  aclid: string;
  organisationId: string;
  token: string;
  key: string;
}): Promise<void> {
  const { aclid, organisationId, token, key } = params;
  if (!listIncludes(CAMPAIGN_TJ_STORED_KEY, key)) {
    await captureCampaignAclidOnLanding(organisationId, aclid);
  }

  const r = await fetch(`${HOST}/api/v1/attribution/associate/tj_associate/`, {
    method: "POST",
    keepalive: true,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Organisation-ID": organisationId,
    },
    body: JSON.stringify({ aclid }),
  });

  const body = (await r.json().catch(() => ({}))) as TjAssociateApiResponse;
  const alreadyAssociated =
    r.status === 409 &&
    body.error_code === "click_attribution_already_associated";

  if (!alreadyAssociated && (!r.ok || body.success === false)) {
    throw new Error(
      body.error_message ??
        `tj_associate failed (${r.status}${body.error_code ? `: ${body.error_code}` : ""})`,
    );
  }

  appendStringList(CAMPAIGN_TJ_LINKED_KEY, key);
}

export function linkCampaignTjAttribution(params: {
  aclid?: string | null;
  organisationId: string;
  authToken: string;
}): Promise<void> {
  const { organisationId, authToken } = params;
  const aclid = resolveCampaignAclid(organisationId, params.aclid);
  const token = headerSafeToken(authToken);
  if (!aclid || !token) return Promise.resolve();

  const key = attributionKey(organisationId, aclid);
  if (listIncludes(CAMPAIGN_TJ_LINKED_KEY, key)) return Promise.resolve();

  const existing = linkInflight.get(key);
  if (existing) return existing;

  const job = linkCampaignTjAttributionOnce({
    aclid,
    organisationId,
    token,
    key,
  }).finally(() => {
    linkInflight.delete(key);
  });
  linkInflight.set(key, job);
  return job;
}

/** Meta login and checkout must not sit behind a hung TrafficJunky call. */
const TJ_LINK_WAIT_MS = 2000;

/**
 * Wait for the TrafficJunky associate, then continue.
 * No `aclid` returns immediately, so a Meta-only visit is not delayed.
 * After the cap, navigation proceeds and `keepalive` can finish the request.
 */
export function waitForCampaignTjAttribution(params: {
  aclid?: string | null;
  organisationId: string;
  authToken: string;
}): Promise<void> {
  const aclid = resolveCampaignAclid(params.organisationId, params.aclid);
  const token = headerSafeToken(params.authToken);
  if (!aclid || !token) return Promise.resolve();

  let timer: number | undefined;
  const timeout =
    typeof window === "undefined"
      ? Promise.resolve()
      : new Promise<void>((resolve) => {
          timer = window.setTimeout(resolve, TJ_LINK_WAIT_MS);
        });

  const linked = linkCampaignTjAttribution({
    aclid,
    organisationId: params.organisationId,
    authToken: token,
  }).catch((err) => {
    console.warn("TJ attribution link failed", err);
  });

  return Promise.race([linked, timeout]).finally(() => {
    if (timer !== undefined && typeof window !== "undefined") {
      window.clearTimeout(timer);
    }
  });
}

/**
 * `/campaign/call` landing. Same split as Facebook: store the click logged-out,
 * associate it once a token exists. No `aclid` returns immediately.
 */
export function syncWebCallTjAttribution(opts: {
  organisationId: string;
  search: string;
  authToken?: string | null;
}): void {
  const aclid = resolveCampaignAclid(
    opts.organisationId,
    readCampaignAclidFromSearch(opts.search),
  );
  if (!aclid) return;
  const token = headerSafeToken(opts.authToken || "");
  if (!token) {
    captureCampaignAclidOnLandingSafe(opts.organisationId, aclid);
    return;
  }
  linkCampaignTjAttributionSafe({
    aclid,
    organisationId: opts.organisationId,
    authToken: token,
  });
}

/** Mount retry. Payment must not wait on this. */
export function linkCampaignTjAttributionSafe(params: {
  aclid?: string | null;
  organisationId: string;
  authToken: string;
}): void {
  void linkCampaignTjAttribution(params).catch((err) => {
    console.warn("TJ attribution link failed", err);
  });
}
