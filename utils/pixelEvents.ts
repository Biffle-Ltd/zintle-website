/**
 * Meta Pixel custom events for /coins (see pixel-events.md).
 * Sends only when URL has a non-empty `id` query param (JWT / token).
 *
 * Product defaults (confirm with stakeholders if needed):
 * - Optional user profile: URL query `user` (JSON, URI-encoded) for user_id / phone_number / email.
 * - Optional `device_info` / `app_info` (JSON, URI-encoded) for analytics + device_id resolution.
 * - coin_payment_failed: only when payment_status === "FAILED" (not CANCELLED / PENDING / etc.).
 * - payment_gateway / payment_method: matches PAYMENT_GATEWAY in index.tsx.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}
import { PAYMENT_GATEWAY } from "../index";
import { sendCoinAnalyticsEvent } from "./coinAnalyticsApi";
import { getOrganisationIdFromSearch } from "./organisationIdFromUrl";

export type DeviceInfo = {
  platform: string;
  os_version: string;
  device_model: string;
  device_id: string;
  device_name: string;
};

export type AppInfo = {
  app_version: string;
  app_build: string;
  firebase_instance_id: string;
};

export type ParsedCoinPixelContext = {
  token: string;
  phone_number: string;
  email: string;
  user_id: number | string | null;
  device_id: string;
  platform: "web" | "android" | "ios";
  deviceInfo: DeviceInfo;
  appInfo: AppInfo;
  organisation_id: string;
};

export type CoinPackForAnalytics = {
  id: number;
  name?: string;
  coins: number;
  price: number;
  bonus_coins?: number;
};

export type CoinPixelEventName =
  | "coin_store_viewed"
  | "quick_recharge_popup_viewed"
  | "coin_pack_selected"
  | "coin_payment_initiated"
  | "coin_payment_success"
  | "coin_payment_failed";

const CURRENCY = "INR";

/** Unix epoch seconds (matches analytics `IntegerField` / backend serializers). */
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

const ANALYTICS_UNKNOWN = "unknown";

function strField(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  return v != null ? String(v) : "";
}

/** Fallback for analytics `device_info` / `app_info` when a query field is absent. */
function strFieldOrUnknown(obj: Record<string, unknown>, key: string): string {
  const v = strField(obj, key).trim();
  return v || ANALYTICS_UNKNOWN;
}

function normalizePlatform(raw: string): "web" | "android" | "ios" {
  const s = raw.trim().toLowerCase();
  if (s === "android" || s === "ios" || s === "web") return s;
  return "web";
}

export function isQuickRechargeFromSearch(search: string): boolean {
  const query = search.startsWith("?") ? search.slice(1) : search;
  return new URLSearchParams(query).get("quick_recharge")?.toLocaleLowerCase() === "true";
}

function buildBaseEventParams(
  ctx: ParsedCoinPixelContext,
): Record<string, unknown> {
  return {
    user_id: ctx.user_id,
    timestamp: eventTimestampUnixSeconds(),
    device_id: ctx.device_id,
    platform: ctx.platform,
  };
}

function buildStoreViewedEventParams(
  ctx: ParsedCoinPixelContext,
  packs: CoinPackForAnalytics[],
): Record<string, unknown> {
  return {
    ...buildBaseEventParams(ctx),
    event_info: {
      coin_packs: packs.map((p) => ({ id: p.id, name: p.name ?? "" })),
    },
  };
}

function buildCoinPackSelectedEventInfo(
  pack: CoinPackForAnalytics,
  position: number,
): Record<string, unknown> {
  return {
    coinpack_id: pack.id,
    coins: pack.coins,
    bonus_coins: pack.bonus_coins ?? 0,
    price: pack.price,
    currency: CURRENCY,
    bonus_pct: false,
    is_limited_plan: false,
    position,
  };
}

function buildCoinPaymentInitiatedEventInfo(
  pack: CoinPackForAnalytics,
): Record<string, unknown> {
  return {
    coinpack_id: pack.id,
    coins: pack.coins,
    price: pack.price,
    currency: CURRENCY,
    payment_gateway: PAYMENT_GATEWAY,
  };
}

/** Parse optional `user` JSON (URL-encoded) from query; `id` must be present to allow pixels. */
export function parseCoinPixelContext(
  search: string,
  pathname?: string,
): ParsedCoinPixelContext | null {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const id = params.get("id");
  if (!id || !String(id).trim()) return null;

  let user_id: number | string | null = null;
  let phone_number = "";
  let email = "";

  const rawUser = params.get("user");
  if (rawUser) {
    try {
      const decoded = decodeURIComponent(rawUser.replace(/\+/g, " "));
      const user = JSON.parse(decoded) as Record<string, unknown>;
      if (user && typeof user === "object") {
        if (user.id != null) user_id = user.id as number | string;
        if (user.phone_number != null) phone_number = String(user.phone_number);
        if (user.email != null) email = String(user.email);
      }
    } catch {
      // ignore malformed user blob
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

  const platform = normalizePlatform(deviceInfo.platform);

  const organisation_id = getOrganisationIdFromSearch(search, pathname);

  return {
    token: id,
    phone_number,
    email,
    user_id,
    device_id: deviceInfo.device_id,
    platform,
    deviceInfo,
    appInfo,
    organisation_id,
  };
}

export function sendPixelEvent(
  eventName: CoinPixelEventName,
  payload: Record<string, unknown>,
): void {
  const fbq = typeof window !== "undefined" ? window.fbq : undefined;
  if (typeof fbq !== "function") return;

  try {
    fbq("trackCustom", eventName, payload);
    console.log("Pixel event sent", eventName, payload);
  } catch {
    console.error("Failed to send pixel event", eventName, payload);
  }
}

export function sendCoinStoreViewed(
  ctx: ParsedCoinPixelContext | null,
  packs: CoinPackForAnalytics[],
): void {
  if (!ctx) return;
  const eventParams = buildStoreViewedEventParams(ctx, packs);
  sendPixelEvent("coin_store_viewed", eventParams);
  sendCoinAnalyticsEvent(ctx, "coin_store_viewed", eventParams);
}

export function sendQuickRechargePopupViewed(
  ctx: ParsedCoinPixelContext | null,
  packs: CoinPackForAnalytics[],
): void {
  if (!ctx) return;
  const eventParams = buildStoreViewedEventParams(ctx, packs);
  sendPixelEvent("quick_recharge_popup_viewed", eventParams);
  sendCoinAnalyticsEvent(ctx, "quick_recharge_popup_viewed", eventParams);
}

export function sendCoinPackSelected(
  ctx: ParsedCoinPixelContext | null,
  pack: CoinPackForAnalytics,
  position: number,
): void {
  if (!ctx) return;
  const eventParams: Record<string, unknown> = {
    ...buildBaseEventParams(ctx),
    event_info: buildCoinPackSelectedEventInfo(pack, position),
  };
  sendPixelEvent("coin_pack_selected", eventParams);
  sendCoinAnalyticsEvent(ctx, "coin_pack_selected", eventParams);
}

export function sendCoinPaymentInitiated(
  ctx: ParsedCoinPixelContext | null,
  pack: CoinPackForAnalytics,
): void {
  if (!ctx) return;
  const eventParams: Record<string, unknown> = {
    ...buildBaseEventParams(ctx),
    event_info: buildCoinPaymentInitiatedEventInfo(pack),
  };
  sendPixelEvent("coin_payment_initiated", eventParams);
  sendCoinAnalyticsEvent(ctx, "coin_payment_initiated", eventParams);
}

export function sendCoinPaymentSuccess(
  ctx: ParsedCoinPixelContext | null,
  args: {
    order_id: string;
    transaction_id: string;
    amount: number;
    coin_pack_id: number;
    coin_quantity: number;
  },
): void {
  if (!ctx) return;
  const eventParams: Record<string, unknown> = {
    user_id: ctx.user_id,
    transaction_id: args.transaction_id,
    order_id: args.order_id,
    amount: args.amount,
    currency: CURRENCY,
    coin_pack_id: args.coin_pack_id,
    coin_quantity: args.coin_quantity,
    payment_method: PAYMENT_GATEWAY,
    payment_gateway: PAYMENT_GATEWAY,
    event_timestamp: eventTimestampUnixSeconds(),
    platform: ctx.platform,
    device_id: ctx.device_id,
  };
  sendPixelEvent("coin_payment_success", eventParams);
  sendCoinAnalyticsEvent(ctx, "coin_payment_success", eventParams);
}

export function sendCoinPaymentFailed(
  ctx: ParsedCoinPixelContext | null,
  args: { failure_reason?: string },
): void {
  if (!ctx) return;
  const eventParams: Record<string, unknown> = {
    user_id: ctx.user_id,
    currency: CURRENCY,
    failure_reason: args.failure_reason ?? "",
    payment_method: PAYMENT_GATEWAY,
    payment_gateway: PAYMENT_GATEWAY,
    event_timestamp: eventTimestampUnixSeconds(),
    platform: ctx.platform,
    device_id: ctx.device_id,
  };
  sendPixelEvent("coin_payment_failed", eventParams);
  sendCoinAnalyticsEvent(ctx, "coin_payment_failed", eventParams);
}
