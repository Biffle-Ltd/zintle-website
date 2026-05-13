/** Session key for `/subscriptions` path + query after OTP login (set by `/campaign`, consumed by CoinStore). */
export const ZINTLE_POST_LOGIN_REDIRECT_KEY = "zintle_post_login_redirect";

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
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    const sep = relativePathWithSearch.includes("?") ? "&" : "?";
    return `${relativePathWithSearch}${sep}`;
  }
}
