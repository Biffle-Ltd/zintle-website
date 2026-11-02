import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { campaignFreePlanInfoSearch } from "./campaignFreePlanQuery.ts";

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
