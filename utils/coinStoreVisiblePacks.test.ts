import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CoinStorePack, SubscriptionPlan } from "../components/CoinStoreMobile";
import {
  comparePlanPrice,
  getZintleQuickRechargeSheetPacks,
  getZintleVisibleStorePacks,
} from "./coinStoreVisiblePacks.ts";

function pack(
  partial: Pick<CoinStorePack, "id" | "coins" | "price"> & Partial<CoinStorePack>,
): CoinStorePack {
  return { ...partial };
}

function plan(id: number, price: number): SubscriptionPlan {
  return {
    id,
    plan_name: `Weekly ${price}`,
    price,
    plan_duration: 7,
    coin_value: price === 29 ? 90 : 399,
  };
}

const starter = pack({ id: 21, coins: 200, price: 19, name: "Starter pack" });
const value = pack({ id: 49, coins: 200, price: 39, name: "Value" });
const recommended = pack({
  id: 50,
  coins: 600,
  price: 99,
  name: "Recommended pack",
});

describe("getZintleVisibleStorePacks", () => {
  it("puts the cheaper weekly between most purchased and one-time packs", () => {
    const rows = getZintleVisibleStorePacks({
      isMember: false,
      featuredWeeklyPlan: plan(10, 100),
      basicWeeklyPlan: plan(9, 29),
      timerPack: null,
      exclusiveDeals: [starter, value],
      topPlans: [recommended],
      freeTrialPack: pack({ id: 7, coins: 50, price: 2, name: "Trail" }),
    });
    assert.deepEqual(
      rows.map((row) => row.id),
      [7, 21, 50, 9, 10, 49],
    );
  });

  it("hides the trial and weeklies for a member", () => {
    const rows = getZintleVisibleStorePacks({
      isMember: true,
      featuredWeeklyPlan: plan(10, 100),
      basicWeeklyPlan: plan(9, 29),
      timerPack: null,
      exclusiveDeals: [starter],
      topPlans: [recommended],
      freeTrialPack: pack({ id: 7, coins: 50, price: 2, name: "Trail" }),
    });
    assert.deepEqual(
      rows.map((row) => row.id),
      [21, 50],
    );
  });
});

describe("getZintleQuickRechargeSheetPacks", () => {
  it("shows weeklies after most purchased and keeps two one-time packs", () => {
    const rows = getZintleQuickRechargeSheetPacks({
      isMember: false,
      timerPack: null,
      micropacks: [
        starter,
        value,
        pack({ id: 48, coins: 300, price: 49, name: "Value plus" }),
        pack({ id: 23, coins: 480, price: 79, name: "Generic" }),
        recommended,
      ],
      featuredWeeklyPlan: plan(10, 100),
      basicWeeklyPlan: plan(9, 29),
    });
    assert.deepEqual(
      rows.map((row) => row.id),
      [21, 50, 9, 10, 49, 48],
    );
  });

  it("keeps a cheaper weekly out of the starter slot", () => {
    const rows = getZintleQuickRechargeSheetPacks({
      isMember: false,
      timerPack: null,
      micropacks: [pack({ id: 49, coins: 200, price: 39, name: "Value" })],
      featuredWeeklyPlan: {
        ...plan(9, 29),
        plan_name: "Recommended starter weekly",
      },
      basicWeeklyPlan: null,
    });
    assert.deepEqual(
      rows.map((row) => row.id),
      [49, 9],
    );
  });

  it("drops a coin that shares an id with a weekly", () => {
    const rows = getZintleQuickRechargeSheetPacks({
      isMember: false,
      timerPack: null,
      micropacks: [
        pack({ id: 9, coins: 200, price: 19, name: "Starter pack" }),
        recommended,
        value,
      ],
      featuredWeeklyPlan: plan(9, 29),
      basicWeeklyPlan: plan(10, 100),
    });
    assert.deepEqual(
      rows.map((row) => row.id),
      [49, 50, 9, 10],
    );
  });

  it("shows a repeated weekly once and hides one with no price", () => {
    const repeated = getZintleQuickRechargeSheetPacks({
      isMember: false,
      timerPack: null,
      micropacks: [starter],
      featuredWeeklyPlan: plan(9, 100),
      basicWeeklyPlan: plan(9, 29),
    });
    assert.deepEqual(
      repeated.map((row) => row.id),
      [21, 9],
    );

    const unpriced = getZintleQuickRechargeSheetPacks({
      isMember: false,
      timerPack: null,
      micropacks: [starter],
      featuredWeeklyPlan: { ...plan(10, 100), price: Number.NaN },
      basicWeeklyPlan: plan(9, 29),
    });
    assert.deepEqual(
      unpriced.map((row) => row.id),
      [21, 9],
    );
  });

  it("hides weeklies for a member", () => {
    const rows = getZintleQuickRechargeSheetPacks({
      isMember: true,
      timerPack: null,
      micropacks: [starter, recommended, value],
      featuredWeeklyPlan: plan(10, 100),
      basicWeeklyPlan: plan(9, 29),
    });
    assert.deepEqual(
      rows.map((row) => row.id),
      [21, 50, 49],
    );
  });
});

describe("comparePlanPrice", () => {
  it("sorts a missing price after a real price", () => {
    const priced = plan(9, 29);
    const missing = { ...plan(10, 100), price: Number.NaN };
    assert.ok(comparePlanPrice(priced, missing) < 0);
    assert.ok(comparePlanPrice(missing, priced) > 0);
  });
});
