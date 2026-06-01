import { isBiffleOrganisationId } from "./organisationIdFromUrl";

/** Biffle campaign: external fb redirect landing. */
const BIFFLE_FB_REDIRECT_URL = "https://biffle.ai/fbredirect";

export function appendFbclid(
  urlOrPath: string,
  fbclid: string | null | undefined,
): string {
  const raw = fbclid?.trim();
  if (!raw) return urlOrPath;
  const sep = urlOrPath.includes("?") ? "&" : "?";
  return `${urlOrPath}${sep}fbclid=${encodeURIComponent(raw)}`;
}

/**
 * After successful campaign payment — Zintle uses in-app `/fb-redirect`;
 * Biffle uses external fbredirect URL. Preserves `fbclid` when present.
 */
export function triggerCampaignFbRedirect({
  organisationId,
  fbclid,
  navigate,
}: {
  organisationId: string;
  fbclid: string;
  navigate: (to: string) => void;
}): void {
  if (isBiffleOrganisationId(organisationId)) {
    window.location.assign(appendFbclid(BIFFLE_FB_REDIRECT_URL, fbclid));
    return;
  }
  navigate(appendFbclid("/fb-redirect", fbclid));
}
