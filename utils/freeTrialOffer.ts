import type { CoinStorePack, SubscriptionPlan } from "../components/CoinStoreMobile";

/**
 * `free_trial_offer` on GET plans/subscription-packs.
 * Eligibility is the PhonePe penny-drop gate. An expired trial stays ineligible.
 */
export type FreeTrialOffer = {
  eligible: boolean;
  planId: number | null;
  subscriptionId: string | null;
  trialAmount: number | null;
  recurringPrice: number | null;
  currency: string | null;
  trialCoins: number | null;
  freePlanDuration: number | null;
  planDuration: number | null;
};

/** Card the coin store can render and purchase. */
export type VisibleFreeTrial = {
  planId: number;
  subscriptionId: string | null;
  trialAmount: number;
  recurringPrice: number | null;
  trialCoins: number | null;
  freePlanDuration: number;
  planDuration: number;
};

export const HIDDEN_FREE_TRIAL_OFFER: FreeTrialOffer = {
  eligible: false,
  planId: null,
  subscriptionId: null,
  trialAmount: null,
  recurringPrice: null,
  currency: null,
  trialCoins: null,
  freePlanDuration: null,
  planDuration: null,
};

/** Penny-drop auth amount when the offer has no display price. Matches mandate initiate. */
const PENNY_DROP_RUPEES = 2;

type PlansWithTrial = {
  featuredWeeklyPlan: SubscriptionPlan | null;
  basicWeeklyPlan: SubscriptionPlan | null;
  subscriptionPlanIds: number[];
  showInCoinstore: boolean;
  showInQuickCoinstore: boolean;
  freeTrialOffer: FreeTrialOffer;
};

function parseAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parsePlanId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isInteger(n)) return n;
  }
  return null;
}

function isInrCurrency(currency: string | null): boolean {
  return currency == null || currency.toUpperCase() === "INR";
}

function parseWhole(value: unknown): number | null {
  const n = parseAmount(value);
  if (n == null) return null;
  return Math.floor(n);
}

function parseText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text : null;
}

export function parseFreeTrialOffer(raw: unknown): FreeTrialOffer {
  if (!raw || typeof raw !== "object") return HIDDEN_FREE_TRIAL_OFFER;
  const offer = raw as Record<string, unknown>;
  const planId = parsePlanId(offer.plan_id ?? offer.planId);
  const eligible = offer.eligible === true && planId != null;
  return {
    eligible,
    planId,
    subscriptionId: parseText(offer.subscription_id ?? offer.subscriptionId),
    trialAmount: parseAmount(offer.trial_amount ?? offer.trialAmount),
    recurringPrice: parseAmount(offer.recurring_price ?? offer.recurringPrice),
    currency: parseText(offer.currency),
    trialCoins: parseWhole(offer.trial_coins ?? offer.trialCoins),
    freePlanDuration: parseWhole(
      offer.free_plan_duration ?? offer.freePlanDuration,
    ),
    planDuration: parseWhole(offer.plan_duration ?? offer.planDuration),
  };
}

export function parseTrialSurfaceFlags(raw: {
  show_in_coinstore?: unknown;
  show_in_quick_coinstore?: unknown;
  showInCoinstore?: unknown;
  showInQuickCoinstore?: unknown;
}): { showInCoinstore: boolean; showInQuickCoinstore: boolean } {
  return {
    showInCoinstore:
      raw.show_in_coinstore === true || raw.showInCoinstore === true,
    showInQuickCoinstore:
      raw.show_in_quick_coinstore === true || raw.showInQuickCoinstore === true,
  };
}

/** Plan id that must use mandate checkout when either surface may show the card. */
export function trialMandatePlanId(
  showInCoinstore: boolean,
  showInQuickCoinstore: boolean,
  offer: FreeTrialOffer,
): number | null {
  if (!offer.eligible || offer.planId == null) return null;
  if (!isInrCurrency(offer.currency)) return null;
  if (!showInCoinstore && !showInQuickCoinstore) return null;
  return offer.planId;
}

export function withTrialMandatePlanId(
  planIds: number[],
  showInCoinstore: boolean,
  showInQuickCoinstore: boolean,
  offer: FreeTrialOffer,
): number[] {
  const trialId = trialMandatePlanId(
    showInCoinstore,
    showInQuickCoinstore,
    offer,
  );
  if (trialId == null || planIds.includes(trialId)) return planIds;
  return [...planIds, trialId];
}

function chargeAmount(offer: FreeTrialOffer): number {
  if (offer.trialAmount != null && offer.trialAmount > 0) return offer.trialAmount;
  return PENNY_DROP_RUPEES;
}

export function visibleFreeTrialCard(options: {
  isMember: boolean;
  quickRecharge: boolean;
  showInCoinstore: boolean;
  showInQuickCoinstore: boolean;
  offer: FreeTrialOffer;
}): VisibleFreeTrial | null {
  if (options.isMember) return null;
  const enabled = options.quickRecharge
    ? options.showInQuickCoinstore
    : options.showInCoinstore;
  if (!enabled || !options.offer.eligible || options.offer.planId == null) {
    return null;
  }
  if (!isInrCurrency(options.offer.currency)) {
    return null;
  }
  return {
    planId: options.offer.planId,
    subscriptionId: options.offer.subscriptionId,
    trialAmount: chargeAmount(options.offer),
    recurringPrice: options.offer.recurringPrice,
    trialCoins: options.offer.trialCoins,
    freePlanDuration:
      options.offer.freePlanDuration != null && options.offer.freePlanDuration > 0
        ? options.offer.freePlanDuration
        : 0,
    planDuration:
      options.offer.planDuration != null && options.offer.planDuration > 0
        ? options.offer.planDuration
        : 0,
  };
}

export function omitWeeklyPlanMatchingTrial(
  featuredWeeklyPlan: SubscriptionPlan | null,
  basicWeeklyPlan: SubscriptionPlan | null,
  trialPlanId: number | null,
): {
  featuredWeeklyPlan: SubscriptionPlan | null;
  basicWeeklyPlan: SubscriptionPlan | null;
} {
  if (trialPlanId == null) {
    return { featuredWeeklyPlan, basicWeeklyPlan };
  }
  return {
    featuredWeeklyPlan:
      featuredWeeklyPlan?.id === trialPlanId ? null : featuredWeeklyPlan,
    basicWeeklyPlan:
      basicWeeklyPlan?.id === trialPlanId ? null : basicWeeklyPlan,
  };
}

/**
 * A cached eligible offer is not proof the user can still penny-drop.
 * Hide the card and drop a trial-only mandate id until a fresh response confirms it.
 * Weekly cards that share the id stay, at their listed price.
 */
export function withholdUnconfirmedTrial(plans: PlansWithTrial): PlansWithTrial {
  const trialId = plans.freeTrialOffer.planId;
  const offerWasEligible = plans.freeTrialOffer.eligible && trialId != null;
  const weeklyIds = new Set(
    [plans.featuredWeeklyPlan?.id, plans.basicWeeklyPlan?.id].filter(
      (id): id is number => typeof id === "number",
    ),
  );
  return {
    ...plans,
    showInCoinstore: false,
    showInQuickCoinstore: false,
    freeTrialOffer: HIDDEN_FREE_TRIAL_OFFER,
    subscriptionPlanIds: offerWasEligible
      ? plans.subscriptionPlanIds.filter(
          (id) => id !== trialId || weeklyIds.has(id),
        )
      : plans.subscriptionPlanIds,
  };
}

export function resolveCoinStoreTrialSurface(options: {
  isMember: boolean;
  quickRecharge: boolean;
  plans: PlansWithTrial;
  /**
   * Hide the card and its weekly duplicate. The coin store does not pass this:
   * an open trial checkout stays on screen and is disabled instead.
   */
  holdPlanId?: number | null;
}): {
  featuredWeeklyPlan: SubscriptionPlan | null;
  basicWeeklyPlan: SubscriptionPlan | null;
  subscriptionPlanIds: number[];
  freeTrial: VisibleFreeTrial | null;
} {
  const freeTrial = visibleFreeTrialCard({
    isMember: options.isMember,
    quickRecharge: options.quickRecharge,
    showInCoinstore: options.plans.showInCoinstore,
    showInQuickCoinstore: options.plans.showInQuickCoinstore,
    offer: options.plans.freeTrialOffer,
  });
  const held =
    options.holdPlanId != null &&
    options.plans.freeTrialOffer.eligible &&
    options.plans.freeTrialOffer.planId === options.holdPlanId
      ? options.holdPlanId
      : null;
  const weekly = omitWeeklyPlanMatchingTrial(
    options.plans.featuredWeeklyPlan,
    options.plans.basicWeeklyPlan,
    freeTrial?.planId ?? held,
  );
  return {
    ...weekly,
    subscriptionPlanIds: options.plans.subscriptionPlanIds,
    freeTrial: held ? null : freeTrial,
  };
}

export function freeTrialToStorePack(trial: VisibleFreeTrial): CoinStorePack {
  return {
    id: trial.planId,
    coins: trial.trialCoins ?? 0,
    price: trial.trialAmount,
    name: "Free trial",
  };
}

/**
 * Trial becomes the selection when nothing is selected yet, or when the
 * current selection is the weekly plan it replaces. A coin pack the user
 * (or an in-call default) already has stays put.
 */
export function preferFreeTrialSelection<T extends { id: number }>(
  current: T | null,
  trialPack: T,
  weeklyPlanIds: Array<number | null | undefined>,
): T {
  if (current == null || current.id === trialPack.id) {
    return current ?? trialPack;
  }
  if (weeklyPlanIds.some((id) => id != null && id === current.id)) {
    return trialPack;
  }
  return current;
}

/**
 * The follow-up subscription-packs response still says this checkout's trial
 * can be bought. The card stays on screen and the current selection stays put.
 */
export function trialCheckoutStillOpen(options: {
  lockedTrialPlanId: number | null;
  offerEligible: boolean;
  offerPlanId: number | null;
}): boolean {
  return (
    options.lockedTrialPlanId != null &&
    options.offerEligible &&
    options.offerPlanId === options.lockedTrialPlanId
  );
}

/**
 * A failed weekly mandate must not re-enable a trial checkout that is still
 * outstanding. Only the mandate that opened the lock can clear it.
 */
export function trialLockAfterMandateFailure(
  lockedPlanId: number | null,
  lockedMandateId: number | null,
  failedMandateId: number,
): number | null {
  if (lockedMandateId != null && lockedMandateId === failedMandateId) {
    return null;
  }
  return lockedPlanId;
}

function formatRupee(amount: number): string {
  return Number.isInteger(amount) ? `₹${amount}` : `₹${amount.toFixed(2)}`;
}

function recurringUnit(planDuration: number): string | null {
  if (planDuration === 7) return "week";
  if (planDuration === 30 || planDuration === 31) return "month";
  if (planDuration === 90) return "3 months";
  if (planDuration > 0) return `${planDuration} days`;
  return null;
}

export function freeTrialThenLabel(trial: VisibleFreeTrial): string {
  const unit = recurringUnit(trial.planDuration);
  const price =
    trial.recurringPrice != null ? formatRupee(trial.recurringPrice) : null;
  const after =
    trial.freePlanDuration > 0
      ? ` after ${trial.freePlanDuration} ${trial.freePlanDuration === 1 ? "day" : "days"}`
      : "";
  if (price && unit) return `Then ${price}/${unit}${after}`;
  if (price) return `Then ${price}${after}`;
  if (after) return `Autopay${after}`;
  return "Autopay. Cancel anytime.";
}
