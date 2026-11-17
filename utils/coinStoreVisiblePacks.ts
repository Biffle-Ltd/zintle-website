import type { CoinStorePack, SubscriptionPlan } from "../components/CoinStoreMobile";
import {
  comparePackPrice,
  packCardFigures,
  splitCoinStoreOffers,
} from "./coinStoreOffer.ts";
import type { CoinPackForAnalytics } from "./pixelEvents.ts";

export function weeklyPlanToStorePack(plan: SubscriptionPlan): CoinStorePack {
  return {
    id: plan.id,
    coins: plan.coin_value ?? 0,
    price: plan.price,
    name: plan.plan_name,
  };
}

/** Cheapest weekly first. A missing price sorts last, then by id. */
export function comparePlanPrice(
  a: SubscriptionPlan,
  b: SubscriptionPlan,
): number {
  const price = (plan: SubscriptionPlan) => {
    const n = Number(plan.price);
    return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
  };
  return price(a) - price(b) || a.id - b.id;
}

/**
 * Weeklies for a non-member, cheapest first. The same plan can arrive in both
 * slots, and a non-finite price would render as ₹0 while still starting a
 * mandate, so both are dropped.
 */
export function uniqueWeeklyPlans(
  isMember: boolean,
  featured?: SubscriptionPlan | null,
  basic?: SubscriptionPlan | null,
): SubscriptionPlan[] {
  if (isMember) return [];
  const seen = new Set<number>();
  return [featured, basic]
    .filter((plan): plan is SubscriptionPlan => plan != null)
    .filter((plan) => Number.isFinite(Number(plan.price)))
    .sort(comparePlanPrice)
    .filter((plan) => {
      if (seen.has(plan.id)) return false;
      seen.add(plan.id);
      return true;
    });
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
  pack: Pick<
    CoinStorePack,
    | "id"
    | "coins"
    | "price"
    | "name"
    | "bonus_coins"
    | "bonus"
    | "base_coins"
    | "bonus_percent"
  >,
  flags?: Pick<
    CoinPackForAnalytics,
    "is_subscription" | "is_limited_plan" | "is_free_trial"
  >,
  options?: { catalogOffer?: boolean },
): CoinPackForAnalytics {
  const figures = options?.catalogOffer ? packCardFigures(pack) : null;
  return {
    id: pack.id,
    name: pack.name,
    coins: pack.coins,
    price: pack.price,
    bonus_coins: figures ? figures.free : (pack.bonus_coins ?? 0),
    ...(figures
      ? {
          ...(typeof pack.base_coins === "number" && pack.base_coins > 0
            ? { base_coins: pack.base_coins }
            : {}),
          bonus_pct: figures.percent,
        }
      : {}),
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

/** Zintle quick recharge is coin packs only. Trial and weekly stay on the full store. */
export function getZintleQuickRechargePacks(options: {
  isMember: boolean;
  timerPack: CoinStorePack | null;
  micropacks: CoinStorePack[];
}): CoinStorePack[] {
  const { isMember, timerPack, micropacks } = options;
  const packs: CoinStorePack[] = [];
  if (isMember && timerPack) packs.push(timerPack);
  const grid =
    isMember && timerPack
      ? micropacks.filter((pack) => pack.id !== timerPack.id)
      : micropacks;
  packs.push(...grid);
  return packs;
}

const ZINTLE_SHEET_ONE_TIME_PREVIEW = 2;

/** Zintle quick recharge is a short sheet: starter, most purchased, weeklies, then two one-time packs. */
export function getZintleQuickRechargeSheetPacks(options: {
  isMember: boolean;
  timerPack: CoinStorePack | null;
  micropacks: CoinStorePack[];
  featuredWeeklyPlan?: SubscriptionPlan | null;
  basicWeeklyPlan?: SubscriptionPlan | null;
}): CoinStorePack[] {
  const weeklies = uniqueWeeklyPlans(
    options.isMember,
    options.featuredWeeklyPlan,
    options.basicWeeklyPlan,
  ).map(weeklyPlanToStorePack);
  // A weekly that shares an id with a coin, or is cheaper than the coins, must
  // not be classified as Starter or Most Purchased.
  const weeklyIds = new Set(weeklies.map((pack) => pack.id));
  const offers = splitCoinStoreOffers(
    getZintleQuickRechargePacks(options).filter((pack) => !weeklyIds.has(pack.id)),
  );
  const oneTime = [...offers.oneTime]
    .sort(comparePackPrice)
    .slice(0, ZINTLE_SHEET_ONE_TIME_PREVIEW);
  return [
    ...(offers.starter ? [offers.starter] : []),
    ...(offers.mostPurchased ? [offers.mostPurchased] : []),
    ...weeklies,
    ...oneTime,
  ];
}

/**
 * Full Zintle store in the order the screen renders it: trial, starter,
 * most purchased, weekly plans cheapest first, then one-time by price.
 */
export function getZintleVisibleStorePacks(options: {
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
  const weeklies = uniqueWeeklyPlans(
    isMember,
    featuredWeeklyPlan,
    basicWeeklyPlan,
  );
  const weeklyIds = new Set(weeklies.map((plan) => plan.id));
  const coins: CoinStorePack[] = [];
  const seen = new Set<number>();
  const pushCoin = (pack: CoinStorePack | null | undefined) => {
    if (pack == null || seen.has(pack.id) || weeklyIds.has(pack.id)) return;
    seen.add(pack.id);
    coins.push(pack);
  };
  pushCoin(timerPack);
  for (const pack of exclusiveDeals) pushCoin(pack);
  for (const pack of topPlans) pushCoin(pack);

  const rows: CoinStorePack[] = [];
  const seenRows = new Set<number>();
  const pushRow = (pack: CoinStorePack | null | undefined) => {
    if (pack == null || seenRows.has(pack.id)) return;
    seenRows.add(pack.id);
    rows.push(pack);
  };
  const offers = splitCoinStoreOffers(coins);
  if (!isMember) pushRow(freeTrialPack);
  pushRow(offers.starter);
  pushRow(offers.mostPurchased);
  for (const plan of weeklies) pushRow(weeklyPlanToStorePack(plan));
  for (const pack of [...offers.oneTime].sort(comparePackPrice)) pushRow(pack);
  return rows;
}
