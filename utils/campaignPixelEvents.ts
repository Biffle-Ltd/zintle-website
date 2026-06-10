/**
 * Meta Pixel + Biffle analytics events for the campaign / free-trial flow only.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

import type { AppInfo, DeviceInfo } from "./pixelEvents";
import { getJwtFromStorage } from "./authStorage";
import { getLoginPhoneForOrganisation } from "./loginContactStorage";
import { sendUserCenterAnalyticsEvent } from "./coinAnalyticsApi";
import { getOrganisationIdFromSearch } from "./organisationIdFromUrl";
import { headerSafeToken } from "./headerSafeToken";

export type CampaignPixelEventName =
  | "campaign_free_trial_viewed"
  | "campaign_otp_requested"
  | "campaign_login_successful"
  | "campaign_trial_purchase_initiated"
  | "campaign_start_trial";

export type ParsedCampaignPixelContext = {
  organisation_id: string;
  fbclid: string;
  plan_id: number | null;
  token: string | null;
  phone_number: string;
  email: string;
  user_id: number | string | null;
  device_id: string;
  platform: "web" | "android" | "ios";
  deviceInfo: DeviceInfo;
  appInfo: AppInfo;
};

export type CampaignPlanEventInfo = {
  plan_id?: number;
  plan_name?: string;
  price?: string | number;
  free_plan_duration?: number;
  trial_token_amount?: number;
};

const ANALYTICS_UNKNOWN = "unknown";

function eventTimestampUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function parseJsonQueryParam(
  params: URLSearchParams,
  key: string,
): Record<string, unknown> {
  const raw = params.get(key);
  if (!raw) return {};
  try {
    const decoded = decodeURIComponent(raw.replace(/\+/g, " "));
    const obj = JSON.parse(decoded) as unknown;
    return obj && typeof obj === "object"
      ? (obj as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function strField(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  return v != null ? String(v) : "";
}

function strFieldOrUnknown(obj: Record<string, unknown>, key: string): string {
  const v = strField(obj, key).trim();
  return v || ANALYTICS_UNKNOWN;
}

function normalizePlatform(raw: string): "web" | "android" | "ios" {
  const s = raw.trim().toLowerCase();
  if (s === "android" || s === "ios" || s === "web") return s;
  return "web";
}

export function parseIsCampaignParam(raw: string | null): boolean {
  if (raw == null || String(raw).trim() === "") return false;
  const v = String(raw).trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

/** True when a pending post-login redirect targets campaign checkout. */
export function isCampaignPostLoginRedirect(path: string | null): boolean {
  if (!path?.trim()) return false;
  try {
    const url = new URL(path, window.location.origin);
    return parseIsCampaignParam(url.searchParams.get("is_campaign"));
  } catch {
    return path.includes("is_campaign=true");
  }
}

export function parseCampaignPixelContext(
  search: string,
  pathname?: string,
  overrides?: {
    organisationId?: string;
    token?: string | null;
    phone_number?: string;
    plan_id?: number | null;
  },
): ParsedCampaignPixelContext {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );

  const tokenFromUrl = params.get("id");
  const token =
    overrides?.token !== undefined
      ? overrides.token
      : tokenFromUrl?.trim()
        ? tokenFromUrl.trim()
        : null;

  let user_id: number | string | null = null;
  let phone_number = overrides?.phone_number ?? "";
  let email = "";

  const rawUser = params.get("user");
  if (rawUser) {
    try {
      const decoded = decodeURIComponent(rawUser.replace(/\+/g, " "));
      const user = JSON.parse(decoded) as Record<string, unknown>;
      if (user && typeof user === "object") {
        if (user.id != null) user_id = user.id as number | string;
        if (user.phone_number != null && !phone_number) {
          phone_number = String(user.phone_number);
        }
        if (user.email != null) email = String(user.email);
      }
    } catch {
      /* ignore */
    }
  }

  const deviceInfoRaw = parseJsonQueryParam(params, "device_info");
  const deviceInfo: DeviceInfo = {
    platform: strFieldOrUnknown(deviceInfoRaw, "platform"),
    os_version: strFieldOrUnknown(deviceInfoRaw, "os_version"),
    device_model: strFieldOrUnknown(deviceInfoRaw, "device_model"),
    device_id: strFieldOrUnknown(deviceInfoRaw, "device_id"),
    device_name: strFieldOrUnknown(deviceInfoRaw, "device_name"),
  };

  const appInfoRaw = parseJsonQueryParam(params, "app_info");
  const appInfo: AppInfo = {
    app_version: strFieldOrUnknown(appInfoRaw, "app_version"),
    app_build: strFieldOrUnknown(appInfoRaw, "app_build"),
    firebase_instance_id: strFieldOrUnknown(appInfoRaw, "firebase_instance_id"),
  };

  const planIdRaw = params.get("plan_id");
  const planFromUrl =
    planIdRaw != null && planIdRaw !== "" ? Number(planIdRaw) : null;
  const plan_id =
    overrides?.plan_id !== undefined
      ? overrides.plan_id
      : planFromUrl != null && Number.isFinite(planFromUrl)
        ? planFromUrl
        : null;

  const organisation_id =
    overrides?.organisationId?.trim() ||
    getOrganisationIdFromSearch(search, pathname);

  return {
    organisation_id,
    fbclid: params.get("fbclid")?.trim() ?? "",
    plan_id,
    token: token ? headerSafeToken(token) : null,
    phone_number,
    email,
    user_id,
    device_id: deviceInfo.device_id,
    platform: normalizePlatform(deviceInfo.platform),
    deviceInfo,
    appInfo,
  };
}

/** Merge URL context with stored JWT / phone for checkout and post-login steps. */
export function enrichCampaignPixelContext(
  base: ParsedCampaignPixelContext,
  organisationId: string,
): ParsedCampaignPixelContext {
  const jwt = getJwtFromStorage(organisationId);
  const storedPhone = getLoginPhoneForOrganisation(organisationId);
  return {
    ...base,
    token: jwt ? headerSafeToken(jwt) : base.token,
    phone_number: storedPhone || base.phone_number,
  };
}

function buildBaseEventParams(
  ctx: ParsedCampaignPixelContext,
): Record<string, unknown> {
  return {
    user_id: ctx.user_id,
    timestamp: eventTimestampUnixSeconds(),
    device_id: ctx.device_id,
    platform: ctx.platform,
    organisation_id: ctx.organisation_id,
    ...(ctx.fbclid ? { fbclid: ctx.fbclid } : {}),
    ...(ctx.plan_id != null ? { plan_id: ctx.plan_id } : {}),
  };
}

function planToEventInfo(plan: CampaignPlanEventInfo | null | undefined) {
  if (!plan) return {};
  return {
    plan_id: plan.plan_id,
    plan_name: plan.plan_name ?? "",
    price: plan.price ?? "",
    free_plan_duration: plan.free_plan_duration,
    trial_token_amount: plan.trial_token_amount,
  };
}

function toAnalyticsContext(ctx: ParsedCampaignPixelContext) {
  return {
    token: ctx.token,
    organisation_id: ctx.organisation_id,
    user_id: ctx.user_id,
    phone_number: ctx.phone_number,
    email: ctx.email,
    deviceInfo: ctx.deviceInfo,
    appInfo: ctx.appInfo,
  };
}

function sendCampaignPixelEvent(
  eventName: CampaignPixelEventName,
  payload: Record<string, unknown>,
): void {
  const fbq = typeof window !== "undefined" ? window.fbq : undefined;
  if (typeof fbq !== "function") return;
  try {
    fbq("trackCustom", eventName, payload);
    console.log("Campaign pixel event sent", eventName, payload);
  } catch {
    console.error("Failed to send campaign pixel event", eventName, payload);
  }
}

function sendCampaignEvent(
  ctx: ParsedCampaignPixelContext,
  eventName: CampaignPixelEventName,
  eventParams: Record<string, unknown>,
): void {
  sendCampaignPixelEvent(eventName, eventParams);
  sendUserCenterAnalyticsEvent(
    toAnalyticsContext(ctx),
    eventName,
    eventParams,
    { requireAuth: true },
  );
}

export function sendCampaignFreeTrialViewed(
  ctx: ParsedCampaignPixelContext,
  plan: CampaignPlanEventInfo,
): void {
  const eventParams = {
    ...buildBaseEventParams(ctx),
    event_info: planToEventInfo(plan),
  };
  sendCampaignEvent(ctx, "campaign_free_trial_viewed", eventParams);
}

export function sendCampaignOtpRequested(
  ctx: ParsedCampaignPixelContext,
  phoneNumber: string,
): void {
  const eventParams = {
    ...buildBaseEventParams(ctx),
    event_info: {
      phone_number: phoneNumber.replace(/\D/g, ""),
      country_code: "91",
    },
  };
  sendCampaignEvent(
    { ...ctx, phone_number: phoneNumber.replace(/\D/g, "") },
    "campaign_otp_requested",
    eventParams,
  );
}

export function sendCampaignLoginSuccessful(
  ctx: ParsedCampaignPixelContext,
): void {
  const eventParams = {
    ...buildBaseEventParams(ctx),
    event_info: {
      phone_number: ctx.phone_number,
    },
  };
  sendCampaignEvent(ctx, "campaign_login_successful", eventParams);
}

export function sendCampaignTrialPurchaseInitiated(
  ctx: ParsedCampaignPixelContext,
  plan: CampaignPlanEventInfo | null | undefined,
  paymentMethod: string,
): void {
  const eventParams = {
    ...buildBaseEventParams(ctx),
    event_info: {
      ...planToEventInfo(plan),
      payment_method: paymentMethod,
    },
  };
  sendCampaignEvent(ctx, "campaign_trial_purchase_initiated", eventParams);
}

export function sendCampaignStartTrial(
  ctx: ParsedCampaignPixelContext,
  plan: CampaignPlanEventInfo | null | undefined,
  args: { mandate_id: number; mandate_state: string },
): void {
  const eventParams = {
    ...buildBaseEventParams(ctx),
    event_info: {
      ...planToEventInfo(plan),
      mandate_id: args.mandate_id,
      mandate_state: args.mandate_state,
    },
  };
  sendCampaignEvent(ctx, "campaign_start_trial", eventParams);
}
