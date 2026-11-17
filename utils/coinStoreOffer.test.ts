import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  orderedOfferPacks,
  packCardFigures,
  splitCoinStoreOffers,
} from "./coinStoreOffer.ts";
import type { CoinStorePack } from "../components/CoinStoreMobile";

function pack(
  partial: Pick<CoinStorePack, "id" | "coins" | "price"> &
    Partial<CoinStorePack>,
): CoinStorePack {
  return { ...partial };
}

describe("packCardFigures", () => {
  it("shows bonus coins and percent only when the backend sends them", () => {
    assert.deepEqual(
      packCardFigures({
        coins: 200,
        base_coins: 40,
        bonus_coins: 160,
        bonus_percent: 400,
      }),
      { coins: 200, free: 160, percent: 400 },
    );
  });

  it("hides the percent when the backend does not send one", () => {
    assert.deepEqual(
      packCardFigures({ coins: 200, bonus_coins: 160 }),
      { coins: 200, free: 160, percent: null },
    );
  });

  it("does not invent a bonus from the price", () => {
    assert.deepEqual(
      packCardFigures({ coins: 200, price: 19, bonus_coins: 0 }),
      { coins: 200, free: 0, percent: null },
    );
  });
});

describe("splitCoinStoreOffers", () => {
  it("puts the cheapest pack in Starter and a highlighted pack in Most Purchased", () => {
    const packs = [
      pack({ id: 1, coins: 200, price: 39 }),
      pack({ id: 2, coins: 200, price: 19 }),
      pack({ id: 3, coins: 600, price: 99, highlight: true }),
      pack({ id: 4, coins: 300, price: 49 }),
    ];
    const split = splitCoinStoreOffers(packs);
    assert.equal(split.starter?.id, 2);
    assert.equal(split.mostPurchased?.id, 3);
    assert.deepEqual(
      split.oneTime.map((row) => row.id),
      [1, 4],
    );
  });

  it("does not label an ordinary pack as Most Purchased", () => {
    const packs = [
      pack({ id: 1, coins: 200, price: 19 }),
      pack({ id: 2, coins: 600, price: 99 }),
      pack({ id: 3, coins: 300, price: 49 }),
    ];
    const split = splitCoinStoreOffers(packs);
    assert.equal(split.starter?.id, 1);
    assert.equal(split.mostPurchased, null);
    assert.deepEqual(
      split.oneTime.map((row) => row.id),
      [2, 3],
    );
  });

  it("prefers a recommended name over an earlier bonus highlight", () => {
    const packs = [
      pack({ id: 1, coins: 200, price: 19, name: "Starter pack" }),
      pack({ id: 2, coins: 300, price: 49, name: "Bonus pack", highlight: true }),
      pack({ id: 3, coins: 600, price: 99, name: "Recommended pack" }),
    ];
    const split = splitCoinStoreOffers(packs);
    assert.equal(split.mostPurchased?.id, 3);
  });

  it("ignores a missing price when choosing the cheapest starter", () => {
    const packs = [
      pack({ id: 1, coins: 200, price: Number.NaN }),
      pack({ id: 2, coins: 300, price: 49 }),
    ];
    const split = splitCoinStoreOffers(packs);
    assert.equal(split.starter?.id, 2);
  });

  it("keeps a recommended pack ahead of an earlier best-value pack", () => {
    const packs = [
      pack({ id: 1, coins: 200, price: 19, name: "Starter pack" }),
      pack({ id: 2, coins: 240, price: 79, name: "Best value", tag: "Micropack" }),
      pack({ id: 3, coins: 600, price: 99, name: "Recommended pack" }),
      pack({ id: 4, coins: 200, price: 39, name: "Generic pack", tag: "Micropack" }),
    ];
    const split = splitCoinStoreOffers(packs);
    assert.equal(split.mostPurchased?.id, 3);
    assert.deepEqual(
      orderedOfferPacks(packs, 2).map((row) => row.id),
      [1, 3, 4, 2],
    );
  });

  it("does not treat the generated Micropack tag as a recommendation", () => {
    const packs = [
      pack({ id: 1, coins: 200, price: 19, name: "Starter pack", tag: "Micropack" }),
      pack({ id: 2, coins: 300, price: 49, name: "Value", tag: "Micropack" }),
    ];
    assert.equal(splitCoinStoreOffers(packs).mostPurchased, null);
  });

  it("prefers the backend starter and recommended names", () => {
    const packs = [
      pack({ id: 49, coins: 200, price: 39, name: "Generic pack" }),
      pack({ id: 21, coins: 200, price: 19, name: "Starter pack" }),
      pack({ id: 50, coins: 600, price: 99, name: "Recommended pack" }),
    ];
    const split = splitCoinStoreOffers(packs);
    assert.equal(split.starter?.id, 21);
    assert.equal(split.mostPurchased?.id, 50);
  });
});
