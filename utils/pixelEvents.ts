/**
 * Meta Pixel custom events for /coins (see pixel-events.md).
 * Sends only when URL has a non-empty `id` query param (JWT / token).
 *
 * Product defaults (confirm with stakeholders if needed):
 * - Optional user profile: URL query `user` (JSON, URI-encoded) for user_id / phone_number / email.
 * - Optional `device_info` / `app_info` (JSON, URI-encoded) for analytics + device_id resolution.
 * - coin_payment_failed: only when payment_status === "FAILED" (not CANCELLED / PENDING / etc.).
 * - payment_gateway / payment_method: "Easebuzz" (matches web checkout).
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}
import { PAYMENT_GATEWAY } from "../index";
import { sendCoinAnalyticsEvent } from "./coinAnalyticsApi";

export type DeviceInfo = {
  platform: string;
  os_version: string;
  device_model: string;
  device_id: string;
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
  organisationId: "ZINTEL1234" | "BIFFLE1234";
};

export type CoinPixelEventName =
  | "coin_store_viewed"
  | "coin_payment_initiated"
  | "coin_payment_success"
  | "coin_payment_failed";

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

function strField(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  return v != null ? String(v) : "";
}

function normalizePlatform(raw: string): "web" | "android" | "ios" {
  const s = raw.trim().toLowerCase();
  if (s === "android" || s === "ios" || s === "web") return s;
  return "web";
}

function getOrganisationId(
  organisation: string | null,
): "ZINTEL1234" | "BIFFLE1234" {
  if (!organisation) return "ZINTEL1234";
  if (organisation.toLocaleLowerCase() === "biffle") return "BIFFLE1234";
  return "ZINTEL1234";
}

/** Parse optional `user` JSON (URL-encoded) from query; `id` must be present to allow pixels. */
export function parseCoinPixelContext(
  search: string,
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
    platform: strField(deviceInfoRaw, "platform"),
    os_version: strField(deviceInfoRaw, "os_version"),
    device_model: strField(deviceInfoRaw, "device_model"),
    device_id: strField(deviceInfoRaw, "device_id"),
  };

  const appInfoRaw = parseJsonQueryParam(params, "app_info");
  const appInfo: AppInfo = {
    app_version: strField(appInfoRaw, "app_version"),
    app_build: strField(appInfoRaw, "app_build"),
    firebase_instance_id: strField(appInfoRaw, "firebase_instance_id"),
  };

  const platform = normalizePlatform(deviceInfo.platform);

  const organisation = params.get("organisation");
  const organisationId = getOrganisationId(organisation);

  return {
    token: id,
    phone_number,
    email,
    user_id,
    device_id: deviceInfo.device_id,
    platform,
    deviceInfo,
    appInfo,
    organisationId,
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

export function sendCoinStoreViewed(ctx: ParsedCoinPixelContext | null): void {
  if (!ctx) return;
  const eventParams: Record<string, unknown> = {
    user_id: ctx.user_id,
    timestamp: eventTimestampUnixSeconds(),
    device_id: ctx.device_id,
    platform: ctx.platform,
  };
  sendPixelEvent("coin_store_viewed", eventParams);
  sendCoinAnalyticsEvent(ctx, "coin_store_viewed", eventParams);
}

export function sendCoinPaymentInitiated(
  ctx: ParsedCoinPixelContext | null,
  args: { coin_pack_id: number; amount: number },
): void {
  if (!ctx) return;
  const eventParams: Record<string, unknown> = {
    user_id: ctx.user_id,
    timestamp: eventTimestampUnixSeconds(),
    coin_pack_id: args.coin_pack_id,
    amount: args.amount,
    currency: "INR",
    payment_gateway: PAYMENT_GATEWAY,
    platform: ctx.platform,
    device_id: ctx.device_id,
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
    currency: "INR",
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
    currency: "INR",
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
