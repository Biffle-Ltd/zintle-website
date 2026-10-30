/** Language code sent to free-plan info when the campaign URL opts into Tamil. */
export const CAMPAIGN_TAMIL_LANGUAGE_CODE = "ta";

const TAMIL_FLAG_PARAM = "tamil";

function queryFromSearchOrPath(searchOrPath: string): string {
  const queryIndex = searchOrPath.indexOf("?");
  if (queryIndex >= 0) return searchOrPath.slice(queryIndex + 1);
  if (searchOrPath.includes("/")) return "";
  return searchOrPath.replace(/^\?/, "");
}

/**
 * True when a campaign URL asks to skip language selection and use Tamil.
 * Accepts `tamil=1`, `tamil=true`, or `tamil=yes`.
 */
export function isCampaignTamilLanguageFlag(
  searchOrPath: string | null | undefined,
): boolean {
  if (!searchOrPath?.trim()) return false;
  const params = new URLSearchParams(queryFromSearchOrPath(searchOrPath));
  const value = params.get(TAMIL_FLAG_PARAM)?.trim().toLowerCase() ?? "";
  return value === "1" || value === "true" || value === "yes";
}
