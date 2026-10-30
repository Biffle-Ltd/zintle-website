/** Query string for GET /monetization/plans/free-plan/info. */
export function campaignFreePlanInfoSearch(language?: string | null): string {
  const params = new URLSearchParams({ source: "campaign" });
  const code = language?.trim();
  if (code) params.set("language", code);
  return params.toString();
}
