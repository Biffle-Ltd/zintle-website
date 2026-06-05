import type {
  AppInfo,
  CoinPixelEventName,
  DeviceInfo,
  ParsedCoinPixelContext,
} from "./pixelEvents";
import { headerSafeToken } from "./headerSafeToken";

const REGION = "IN";
const UNKNOWN = "unknown";

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

function resolveUserId(ctx: ParsedCoinPixelContext): string | null {
  if (ctx.user_id == null) return null;
  const s = String(ctx.user_id).trim();
  return s || null;
}

export function sendCoinAnalyticsEvent(
  ctx: ParsedCoinPixelContext | null,
  eventName: CoinPixelEventName,
  eventParams: Record<string, unknown>,
): void {
  if (!ctx) return;

  const token = headerSafeToken(ctx.token);
  if (!token) return;

  if (!eventName?.trim()) return;

  const event_timestamp = analyticsEventTimestampSeconds(eventParams);
  if (!Number.isFinite(event_timestamp)) return;

  const organisation_id = ctx.organisation_id?.trim();
  if (!organisation_id) return;

  const user_id = resolveUserId(ctx);

  const url = "https://events.biffle.ai/api/v1/user_center/events/store/";

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
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  }).catch((err) => console.warn("Coin analytics POST failed", eventName, err));
}
