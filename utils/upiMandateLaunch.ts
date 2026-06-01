type MandatePgInfo = {
  redirect_url?: string | null;
  redirectUrl?: string | null;
  data?: {
    redirectUrl?: string | null;
    redirect_url?: string | null;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type MandateForRedirect = {
  pg_info?: MandatePgInfo;
};

export const UPI_APP_PACKAGES = {
  phonepe: "com.phonepe.app",
  paytm: "net.one97.paytm",
  gpay: "com.google.android.apps.nbu.paisa.user",
} as const;

export type CampaignUpiApp = keyof typeof UPI_APP_PACKAGES;

export function resolveMandateRedirectUrl(
  mandate: MandateForRedirect,
): string | null {
  const pg = mandate.pg_info;
  if (!pg || typeof pg !== "object") return null;
  const rec = pg as Record<string, unknown>;
  const data =
    rec.data && typeof rec.data === "object"
      ? (rec.data as Record<string, unknown>)
      : null;
  const candidates = [
    rec.redirect_url,
    rec.redirectUrl,
    data?.redirectUrl,
    data?.redirect_url,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return null;
}

function isAndroid(): boolean {
  return /android/i.test(
    typeof navigator !== "undefined" ? navigator.userAgent : "",
  );
}

/** Remove Play Store fallback from PG intent URLs — failed intents otherwise open the store. */
function stripIntentPlayStoreFallback(intentUrl: string): string {
  return intentUrl.replace(/;S\.browser_fallback_url=[^;]*;?/gi, ";");
}

/**
 * `upi://mandate?...` → `intent://mandate?...#Intent;scheme=upi;package=...;end`
 * (NOT `intent://upi/mandate` — that breaks resolution and sends users to Play Store.)
 */
export function buildAndroidUpiIntentUrl(
  upiUrl: string,
  packageName: string,
): string {
  const rest = upiUrl.replace(/^upi:\/\//i, "");
  return `intent://${rest}#Intent;scheme=upi;package=${packageName};action=android.intent.action.VIEW;end`;
}

function navigateToUrl(url: string): void {
  if (typeof window === "undefined") return;
  // Anchor click is more reliable than location.assign for intent:// on Chrome Android.
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function injectPackageIntoIntent(intentUrl: string, packageName: string): string {
  const cleaned = stripIntentPlayStoreFallback(intentUrl);
  if (/package=[^;]+/i.test(cleaned)) {
    return cleaned.replace(/package=[^;]+;?/i, `package=${packageName};`);
  }
  return cleaned.replace(/#Intent;/i, `#Intent;package=${packageName};`);
}

/**
 * Opens mandate / UPI redirect. When `packageName` is set on Android, targets that UPI app.
 */
export function openMandateRedirectUrl(
  redirectUrl: string,
  packageName?: string,
): void {
  if (typeof window === "undefined" || !redirectUrl.trim()) return;

  if (!packageName || !isAndroid()) {
    navigateToUrl(redirectUrl);
    return;
  }

  if (redirectUrl.startsWith("intent:")) {
    navigateToUrl(injectPackageIntoIntent(redirectUrl, packageName));
    return;
  }

  if (redirectUrl.startsWith("upi://")) {
    navigateToUrl(buildAndroidUpiIntentUrl(redirectUrl, packageName));
    return;
  }

  navigateToUrl(redirectUrl);
}
