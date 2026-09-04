import { isBiffleOrganisationId } from "./organisationIdFromUrl";
/** Biffle campaign: external fb redirect landing. */
const BIFFLE_FB_REDIRECT_URL = "https://biffle.ai/fbredirect";

/**
 * After successful campaign payment — Zintle uses in-app `/fb-redirect`;
 * Biffle uses external fbredirect URL.
 * fbclid is not passed: campaign login already stored + associated attribution.
 */
export function triggerCampaignFbRedirect({
  organisationId,
  navigate,
}: {
  organisationId: string;
  navigate: (to: string) => void;
}): void {
  if (isBiffleOrganisationId(organisationId)) {
    window.location.assign(BIFFLE_FB_REDIRECT_URL);
    return;
  }
  navigate("/fb-redirect");
}
