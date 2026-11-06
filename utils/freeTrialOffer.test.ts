import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  freeTrialThenLabel,
  freeTrialToStorePack,
  preferFreeTrialSelection,
  parseFreeTrialOffer,
  parseTrialSurfaceFlags,
  resolveCoinStoreTrialSurface,
  trialMandatePlanId,
  withTrialMandatePlanId,
  withholdUnconfirmedTrial,
} from "./freeTrialOffer.ts";

const weekly = {
  id: 8,
  plan_name: "Weekly",
  price: 49,
  plan_duration: 7,
  coin_value: 160,
};

const apiOffer = {
  eligible: true,
  plan_id: 8,
  subscription_id: "coin_weekly",
  trial_amount: "2",
  recurring_price: "49.00",
  currency: "INR",
  trial_coins: 80,
  free_plan_duration: 3,
  plan_duration: 7,
};

function plans(overrides: Record<string, unknown> = {}) {
  return {
    featuredWeeklyPlan: weekly,
    basicWeeklyPlan: null,
    subscriptionPlanIds: [8],
    showInCoinstore: true,
    showInQuickCoinstore: false,
    freeTrialOffer: parseFreeTrialOffer(apiOffer),
    ...overrides,
  };
}

describe("parseFreeTrialOffer", () => {
  it("reads the subscription-packs offer", () => {
    const offer = parseFreeTrialOffer(apiOffer);
    assert.equal(offer.eligible, true);
    assert.equal(offer.planId, 8);
    assert.equal(offer.trialAmount, 2);
    assert.equal(offer.recurringPrice, 49);
    assert.equal(offer.trialCoins, 80);
    assert.equal(offer.freePlanDuration, 3);
  });

  it("hides an offer that is not eligible or has no plan id", () => {
    assert.equal(parseFreeTrialOffer({ eligible: false, plan_id: 8 }).eligible, false);
    assert.equal(parseFreeTrialOffer({ eligible: true }).eligible, false);
    assert.equal(parseFreeTrialOffer(null).eligible, false);
  });

  it("accepts a numeric string plan id", () => {
    const offer = parseFreeTrialOffer({ ...apiOffer, plan_id: "8" });
    assert.equal(offer.eligible, true);
    assert.equal(offer.planId, 8);
  });
});

describe("trial surface", () => {
  it("shows the card only on the flagged surface", () => {
    const store = resolveCoinStoreTrialSurface({
      isMember: false,
      quickRecharge: false,
      plans: plans(),
    });
    assert.equal(store.freeTrial?.planId, 8);
    assert.equal(store.freeTrial?.trialAmount, 2);
    assert.equal(store.featuredWeeklyPlan, null);

    const popup = resolveCoinStoreTrialSurface({
      isMember: false,
      quickRecharge: true,
      plans: plans(),
    });
    assert.equal(popup.freeTrial, null);
    assert.equal(popup.featuredWeeklyPlan?.id, 8);
  });

  it("keeps the weekly card when the flag for this surface is off", () => {
    const resolved = resolveCoinStoreTrialSurface({
      isMember: false,
      quickRecharge: false,
      plans: plans({ showInCoinstore: false, showInQuickCoinstore: true }),
    });
    assert.equal(resolved.freeTrial, null);
    assert.equal(resolved.featuredWeeklyPlan?.price, 49);
  });

  it("hides the card for members and after the offer is ineligible", () => {
    const member = resolveCoinStoreTrialSurface({
      isMember: true,
      quickRecharge: false,
      plans: plans(),
    });
    assert.equal(member.freeTrial, null);
    assert.equal(member.featuredWeeklyPlan?.id, 8);

    const expired = resolveCoinStoreTrialSurface({
      isMember: false,
      quickRecharge: false,
      plans: plans({
        freeTrialOffer: parseFreeTrialOffer({ ...apiOffer, eligible: false }),
      }),
    });
    assert.equal(expired.freeTrial, null);
    assert.equal(expired.featuredWeeklyPlan?.id, 8);
  });

  it("hides a non-INR offer even if the payload says eligible", () => {
    const resolved = resolveCoinStoreTrialSurface({
      isMember: false,
      quickRecharge: false,
      plans: plans({
        freeTrialOffer: parseFreeTrialOffer({ ...apiOffer, currency: "AED" }),
      }),
    });
    assert.equal(resolved.freeTrial, null);
    assert.equal(
      trialMandatePlanId(true, false, parseFreeTrialOffer({ ...apiOffer, currency: "AED" })),
      null,
    );
  });

  it("uses the penny-drop price on the store pack", () => {
    const resolved = resolveCoinStoreTrialSurface({
      isMember: false,
      quickRecharge: false,
      plans: plans({
        freeTrialOffer: parseFreeTrialOffer({ ...apiOffer, trial_amount: null }),
      }),
    });
    const pack = freeTrialToStorePack(resolved.freeTrial!);
    assert.equal(pack.price, 2);
    assert.equal(pack.coins, 80);
    assert.equal(pack.id, 8);
  });

  it("adds the trial plan id for mandate checkout when a flag is on", () => {
    const offer = parseFreeTrialOffer(apiOffer);
    assert.deepEqual(withTrialMandatePlanId([4], true, false, offer), [4, 8]);
    assert.deepEqual(withTrialMandatePlanId([8], true, false, offer), [8]);
    assert.deepEqual(withTrialMandatePlanId([4], false, false, offer), [4]);
  });

  it("keeps a different weekly plan beside the trial card", () => {
    const resolved = resolveCoinStoreTrialSurface({
      isMember: false,
      quickRecharge: false,
      plans: plans({
        featuredWeeklyPlan: { ...weekly, id: 4, price: 99 },
        subscriptionPlanIds: [4],
        freeTrialOffer: parseFreeTrialOffer({ ...apiOffer, plan_id: 8 }),
      }),
    });
    assert.equal(resolved.freeTrial?.planId, 8);
    assert.equal(resolved.featuredWeeklyPlan?.id, 4);
    assert.equal(resolved.featuredWeeklyPlan?.price, 99);
  });

  it("describes the recurring charge", () => {
    const resolved = resolveCoinStoreTrialSurface({
      isMember: false,
      quickRecharge: false,
      plans: plans(),
    });
    assert.equal(freeTrialThenLabel(resolved.freeTrial!), "Then ₹49/week after 3 days");
  });

  it("does not advertise a cached eligible offer before the network confirms it", () => {
    const withheld = withholdUnconfirmedTrial(plans());
    const resolved = resolveCoinStoreTrialSurface({
      isMember: false,
      quickRecharge: false,
      plans: withheld,
    });
    assert.equal(resolved.freeTrial, null);
    assert.equal(resolved.featuredWeeklyPlan?.id, 8);
    assert.equal(resolved.featuredWeeklyPlan?.price, 49);
    assert.deepEqual(resolved.subscriptionPlanIds, [8]);
  });

  it("drops a trial-only mandate id until the offer is confirmed", () => {
    const withheld = withholdUnconfirmedTrial(
      plans({
        featuredWeeklyPlan: null,
        subscriptionPlanIds: [8],
      }),
    );
    assert.equal(withheld.freeTrialOffer.eligible, false);
    assert.equal(withheld.showInCoinstore, false);
    assert.deepEqual(withheld.subscriptionPlanIds, []);
  });

  it("hides the card and the matching weekly plan while checkout is in flight", () => {
    const resolved = resolveCoinStoreTrialSurface({
      isMember: false,
      quickRecharge: false,
      plans: plans(),
      holdPlanId: 8,
    });
    assert.equal(resolved.freeTrial, null);
    assert.equal(resolved.featuredWeeklyPlan, null);
    assert.deepEqual(resolved.subscriptionPlanIds, [8]);
  });

  it("replaces an empty or weekly selection and leaves a coin pack alone", () => {
    const trial = { id: 7, price: 2 };
    const weekly = { id: 10, price: 100 };
    const coins = { id: 22, price: 49 };
    assert.equal(preferFreeTrialSelection(null, trial, [10, 9]).id, 7);
    assert.equal(preferFreeTrialSelection(weekly, trial, [10, 9]).id, 7);
    assert.equal(preferFreeTrialSelection(coins, trial, [10, 9]).id, 22);
    assert.equal(preferFreeTrialSelection(trial, trial, [10, 9]), trial);
  });

  it("treats a lowercase INR currency as eligible", () => {
    const offer = parseFreeTrialOffer({ ...apiOffer, currency: "inr" });
    assert.equal(trialMandatePlanId(true, false, offer), 8);
  });

  it("reads only boolean flags", () => {
    assert.deepEqual(
      parseTrialSurfaceFlags({
        show_in_coinstore: true,
        show_in_quick_coinstore: "true",
      }),
      { showInCoinstore: true, showInQuickCoinstore: false },
    );
  });
});
