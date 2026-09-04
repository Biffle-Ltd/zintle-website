/** Session key for `/subscriptions` path + query after OTP login (set by `/campaign`, consumed by CoinStore). */
export const ZINTLE_POST_LOGIN_REDIRECT_KEY = "zintle_post_login_redirect";

/** Pending campaign checkout while user completes `/campaign/language`. */
export const CAMPAIGN_LANGUAGE_REDIRECT_KEY = "zintle_campaign_language_redirect";

const CAMPAIGN_LANGUAGE_QUERY_KEYS = [
  "organisation_id",
  "fbclid",
  "plan_id",
] as const;

/** Builds `/campaign/language?…` preserving campaign analytics query params. */
export function buildCampaignLanguagePath(search: string): string {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const preserved = new URLSearchParams();
  for (const key of CAMPAIGN_LANGUAGE_QUERY_KEYS) {
    const value = params.get(key);
    if (value?.trim()) preserved.set(key, value.trim());
  }
  const query = preserved.toString();
  return query ? `/campaign/language?${query}` : "/campaign/language";
}

/**
 * Adds or replaces the `id` query param (JWT) on a relative path such as
 * `/subscriptions?plan_id=1&organisation_id=BIFFLE1234`.
 */
export function withJwtInQuery(
  relativePathWithSearch: string,
  jwt: string,
): string {
  try {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://127.0.0.1";
    const u = new URL(relativePathWithSearch, origin);
    u.searchParams.set("id", jwt);
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    const sep = relativePathWithSearch.includes("?") ? "&" : "?";
    return `${relativePathWithSearch}${sep}`;
  }
}
