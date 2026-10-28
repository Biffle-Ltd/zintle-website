import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  copyShareChatVerifyParams,
  fillMissingShareChatVerifyParams,
  shareChatVerifySearchHasParams,
} from "./shareChatPixel.ts";

const VERIFY_SEARCH =
  "?organisation_id=BIFFLE1234&campaignId=verify&creativeId=verify&adsUuid=verify&advertiserId=verify&verify=true";

describe("copyShareChatVerifyParams", () => {
  it("copies the test-link params and ignores everything else", () => {
    const source = new URLSearchParams(VERIFY_SEARCH.slice(1));
    const target = new URLSearchParams();
    copyShareChatVerifyParams(source, target);
    assert.equal(target.get("verify"), "true");
    assert.equal(target.get("campaignId"), "verify");
    assert.equal(target.get("creativeId"), "verify");
    assert.equal(target.get("adsUuid"), "verify");
    assert.equal(target.get("advertiserId"), "verify");
    assert.equal(target.get("organisation_id"), null);
  });

  it("keeps the first value, matching ShareChat's reader", () => {
    const source = new URLSearchParams(
      "campaignId=already&campaignId=verify&verify=true",
    );
    const target = new URLSearchParams();
    copyShareChatVerifyParams(source, target);
    assert.equal(target.get("campaignId"), "already");
    assert.equal(target.get("verify"), "true");
  });
});

describe("fillMissingShareChatVerifyParams", () => {
  it("puts back only the keys the payment URL lost", () => {
    const current = new URLSearchParams(
      "plan_id=4&organisation_id=BIFFLE1234&is_campaign=true",
    );
    const remembered = new URLSearchParams(VERIFY_SEARCH.slice(1));
    const changed = fillMissingShareChatVerifyParams(current, remembered);
    assert.equal(changed, true);
    assert.equal(current.get("plan_id"), "4");
    assert.equal(current.get("is_campaign"), "true");
    assert.equal(current.get("verify"), "true");
    assert.equal(current.get("adsUuid"), "verify");
  });

  it("does not overwrite params already on the page", () => {
    const current = new URLSearchParams("verify=true&campaignId=keep");
    const remembered = new URLSearchParams(
      "verify=other&campaignId=verify&creativeId=verify",
    );
    fillMissingShareChatVerifyParams(current, remembered);
    assert.equal(current.get("verify"), "true");
    assert.equal(current.get("campaignId"), "keep");
    assert.equal(current.get("creativeId"), "verify");
  });
});

describe("shareChatVerifySearchHasParams", () => {
  it("is false for the payment link that dropped the test params", () => {
    assert.equal(
      shareChatVerifySearchHasParams(
        "?plan_id=4&organisation_id=BIFFLE1234&is_campaign=true",
      ),
      false,
    );
  });

  it("is true when the test link is still intact", () => {
    assert.equal(shareChatVerifySearchHasParams(VERIFY_SEARCH), true);
  });
});
