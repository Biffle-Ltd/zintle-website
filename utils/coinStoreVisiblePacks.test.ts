import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CoinStorePack, SubscriptionPlan } from "../components/CoinStoreMobile";
import {
  comparePlanPrice,
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

describe("comparePlanPrice", () => {
  it("sorts a missing price after a real price", () => {
    const priced = plan(9, 29);
    const missing = { ...plan(10, 100), price: Number.NaN };
    assert.ok(comparePlanPrice(priced, missing) < 0);
    assert.ok(comparePlanPrice(missing, priced) > 0);
  });
});
