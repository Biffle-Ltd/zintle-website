const STORAGE_PREFIX = "zintle_campaign_selected_language";

export function campaignSelectedLanguageKey(organisationId: string): string {
  return `${STORAGE_PREFIX}:${organisationId.trim()}`;
}

export function readCampaignSelectedLanguage(
  organisationId: string,
): string | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(campaignSelectedLanguageKey(organisationId));
    const code = raw?.trim() ?? "";
    return code || null;
  } catch {
    return null;
  }
}

export function writeCampaignSelectedLanguage(
  organisationId: string,
  languageCode: string,
): void {
  const code = languageCode.trim();
  if (!code) return;
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(campaignSelectedLanguageKey(organisationId), code);
  } catch {
    /* private mode / quota */
  }
}
