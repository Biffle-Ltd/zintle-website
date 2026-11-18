import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cachedPackHasCatalogTotals,
  isPurchasableCatalogPack,
  mapCatalogCoinPack,
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

  it("shows coin value as the main number and keeps the bonus beside it", () => {
    assert.deepEqual(
      packCardFigures({
        coins: 100,
        total_coins: 125,
        bonus_coins: 25,
        bonus_percent: 25,
      }),
      { coins: 100, free: 25, percent: 25 },
    );
  });

  it("keeps a fractional bonus percent from the catalog", () => {
    assert.equal(
      packCardFigures({ coins: 49, total_coins: 61.5, bonus_coins: 12.5, bonus_percent: 25.51 })
        .percent,
      25.51,
    );
  });
});

describe("mapCatalogCoinPack", () => {
  it("reads string coin fields and the new total and percent", () => {
    const pack = mapCatalogCoinPack({
      id: 12,
      name: "100 coins",
      coin_value: "100.00",
      bonus_coins: "25.00",
      total_coins: 125,
      bonus_percentage: 25,
      amount: 49,
      product_id: "coin_49",
      isBonusPack: true,
      isTrialPack: false,
      isMicropack: false,
    });
    assert.equal(pack.coins, 100);
    assert.equal(pack.total_coins, 125);
    assert.equal(pack.bonus_coins, 25);
    assert.equal(pack.bonus_percent, 25);
    assert.equal(pack.base_coins, 100);
    assert.equal(pack.price, 49);
    assert.equal(pack.highlight, true);
    assert.equal(pack.tag, undefined);
    assert.deepEqual(packCardFigures(pack), {
      coins: 100,
      free: 25,
      percent: 25,
    });
  });

  it("hides a zero percent and does not invent a free line", () => {
    const pack = mapCatalogCoinPack({
      id: 36,
      coin_value: "15000.00",
      bonus_coins: "0.00",
      total_coins: "15000.00",
      bonus_percentage: "0.00",
      amount: "4999.00",
    });
    assert.deepEqual(packCardFigures(pack), {
      coins: 15000,
      free: 0,
      percent: null,
    });
  });

  it("does not turn a missing price into a free pack", () => {
    const pack = mapCatalogCoinPack({
      id: 9,
      coin_value: 100,
      total_coins: 100,
      amount: "nope",
    });
    assert.equal(Number.isFinite(pack.price), false);
    assert.equal(isPurchasableCatalogPack(pack), false);
  });

  it("keeps a catalog that has no total on coin_value", () => {
    const pack = mapCatalogCoinPack({
      id: 3,
      coin_value: 200,
      amount: 39,
      bonus_coins: 0,
    });
    assert.equal(pack.total_coins, undefined);
    assert.equal(pack.base_coins, undefined);
    assert.deepEqual(packCardFigures(pack), {
      coins: 200,
      free: 0,
      percent: null,
    });
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

  it("does not call the first bonus pack Most Purchased when every pack is flagged", () => {
    const packs = [
      pack({ id: 49, coins: 80, price: 39, name: "Generic pack", highlight: true }),
      pack({ id: 22, coins: 100, price: 49, name: "Value pack", highlight: true }),
      pack({ id: 50, coins: 200, price: 99, name: "Recommended pack", highlight: true }),
    ];
    assert.equal(splitCoinStoreOffers(packs).mostPurchased?.id, 50);
    const unnamed = packs.map((row) =>
      row.id === 50 ? { ...row, name: "Power pack" } : row,
    );
    assert.equal(splitCoinStoreOffers(unnamed).mostPurchased, null);
  });

  it("rejects a cached bonus pack that predates total coins", () => {
    assert.equal(
      cachedPackHasCatalogTotals({ bonus_coins: 400, coins: 200 } as never),
      false,
    );
    assert.equal(
      cachedPackHasCatalogTotals({ bonus_coins: 400, total_coins: 600 }),
      true,
    );
    assert.equal(cachedPackHasCatalogTotals({ bonus_coins: 0, coins: 15000 } as never), true);
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
