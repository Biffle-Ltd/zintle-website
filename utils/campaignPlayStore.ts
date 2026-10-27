const BIFFLE_ORGANISATION_ID = "BIFFLE1234";
const UNRESOLVED_ACLID = "{ACLID}";
const BIFFLE_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=ai.biffle";
const ZINTLE_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=ai.zintle";

function playStoreClickId(aclid: string | null | undefined): string {
  if (typeof aclid !== "string") return "";
  const clickId = aclid.trim();
  if (!clickId || clickId === UNRESOLVED_ACLID) return "";
  return clickId;
}

/** Play Store listing for this org. `referrer` is the TrafficJunky click id. */
export function campaignPlayStoreUrl(
  organisationId: string,
  aclid: string | null | undefined,
): string {
  const base =
    organisationId.trim().toUpperCase() === BIFFLE_ORGANISATION_ID
      ? BIFFLE_PLAY_STORE_URL
      : ZINTLE_PLAY_STORE_URL;
  const clickId = playStoreClickId(aclid);
  if (!clickId) return base;
  const url = new URL(base);
  url.searchParams.set("referrer", clickId);
  return url.toString();
}
