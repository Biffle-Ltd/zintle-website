import { HOST } from "./host";
import { headerSafeToken } from "./headerSafeToken";

type FreePlanApiPlan = {
  id: number;
  plan_name?: string;
  plan_description?: string;
  plan_duration?: number;
  price?: string | number;
  is_freetrial_allowed?: boolean;
  free_plan_duration?: number;
  trial_token_amount?: number;
  token_amount?: number;
  extra_info?: { video_url?: string; [key: string]: unknown };
  is_active?: boolean;
  subscription_id?: string;
  organisation_id?: string;
  coin_value?: number;
};

type FreePlanInfoResponse = {
  success?: boolean;
  data?: {
    count?: number;
    plans?: FreePlanApiPlan[];
    active_free_plan?: string;
  };
};

export type CampaignFreePlanDetails = {
  id: number;
  plan_name?: string;
  plan_description?: string;
  plan_duration?: number;
  price?: string | number;
  is_freetrial_allowed?: boolean;
  free_plan_duration?: number;
  trial_token_amount?: number;
  token_amount?: number;
  extra_info?: Record<string, unknown>;
  is_active?: boolean;
  subscription_id?: string;
  organisation_id?: string;
  coin_value?: number;
};

export type CampaignFreePlanError = Error & {
  status?: number;
  noActivePlan?: boolean;
};

function httpError(status: number, message: string): CampaignFreePlanError {
  const err = new Error(message) as CampaignFreePlanError;
  err.status = status;
  return err;
}

function apiPlanToDetails(p: FreePlanApiPlan): CampaignFreePlanDetails {
  return {
    id: p.id,
    plan_name: p.plan_name,
    plan_description: p.plan_description,
    plan_duration: p.plan_duration,
    price: p.price,
    is_freetrial_allowed: p.is_freetrial_allowed,
    free_plan_duration: p.free_plan_duration,
    trial_token_amount: p.trial_token_amount,
    token_amount: p.token_amount,
    extra_info: p.extra_info as Record<string, unknown> | undefined,
    is_active: p.is_active,
    subscription_id: p.subscription_id,
    organisation_id: p.organisation_id,
    coin_value: p.coin_value,
  };
}

export function isNoActiveCampaignFreePlanError(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "noActivePlan" in err &&
    (err as CampaignFreePlanError).noActivePlan === true
  );
}

export function isCampaignFreePlanAbortError(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "name" in err &&
    (err as { name?: string }).name === "AbortError"
  );
}

export function campaignFreePlanErrorStatus(err: unknown): number {
  if (err && typeof err === "object" && "status" in err) {
    return Number((err as { status?: number }).status) || 0;
  }
  return 0;
}

function hasUsablePlanId(id: unknown): id is number {
  return typeof id === "number" && Number.isFinite(id);
}

/** GET /monetization/plans/free-plan/info/?source=campaign — picks `active_free_plan`. */
export async function fetchCampaignActiveFreePlan(
  organisationId: string,
  token?: string | null,
  signal?: AbortSignal,
): Promise<CampaignFreePlanDetails> {
  const jwtToken = headerSafeToken(token);
  const response = await fetch(
    `${HOST}/api/v1/monetization/plans/free-plan/info/?source=campaign`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
        "X-Organisation-ID": organisationId,
      },
      signal,
    },
  );
  const json = (await response.json().catch(() => ({}))) as FreePlanInfoResponse;
  if (!response.ok || json.success === false) {
    throw httpError(
      response.status,
      "Could not load plan details. Try again later.",
    );
  }
  const data = json.data;
  const activeKey = data?.active_free_plan?.trim();
  const plans = data?.plans ?? [];
  const picked =
    activeKey != null && activeKey !== ""
      ? plans.find((p) => p.subscription_id === activeKey)
      : null;
  if (!picked || !hasUsablePlanId(picked.id)) {
    const err = httpError(
      response.status,
      "No active free plan is configured for this org.",
    );
    err.noActivePlan = true;
    throw err;
  }
  return apiPlanToDetails(picked);
}

export function buildCampaignCheckoutPath(opts: {
  plan: CampaignFreePlanDetails;
  organisationId: string;
  fbclid?: string | null;
}): string | null {
  if (!hasUsablePlanId(opts.plan.id)) return null;
  const params = new URLSearchParams();
  params.set("plan_id", String(opts.plan.id));
  params.set("organisation_id", opts.organisationId);
  params.set("is_campaign", "true");
  params.set(
    "plan_details",
    encodeURIComponent(JSON.stringify({ data: opts.plan })),
  );
  const fbclid = opts.fbclid?.trim();
  if (fbclid) params.set("fbclid", fbclid);
  return `/subscriptions?${params.toString()}`;
}

/**
 * Swap `plan_id` + `plan_details` on a pending `/subscriptions` URL.
 * Keeps organisation_id, is_campaign, fbclid, JWT `id`, etc.
 */
export function withRefreshedCampaignCheckoutPlan(
  pendingPath: string,
  plan: CampaignFreePlanDetails,
): string {
  if (!hasUsablePlanId(plan.id)) {
    throw httpError(0, "Active free plan is missing an id.");
  }
  try {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://127.0.0.1";
    const u = new URL(pendingPath, origin);
    const path = u.pathname.replace(/\/+$/, "") || "/";
    if (path !== "/subscriptions") {
      throw httpError(0, "Checkout path is not /subscriptions.");
    }
    u.searchParams.set("plan_id", String(plan.id));
    u.searchParams.set(
      "plan_details",
      encodeURIComponent(JSON.stringify({ data: plan })),
    );
    return `${u.pathname}${u.search}${u.hash}`;
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) throw err;
    throw httpError(0, "Could not apply refreshed plan to checkout path.");
  }
}

/** Authenticated re-fetch so language-routed SKUs (e.g. India Tamil) land in checkout. */
export async function refreshCampaignCheckoutPlanPath(opts: {
  checkoutPath: string;
  organisationId: string;
  token: string;
  signal?: AbortSignal;
}): Promise<string> {
  const plan = await fetchCampaignActiveFreePlan(
    opts.organisationId,
    opts.token,
    opts.signal,
  );
  const next = withRefreshedCampaignCheckoutPlan(opts.checkoutPath, plan);
  try {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://127.0.0.1";
    const u = new URL(next, origin);
    if (u.searchParams.get("plan_id") !== String(plan.id)) {
      throw httpError(0, "Could not apply refreshed plan to checkout path.");
    }
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) throw err;
    throw httpError(0, "Could not apply refreshed plan to checkout path.");
  }
  return next;
}
