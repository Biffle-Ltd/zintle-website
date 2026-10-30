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

const {
  campaignSelectedLanguageKey,
  readCampaignSelectedLanguage,
  writeCampaignSelectedLanguage,
} = await import("./campaignSelectedLanguage.ts");
const { campaignFreePlanInfoSearch } = await import(
  "./campaignFreePlanQuery.ts"
);

const ORG = "BIFFLE1234";

describe("campaign selected language", () => {
  beforeEach(() => {
    memory.clear();
  });

  it("stores one code per organisation", () => {
    assert.equal(readCampaignSelectedLanguage(ORG), null);
    writeCampaignSelectedLanguage(ORG, " hi ");
    assert.equal(readCampaignSelectedLanguage(ORG), "hi");
    assert.equal(
      memory.getItem(campaignSelectedLanguageKey(ORG)),
      "hi",
    );
    writeCampaignSelectedLanguage("ZINTEL1234", "ta");
    assert.equal(readCampaignSelectedLanguage(ORG), "hi");
    assert.equal(readCampaignSelectedLanguage("ZINTEL1234"), "ta");
  });

  it("ignores a blank code", () => {
    writeCampaignSelectedLanguage(ORG, "   ");
    assert.equal(readCampaignSelectedLanguage(ORG), null);
  });

  it("does not throw when storage is unavailable", () => {
    const setItem = memory.setItem.bind(memory);
    const getItem = memory.getItem.bind(memory);
    memory.setItem = () => {
      throw new Error("quota");
    };
    memory.getItem = () => {
      throw new Error("denied");
    };
    try {
      writeCampaignSelectedLanguage(ORG, "ta");
      assert.equal(readCampaignSelectedLanguage(ORG), null);
    } finally {
      memory.setItem = setItem;
      memory.getItem = getItem;
    }
  });
});

describe("campaignFreePlanInfoSearch", () => {
  it("adds language only when a code is present", () => {
    assert.equal(campaignFreePlanInfoSearch(), "source=campaign");
    assert.equal(campaignFreePlanInfoSearch("  "), "source=campaign");
    assert.equal(
      campaignFreePlanInfoSearch(" ta "),
      "source=campaign&language=ta",
    );
  });
});
