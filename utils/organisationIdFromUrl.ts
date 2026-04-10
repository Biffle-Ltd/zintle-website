/** Default when `organisation_id` is absent or empty in the URL query. */
export const DEFAULT_ORGANISATION_ID = "ZINTEL1234";

/** Reads `organisation_id` from a URL search string (e.g. `location.search`). */
export function getOrganisationIdFromSearch(search: string): string {
  const raw = new URLSearchParams(search).get("organisation_id")?.trim();
  return raw || DEFAULT_ORGANISATION_ID;
}
