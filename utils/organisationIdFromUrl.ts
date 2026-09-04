/** Default when `organisation_id` is absent or empty in the URL query (non-campaign pages). */
export const DEFAULT_ORGANISATION_ID = "ZINTEL1234";

/** Default org when path is `/campaign` and query has no `organisation_id`. */
export const BIFFLE_ORGANISATION_ID = "BIFFLE1234";

function normalizePathBasename(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

/**
 * Reads `organisation_id` from a URL search string (e.g. `location.search`).
 */
export function getOrganisationIdFromSearch(
  search: string,
  pathname?: string,
): string {
  const raw = new URLSearchParams(search).get("organisation_id")?.trim();
  if (raw == "ZINTEL1234" || raw == "CAMPAIGN_Z") return "ZINTEL1234";
  else if (raw == "BIFFLE1234" || raw == "CAMPAIGN_B") return "BIFFLE1234";
  else return DEFAULT_ORGANISATION_ID;
}

export function isBiffleOrganisationId(id: string | undefined): boolean {
  if (!id) return false;
  return id.trim().toUpperCase() === BIFFLE_ORGANISATION_ID;
}

/** Weekly mandate plan IDs: premium (₹100 slot) and basic (₹29 slot) per org. */
export function getWeeklySubscriptionPlanIds(organisationId: string): {
  premiumPlanId: number;
  basicPlanId: number;
} {
  if (isBiffleOrganisationId(organisationId)) {
    return { premiumPlanId: 8, basicPlanId: 5 };
  }
  return { premiumPlanId: 10, basicPlanId: 9 };
}

export function isWeeklySubscriptionPlanId(
  planId: number | string | undefined,
  organisationId: string,
): boolean {
  if (planId == null) return false;
  const id = Number(planId);
  const { premiumPlanId, basicPlanId } =
    getWeeklySubscriptionPlanIds(organisationId);
  return id === premiumPlanId || id === basicPlanId;
}
