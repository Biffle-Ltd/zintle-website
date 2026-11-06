import type { CoinStorePack, SubscriptionPlan } from "../components/CoinStoreMobile";
import type { CoinPackForAnalytics } from "./pixelEvents";

export function weeklyPlanToStorePack(plan: SubscriptionPlan): CoinStorePack {
  return {
    id: plan.id,
    coins: plan.coin_value ?? 0,
    price: plan.price,
    name: plan.plan_name,
  };
}

export function analyticsFlagsForStorePack(
  pack: { id: number },
  featuredWeeklyPlan: SubscriptionPlan | null,
  basicWeeklyPlan: SubscriptionPlan | null,
  freeTrialPlanId?: number | null,
): Pick<
  CoinPackForAnalytics,
  "is_subscription" | "is_limited_plan" | "is_free_trial"
> {
  if (freeTrialPlanId != null && pack.id === freeTrialPlanId) {
    return { is_subscription: true, is_free_trial: true };
  }
  if (featuredWeeklyPlan?.id === pack.id) {
    return { is_subscription: true, is_limited_plan: true };
  }
  if (basicWeeklyPlan?.id === pack.id) {
    return { is_subscription: true, is_limited_plan: false };
  }
  return {};
}

export function toCoinPackForAnalytics(
  pack: Pick<CoinStorePack, "id" | "coins" | "price" | "name" | "bonus_coins">,
  flags?: Pick<
    CoinPackForAnalytics,
    "is_subscription" | "is_limited_plan" | "is_free_trial"
  >,
): CoinPackForAnalytics {
  return {
    id: pack.id,
    name: pack.name,
    coins: pack.coins,
    price: pack.price,
    bonus_coins: pack.bonus_coins ?? 0,
    ...(flags?.is_subscription ? { is_subscription: true } : {}),
    ...(flags?.is_limited_plan ? { is_limited_plan: true } : {}),
    ...(flags?.is_free_trial ? { is_free_trial: true } : {}),
  };
}

export function enrichStorePackWithWeeklyPlan(
  pack: CoinStorePack,
  featuredWeeklyPlan: SubscriptionPlan | null,
  basicWeeklyPlan: SubscriptionPlan | null,
): CoinStorePack {
  if (featuredWeeklyPlan?.id === pack.id) {
    return weeklyPlanToStorePack(featuredWeeklyPlan);
  }
  if (basicWeeklyPlan?.id === pack.id) {
    return weeklyPlanToStorePack(basicWeeklyPlan);
  }
  return pack;
}

function filterDuplicateBasicWeeklyPrice(
  packs: CoinStorePack[],
  isMember: boolean,
  basicWeeklyPlan: SubscriptionPlan | null,
): CoinStorePack[] {
  if (isMember || !basicWeeklyPlan) return packs;
  return packs.filter((p) => p.price !== basicWeeklyPlan.price);
}

/** Full coin store cards in on-screen order, including weekly plans for non-members. */
export function getVisibleCoinStorePacks(options: {
  isMember: boolean;
  featuredWeeklyPlan: SubscriptionPlan | null;
  basicWeeklyPlan: SubscriptionPlan | null;
  timerPack: CoinStorePack | null;
  exclusiveDeals: CoinStorePack[];
  topPlans: CoinStorePack[];
  freeTrialPack?: CoinStorePack | null;
}): CoinStorePack[] {
  const {
    isMember,
    featuredWeeklyPlan,
    basicWeeklyPlan,
    timerPack,
    exclusiveDeals,
    topPlans,
    freeTrialPack,
  } = options;
  const packs: CoinStorePack[] = [];

  if (!isMember && freeTrialPack) {
    packs.push(freeTrialPack);
  }
  if (!isMember && featuredWeeklyPlan) {
    packs.push(weeklyPlanToStorePack(featuredWeeklyPlan));
  } else if (isMember && timerPack) {
    packs.push(timerPack);
  }
  if (!isMember && basicWeeklyPlan) {
    packs.push(weeklyPlanToStorePack(basicWeeklyPlan));
  }
  packs.push(
    ...filterDuplicateBasicWeeklyPrice(
      exclusiveDeals,
      isMember,
      basicWeeklyPlan,
    ),
  );
  packs.push(...topPlans);
  return packs;
}

/** Quick recharge cards in on-screen order, including weekly plans for non-members. */
export function getVisibleQuickRechargePacks(options: {
  isMember: boolean;
  featuredWeeklyPlan: SubscriptionPlan | null;
  basicWeeklyPlan: SubscriptionPlan | null;
  timerPack: CoinStorePack | null;
  micropacks: CoinStorePack[];
  freeTrialPack?: CoinStorePack | null;
}): CoinStorePack[] {
  const {
    isMember,
    featuredWeeklyPlan,
    basicWeeklyPlan,
    timerPack,
    micropacks,
    freeTrialPack,
  } = options;
  const packs: CoinStorePack[] = [];

  if (!isMember && freeTrialPack) {
    packs.push(freeTrialPack);
  }
  if (!isMember && featuredWeeklyPlan) {
    packs.push(weeklyPlanToStorePack(featuredWeeklyPlan));
  }
  if (isMember && timerPack) {
    packs.push(timerPack);
  }
  if (!isMember && basicWeeklyPlan) {
    packs.push(weeklyPlanToStorePack(basicWeeklyPlan));
  }

  let grid = micropacks;
  if (isMember && timerPack) {
    grid = grid.filter((p) => p.id !== timerPack.id);
  }
  grid = filterDuplicateBasicWeeklyPrice(grid, isMember, basicWeeklyPlan);
  packs.push(...grid);
  return packs;
}
