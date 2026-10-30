import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CAMPAIGN_HINDI_LANGUAGE_CODE,
  CAMPAIGN_TAMIL_LANGUAGE_CODE,
  campaignDirectLanguageCode,
  isCampaignAllLanguagesFlag,
  isCampaignLanguagePickerFlow,
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

describe("campaign language URL", () => {
  it("plays Hindi unless the URL asks for Tamil or every language", () => {
    assert.equal(CAMPAIGN_HINDI_LANGUAGE_CODE, "hi");
    assert.equal(
      campaignDirectLanguageCode("?organisation_id=BIFFLE1234"),
      "hi",
    );
    assert.equal(campaignDirectLanguageCode(""), "hi");
    assert.equal(
      campaignDirectLanguageCode(
        "/campaign?organisation_id=CAMPAIGN_B&tamil=1",
      ),
      "ta",
    );
    assert.equal(
      campaignDirectLanguageCode("?organisation_id=BIFFLE1234&all=1"),
      null,
    );
    assert.equal(
      campaignDirectLanguageCode("?all=1&tamil=1"),
      "ta",
    );
  });

  it("opens language selection only for the all flag", () => {
    assert.equal(isCampaignAllLanguagesFlag("?all=1"), true);
    assert.equal(isCampaignAllLanguagesFlag("?all=true"), true);
    assert.equal(isCampaignAllLanguagesFlag("?all=yes"), true);
    assert.equal(isCampaignAllLanguagesFlag("?all=0"), false);
    assert.equal(isCampaignAllLanguagesFlag("?organisation_id=BIFFLE1234"), false);
    assert.equal(
      isCampaignLanguagePickerFlow("?organisation_id=BIFFLE1234&all=1"),
      true,
    );
    assert.equal(isCampaignLanguagePickerFlow("?tamil=1"), false);
    assert.equal(isCampaignLanguagePickerFlow("?all=1&tamil=1"), false);
    assert.equal(
      isCampaignLanguagePickerFlow("/campaign?organisation_id=BIFFLE1234"),
      false,
    );
  });
});
