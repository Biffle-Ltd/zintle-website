const PHONEPE_IFRAME_PHONE_MIN = 1_000_000_040;
const PHONEPE_IFRAME_PHONE_MAX = 1_000_000_060;

export type PhonePeIframeCallbackResponse = "USER_CANCEL" | "CONCLUDED";

type PhonePeCheckoutApi = {
  transact: (options: {
    tokenUrl: string;
    type: "IFRAME" | "REDIRECT";
    callback: (response: PhonePeIframeCallbackResponse) => void;
  }) => void;
  closePage?: () => void;
};

/** Phone number from URL only (`user` JSON or `phone` / `phone_number` query). */
export function parsePhoneFromUrlSearch(search: string): string {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const direct =
    params.get("phone_number") ??
    params.get("phone") ??
    params.get("phonenumber");
  if (direct?.trim()) return direct.replace(/\D/g, "");

  const raw = params.get("user");
  if (!raw?.trim()) return "";
  try {
    const decoded = decodeURIComponent(raw.replace(/\+/g, " "));
    const user = JSON.parse(decoded) as Record<string, unknown>;
    return user?.phone_number != null
      ? String(user.phone_number).replace(/\D/g, "")
      : "";
  } catch {
    return "";
  }
}

function isPhoneInIframeTestRange(phoneDigits: string): boolean {
  if (!phoneDigits) return false;
  const n = Number(phoneDigits.replace(/\D/g, ""));
  return (
    Number.isFinite(n) &&
    n >= PHONEPE_IFRAME_PHONE_MIN &&
    n <= PHONEPE_IFRAME_PHONE_MAX
  );
}

/** Use PhonePe PayPage iframe when `iframe=true` or URL phone is in the test range. */
export function shouldUsePhonePeIframe(search: string): boolean {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  if (params.get("iframe")?.toLowerCase() === "true") return true;
  return isPhoneInIframeTestRange(parsePhoneFromUrlSearch(search));
}

/**
 * Opens PhonePe PayPage in iframe mode. `tokenUrl` is the access token / redirect URL
 * from initiate-payment (see PhonePe docs).
 * Returns false if the checkout script is unavailable or `tokenUrl` is missing.
 */
export function openPhonePeIframeCheckout(
  tokenUrl: string,
  callback: (response: PhonePeIframeCallbackResponse) => void,
): boolean {
  if (typeof window === "undefined" || !tokenUrl.trim()) return false;

  const PhonePeCheckout = (window as Window & { PhonePeCheckout?: PhonePeCheckoutApi })
    .PhonePeCheckout;
  if (!PhonePeCheckout?.transact) {
    console.error("PhonePe checkout script not loaded");
    return false;
  }

  PhonePeCheckout.transact({
    tokenUrl: tokenUrl.trim(),
    type: "IFRAME",
    callback,
  });
  return true;
}
