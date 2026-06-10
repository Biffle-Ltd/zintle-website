import type {
  AppInfo,
  CoinPixelEventName,
  DeviceInfo,
  ParsedCoinPixelContext,
} from "./pixelEvents";
import { headerSafeToken } from "./headerSafeToken";

const REGION = "IN";
const UNKNOWN = "unknown";

export type UserCenterAnalyticsContext = {
  token: string | null;
  organisation_id: string;
  user_id: number | string | null;
  phone_number: string;
  email: string;
  deviceInfo: DeviceInfo;
  appInfo: AppInfo;
};

function fieldOrUnknown(value: string | null | undefined): string {
  const s = value != null ? String(value).trim() : "";
  return s || UNKNOWN;
}

function sanitizeDeviceInfo(info: DeviceInfo): DeviceInfo {
  return {
    platform: fieldOrUnknown(info.platform),
    os_version: fieldOrUnknown(info.os_version),
    device_model: fieldOrUnknown(info.device_model),
    device_id: fieldOrUnknown(info.device_id),
    device_name: fieldOrUnknown(info.device_name),
  };
}

function sanitizeAppInfo(info: AppInfo): AppInfo {
  return {
    app_version: fieldOrUnknown(info.app_version),
    app_build: fieldOrUnknown(info.app_build),
    firebase_instance_id: fieldOrUnknown(info.firebase_instance_id),
  };
}

function analyticsEventTimestampSeconds(
  eventParams: Record<string, unknown>,
): number {
  const fromParams = eventParams.event_timestamp ?? eventParams.timestamp;
  if (typeof fromParams === "number" && Number.isFinite(fromParams)) {
    return Math.trunc(fromParams);
  }
  return Math.floor(Date.now() / 1000);
}

function resolveUserId(
  user_id: number | string | null | undefined,
): string | null {
  if (user_id == null) return null;
  const s = String(user_id).trim();
  return s || null;
}

export function sendUserCenterAnalyticsEvent(
  ctx: UserCenterAnalyticsContext | null,
  eventName: string,
  eventParams: Record<string, unknown>,
  options?: { requireAuth?: boolean },
): void {
  if (!ctx) return;

  const requireAuth = options?.requireAuth !== false;
  const token = ctx.token ? headerSafeToken(ctx.token) : null;
  if (requireAuth && !token) return;

  if (!eventName?.trim()) return;

  const event_timestamp = analyticsEventTimestampSeconds(eventParams);
  if (!Number.isFinite(event_timestamp)) return;

  const organisation_id = ctx.organisation_id?.trim();
  if (!organisation_id) return;

  const user_id = resolveUserId(ctx.user_id);

  const url = "https://events.biffle.ai/api/v1/user_center/events/store/";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const body = {
    event_name: eventName,
    event_params: eventParams,
    event_timestamp,
    user_id,
    user_properties: {
      region: REGION,
      phone_number: ctx.phone_number,
      email: ctx.email,
    },
    device_info: sanitizeDeviceInfo(ctx.deviceInfo),
    app_info: sanitizeAppInfo(ctx.appInfo),
    organisation_id,
  };

  void fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }).catch((err) => console.warn("Analytics POST failed", eventName, err));
}

export function sendCoinAnalyticsEvent(
  ctx: ParsedCoinPixelContext | null,
  eventName: CoinPixelEventName,
  eventParams: Record<string, unknown>,
): void {
  if (!ctx) return;
  sendUserCenterAnalyticsEvent(
    {
      token: ctx.token,
      organisation_id: ctx.organisation_id,
      user_id: ctx.user_id,
      phone_number: ctx.phone_number,
      email: ctx.email,
      deviceInfo: ctx.deviceInfo,
      appInfo: ctx.appInfo,
    },
    eventName,
    eventParams,
    { requireAuth: true },
  );
}
