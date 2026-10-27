import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { campaignPlayStoreUrl } from "./campaignPlayStore.ts";

describe("campaignPlayStoreUrl", () => {
  it("puts the aclid in the Play Store referrer for Biffle", () => {
    const url = new URL(campaignPlayStoreUrl("BIFFLE1234", "testclick1"));
    assert.equal(url.searchParams.get("id"), "ai.biffle");
    assert.equal(url.searchParams.get("referrer"), "testclick1");
  });

  it("uses the Zintle listing and drops an unresolved macro", () => {
    const url = new URL(campaignPlayStoreUrl("ZINTEL1234", "{ACLID}"));
    assert.equal(url.searchParams.get("id"), "ai.zintle");
    assert.equal(url.searchParams.get("referrer"), null);
  });
});
