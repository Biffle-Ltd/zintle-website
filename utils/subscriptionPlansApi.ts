import type { SubscriptionPlan } from "../components/CoinStoreMobile";
import { HOST } from "./host";
import { headerSafeToken } from "./headerSafeToken";
import {
  SUBSCRIPTION_PACKS_CACHE_TTL_MS,
  readApiCache,
  takeBootPrefetchJson,
  tokenFingerprint,
  writeApiCache,
} from "./webviewApiCache";

export type CoinStoreSubscriptionPlans = {
  featuredWeeklyPlan: SubscriptionPlan | null;
  basicWeeklyPlan: SubscriptionPlan | null;
  subscriptionPlanIds: number[];
};

type SubscriptionPacksApiResponse = {
  data?: { plans?: unknown[] };
};

function subscriptionPacksCacheKey(
  organisationId: string,
  token: string | null,
): string {
  return `znw.v1.subPacks.${organisationId}.${tokenFingerprint(token)}`;
}

export function readCachedSubscriptionPlans(
  token: string,
  organisationId: string,
): CoinStoreSubscriptionPlans | null {
  const jwtToken = headerSafeToken(token);
  if (!jwtToken) return null;
  const cached = readApiCache<CoinStoreSubscriptionPlans>(
    subscriptionPacksCacheKey(organisationId, jwtToken),
    SUBSCRIPTION_PACKS_CACHE_TTL_MS,
  );
  if (!cached || cached.subscriptionPlanIds.length === 0) return null;
  return cached;
}

export const EMPTY_COIN_STORE_PLANS: CoinStoreSubscriptionPlans = {
  featuredWeeklyPlan: null,
  basicWeeklyPlan: null,
  subscriptionPlanIds: [],
};

function rememberSubscriptionPlans(
  organisationId: string,
  token: string | null,
  plans: CoinStoreSubscriptionPlans,
): void {
  if (!token || plans.subscriptionPlanIds.length === 0) return;
  writeApiCache(
    subscriptionPacksCacheKey(organisationId, token),
    plans,
  );
}

function normalizeSubscriptionPlan(raw: unknown): SubscriptionPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const plan = raw as Record<string, unknown>;
  const id = typeof plan.id === "number" ? plan.id : null;
  if (id == null) return null;

  const priceRaw = plan.price;
  const price =
    typeof priceRaw === "number"
      ? priceRaw
      : typeof priceRaw === "string"
        ? parseFloat(priceRaw)
        : NaN;
  if (!Number.isFinite(price)) return null;

  return {
    id,
    plan_name: String(plan.plan_name ?? ""),
    plan_description:
      typeof plan.plan_description === "string"
        ? plan.plan_description
        : undefined,
    price,
    plan_duration:
      typeof plan.plan_duration === "number" ? plan.plan_duration : 0,
    coin_value:
      typeof plan.coin_value === "number" ? plan.coin_value : undefined,
    subscription_id:
      typeof plan.subscription_id === "string"
        ? plan.subscription_id
        : undefined,
  };
}

function partitionCoinStoreSubscriptionPlans(
  plans: SubscriptionPlan[],
): Pick<CoinStoreSubscriptionPlans, "featuredWeeklyPlan" | "basicWeeklyPlan"> {
  const sorted = [...plans].sort((a, b) => b.price - a.price);
  return {
    featuredWeeklyPlan: sorted[0] ?? null,
    basicWeeklyPlan: sorted[1] ?? null,
  };
}

function plansFromPayload(
  json: SubscriptionPacksApiResponse,
): CoinStoreSubscriptionPlans {
  const rawPlans: unknown[] = json?.data?.plans ?? [];
  const plans = rawPlans
    .map(normalizeSubscriptionPlan)
    .filter((plan): plan is SubscriptionPlan => plan != null);
  const { featuredWeeklyPlan, basicWeeklyPlan } =
    partitionCoinStoreSubscriptionPlans(plans);
  return {
    featuredWeeklyPlan,
    basicWeeklyPlan,
    subscriptionPlanIds: plans.map((plan) => plan.id),
  };
}

/**
 * Reuses the HTML-boot prefetch (`window.__ZNW_SUBSCRIPTION_PACKS`) when present.
 * Keep the prefetch URL in `znw-boot.js` in sync with `HOST` in `utils/host.ts`.
 */
export async function fetchSubscriptionPlans(
  token: string,
  organisationId: string,
  signal?: AbortSignal,
): Promise<CoinStoreSubscriptionPlans> {
  const jwtToken = headerSafeToken(token);
  const pre =
    typeof window !== "undefined" ? window.__ZNW_SUBSCRIPTION_PACKS : undefined;
  const boot = await takeBootPrefetchJson<SubscriptionPacksApiResponse>(
    pre,
    organisationId,
    Boolean(jwtToken),
  );
  if (boot?.ok) {
    const plans = plansFromPayload(boot.json);
    rememberSubscriptionPlans(organisationId, jwtToken, plans);
    return plans;
  }

  const response = await fetch(
    `${HOST}/api/v1/monetization/plans/subscription-packs/`,
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
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = (await response.json()) as SubscriptionPacksApiResponse;
  const plans = plansFromPayload(json);
  rememberSubscriptionPlans(organisationId, jwtToken, plans);
  return plans;
}
