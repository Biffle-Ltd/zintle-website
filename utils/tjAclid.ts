/** Unsubstituted TrafficJunky macro. Not a real click id. */
const UNRESOLVED_ACLID = "{ACLID}";

/** Trim, and drop the unsubstituted `{ACLID}` macro. Non-strings are empty. */
export function normalizeCampaignAclid(aclid: unknown): string {
  if (typeof aclid !== "string") return "";
  const clickId = aclid.trim();
  if (!clickId || clickId === UNRESOLVED_ACLID) return "";
  return clickId;
}

/**
 * First real click id in the query. TrafficJunky can leave `aclid={ACLID}`
 * and also append `&aclid=<real>`. `URLSearchParams.get` returns only the first.
 */
export function readCampaignAclidFromParams(params: URLSearchParams): string {
  for (const value of params.getAll("aclid")) {
    const clickId = normalizeCampaignAclid(value);
    if (clickId) return clickId;
  }
  return "";
}

export function readCampaignAclidFromSearch(search: string): string {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  return readCampaignAclidFromParams(params);
}
