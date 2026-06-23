export type PhonePeIframeCallbackResponse = "USER_CANCEL" | "CONCLUDED";

type PhonePeCheckoutApi = {
  transact: (options: {
    tokenUrl: string;
    type: "IFRAME" | "REDIRECT";
    callback: (response: PhonePeIframeCallbackResponse) => void;
  }) => void;
  closePage?: () => void;
};

/** Append `isChromeWV=true` to the PhonePe payment / checkout URL from the API. */
export function appendPhonePeChromeWVParam(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  try {
    const parsed = new URL(trimmed);
    parsed.searchParams.set("isChromeWV", "true");
    return parsed.toString();
  } catch {
    const sep = trimmed.includes("?") ? "&" : "?";
    return `${trimmed}${sep}isChromeWV=true`;
  }
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
