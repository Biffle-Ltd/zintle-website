import { clearJwtForOrganisation } from "./authStorage";

/** Strip JWT from subscriptions checkout URL before storing post-login redirect. */
export function buildCampaignReLoginRedirect(
  pathname: string,
  search: string,
): string {
  const q = new URLSearchParams(search);
  q.delete("id");
  const query = q.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function isCampaignReAuthStatus(status: number): boolean {
  return status === 401 || status === 403;
}

/**
 * On 401/403: clear org JWT and run caller hook (typically open login).
 * Returns true when the response was handled as unauthorized.
 */
export function handleCampaignUnauthorized(
  status: number,
  organisationId: string,
  onRequireLogin: () => void,
): boolean {
  if (!isCampaignReAuthStatus(status)) return false;
  clearJwtForOrganisation(organisationId);
  onRequireLogin();
  return true;
}
