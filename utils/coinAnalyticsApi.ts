import type { CoinPixelEventName, ParsedCoinPixelContext } from "./pixelEvents";
import { headerSafeToken } from "./headerSafeToken";

const REGION = "IN";

function analyticsEventTimestampSeconds(
  eventParams: Record<string, unknown>,
): number {
  const fromParams =
    eventParams.event_timestamp ?? eventParams.timestamp;
  if (typeof fromParams === "number" && Number.isFinite(fromParams)) {
    return Math.trunc(fromParams);
  }
  return Math.floor(Date.now() / 1000);
}

export function sendCoinAnalyticsEvent(
  ctx: ParsedCoinPixelContext | null,
  eventName: CoinPixelEventName,
  eventParams: Record<string, unknown>,
): void {
  if (!ctx) return;

  const url = "https://events.biffle.ai/api/v1/user_center/events/store/";
  const token = headerSafeToken(ctx.token);
  if (!token) return;

  const body = {
    event_name: eventName,
    event_params: eventParams,
    event_timestamp: analyticsEventTimestampSeconds(eventParams),
    user_id: ctx.user_id != null ? String(ctx.user_id) : null,
    user_properties: {
      region: REGION,
      phone_number: ctx.phone_number,
      email: ctx.email,
    },
    device_info: ctx.deviceInfo,
    app_info: ctx.appInfo,
    organisation_id: ctx.organisation_id,
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
