/** Language code for the default Biffle campaign video. */
export const CAMPAIGN_HINDI_LANGUAGE_CODE = "hi";

/** Language code sent to free-plan info when the campaign URL opts into Tamil. */
export const CAMPAIGN_TAMIL_LANGUAGE_CODE = "ta";

const TAMIL_FLAG_PARAM = "tamil";
const ALL_LANGUAGES_FLAG_PARAM = "all";

function queryFromSearchOrPath(searchOrPath: string): string {
  const queryIndex = searchOrPath.indexOf("?");
  if (queryIndex >= 0) return searchOrPath.slice(queryIndex + 1);
  if (searchOrPath.includes("/")) return "";
  return searchOrPath.replace(/^\?/, "");
}

function isTruthyQueryFlag(
  searchOrPath: string | null | undefined,
  param: string,
): boolean {
  if (!searchOrPath?.trim()) return false;
  const params = new URLSearchParams(queryFromSearchOrPath(searchOrPath));
  const value = params.get(param)?.trim().toLowerCase() ?? "";
  return value === "1" || value === "true" || value === "yes";
}

/**
 * True when a campaign URL asks to skip language selection and use Tamil.
 * Accepts `tamil=1`, `tamil=true`, or `tamil=yes`.
 */
export function isCampaignTamilLanguageFlag(
  searchOrPath: string | null | undefined,
): boolean {
  return isTruthyQueryFlag(searchOrPath, TAMIL_FLAG_PARAM);
}

/**
 * True when a campaign URL should show language selection.
 * Accepts `all=1`, `all=true`, or `all=yes`.
 */
export function isCampaignAllLanguagesFlag(
  searchOrPath: string | null | undefined,
): boolean {
  return isTruthyQueryFlag(searchOrPath, ALL_LANGUAGES_FLAG_PARAM);
}

/** Language picker only for `all=1`. A Tamil video link stays on Tamil. */
export function isCampaignLanguagePickerFlow(
  searchOrPath: string | null | undefined,
): boolean {
  return (
    isCampaignAllLanguagesFlag(searchOrPath) &&
    !isCampaignTamilLanguageFlag(searchOrPath)
  );
}

/**
 * Language locked by the URL.
 * Default is Hindi. `tamil=1` is Tamil. `all=1` returns null so the visitor chooses.
 */
export function campaignDirectLanguageCode(
  searchOrPath: string | null | undefined,
):
  | typeof CAMPAIGN_HINDI_LANGUAGE_CODE
  | typeof CAMPAIGN_TAMIL_LANGUAGE_CODE
  | null {
  if (isCampaignTamilLanguageFlag(searchOrPath)) {
    return CAMPAIGN_TAMIL_LANGUAGE_CODE;
  }
  if (isCampaignAllLanguagesFlag(searchOrPath)) return null;
  return CAMPAIGN_HINDI_LANGUAGE_CODE;
}
