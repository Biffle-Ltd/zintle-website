import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";

class MemoryStorage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
}

const memory = new MemoryStorage();
Object.defineProperty(globalThis, "localStorage", {
  value: memory,
  configurable: true,
});

const cache = await import("./webviewApiCache.ts");
const packsApi = await import("./coinPacksApi.ts");
const { parseIsMemberQueryParam, seedCoinStoreMembership } = await import(
  "./coinStoreBootstrap.ts"
);

const TOKEN = "header.payload.signature";
const ORG = "BIFFLE1234";

const weeklyPlan = {
  id: 8,
  plan_name: "Weekly",
  price: 100,
  plan_duration: 7,
  coin_value: 100,
};

function writeUserDetails(isMember: boolean) {
  cache.writeApiCache(cache.apiCacheStorageKey("userDetails", ORG, TOKEN), {
    is_member: isMember,
  });
}

function writePlans(value: unknown) {
  cache.writeApiCache(
    cache.apiCacheStorageKey("subPacks", ORG, TOKEN),
    value,
  );
}

describe("parseIsMemberQueryParam", () => {
  it("accepts true/false/1/0 and ignores junk", () => {
    assert.equal(parseIsMemberQueryParam("true"), true);
    assert.equal(parseIsMemberQueryParam("1"), true);
    assert.equal(parseIsMemberQueryParam("false"), false);
    assert.equal(parseIsMemberQueryParam("0"), false);
    assert.equal(parseIsMemberQueryParam("yes"), null);
    assert.equal(parseIsMemberQueryParam(""), null);
    assert.equal(parseIsMemberQueryParam(null), null);
  });
});

describe("seedCoinStoreMembership", () => {
  beforeEach(() => {
    memory.clear();
  });

  it("treats missing token as member even if is_member=false", () => {
    const seed = seedCoinStoreMembership(null, ORG, "?is_member=false");
    assert.equal(seed.isMember, true);
    assert.equal(seed.loading, false);
    assert.deepEqual(seed.subscriptionPlanIds, []);
  });

  it("uses native is_member=false with cached plans", () => {
    writePlans({
      featuredWeeklyPlan: weeklyPlan,
      basicWeeklyPlan: {
        id: 5,
        plan_name: "Basic",
        price: 29,
        plan_duration: 7,
        coin_value: 29,
      },
      subscriptionPlanIds: [8, 5],
    });
    const seed = seedCoinStoreMembership(TOKEN, ORG, "?is_member=false");
    assert.equal(seed.isMember, false);
    assert.equal(seed.loading, false);
    assert.equal(seed.featuredWeeklyPlan?.id, 8);
    assert.deepEqual(seed.subscriptionPlanIds, [8, 5]);
  });

  it("does not mandate from a cached non-member without native is_member", () => {
    writeUserDetails(false);
    writePlans({
      featuredWeeklyPlan: weeklyPlan,
      basicWeeklyPlan: null,
      subscriptionPlanIds: [8],
    });
    const seed = seedCoinStoreMembership(TOKEN, ORG, "");
    assert.equal(seed.isMember, true);
    assert.equal(seed.loading, true);
    assert.deepEqual(seed.subscriptionPlanIds, []);
  });

  it("skips skeleton for a cached member without native is_member", () => {
    writeUserDetails(true);
    const seed = seedCoinStoreMembership(TOKEN, ORG, "");
    assert.equal(seed.isMember, true);
    assert.equal(seed.loading, false);
  });

  it("treats poisoned plan ids as a cache miss", () => {
    writePlans({
      featuredWeeklyPlan: weeklyPlan,
      basicWeeklyPlan: null,
      subscriptionPlanIds: { length: 1 },
    });
    const seed = seedCoinStoreMembership(TOKEN, ORG, "?is_member=false");
    assert.equal(seed.isMember, false);
    assert.equal(seed.loading, true);
    assert.deepEqual(seed.subscriptionPlanIds, []);
  });

  it("treats a featured plan with a string id as a cache miss", () => {
    writePlans({
      featuredWeeklyPlan: { id: "8", price: "100" },
      basicWeeklyPlan: null,
      subscriptionPlanIds: [8],
    });
    const seed = seedCoinStoreMembership(TOKEN, ORG, "?is_member=false");
    assert.equal(seed.loading, true);
    assert.equal(seed.featuredWeeklyPlan, null);
  });
});

describe("cached coin packs", () => {
  beforeEach(() => {
    memory.clear();
  });

  it("rejects pack rows missing numeric id/price/coins", () => {
    cache.writeApiCache(cache.apiCacheStorageKey("packs", ORG, TOKEN), [
      { id: "1", coins: 10, price: 20 },
    ]);
    assert.equal(packsApi.readCachedCoinPacks(ORG, TOKEN), null);
  });

  it("treats an empty pack list as a cache hit", () => {
    cache.writeApiCache(cache.apiCacheStorageKey("packs", ORG, TOKEN), []);
    assert.deepEqual(packsApi.readCachedCoinPacks(ORG, TOKEN), []);
  });
});
