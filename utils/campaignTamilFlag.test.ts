import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CAMPAIGN_TAMIL_LANGUAGE_CODE,
  isCampaignTamilLanguageFlag,
} from "./campaignTamilFlag.ts";

describe("isCampaignTamilLanguageFlag", () => {
  it("is set only for the Tamil campaign flag", () => {
    assert.equal(CAMPAIGN_TAMIL_LANGUAGE_CODE, "ta");
    assert.equal(isCampaignTamilLanguageFlag(""), false);
    assert.equal(
      isCampaignTamilLanguageFlag("?organisation_id=BIFFLE1234"),
      false,
    );
    assert.equal(isCampaignTamilLanguageFlag("?tamil=0"), false);
    assert.equal(isCampaignTamilLanguageFlag("?tamil=1"), true);
    assert.equal(isCampaignTamilLanguageFlag("?tamil=true"), true);
    assert.equal(isCampaignTamilLanguageFlag("?tamil=yes"), true);
    assert.equal(
      isCampaignTamilLanguageFlag(
        "/campaign?organisation_id=BIFFLE1234&tamil=1&fbclid=abc",
      ),
      true,
    );
    assert.equal(
      isCampaignTamilLanguageFlag("/subscriptions?plan_id=9&tamil=true"),
      true,
    );
  });
});
