import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  copyShareChatVerifyParams,
  fillMissingShareChatVerifyParams,
  readShareChatClick,
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

describe("readShareChatClick", () => {
  it("reads a ShareChat click and ignores a normal campaign link", () => {
    const click = readShareChatClick(VERIFY_SEARCH);
    assert.equal(click?.campaignId, "verify");
    assert.equal(click?.creativeId, "verify");
    assert.equal(click?.adsUuid, "verify");
    assert.equal(click?.advertiserId, "verify");
    assert.equal(click?.verify, true);
    assert.equal(
      readShareChatClick("?plan_id=4&organisation_id=BIFFLE1234&fbclid=meta"),
      null,
    );
  });

  it("keeps the first campaign id when the click is complete", () => {
    const click = readShareChatClick(
      "?campaignId=live-1&campaignId=verify&creativeId=cr&adsUuid=ad&advertiserId=adv",
    );
    assert.equal(click?.campaignId, "live-1");
    assert.equal(click?.verify, false);
  });

  it("does not treat a partial click id as ShareChat", () => {
    assert.equal(readShareChatClick("?campaignId=live-1"), null);
  });

  it("recovers a click the payment URL dropped when this tab still has it", () => {
    const storage = new Map<string, string>();
    const previous = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
      },
    });
    storage.set(
      "zintle_sharechat_verify_query",
      "campaignId=live-9&creativeId=cr&adsUuid=ad&advertiserId=adv",
    );
    try {
      const click = readShareChatClick("?plan_id=4&is_campaign=true");
      assert.equal(click?.campaignId, "live-9");
      assert.equal(click?.creativeId, "cr");
      assert.equal(click?.verify, false);
    } finally {
      if (previous) Object.defineProperty(globalThis, "sessionStorage", previous);
      else delete (globalThis as { sessionStorage?: unknown }).sessionStorage;
    }
  });

  it("does not mix an older click into a partial URL or another brand", () => {
    const storage = new Map<string, string>();
    const previous = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
      },
    });
    storage.set(
      "zintle_sharechat_verify_query",
      "organisation_id=BIFFLE1234&campaignId=live-9&creativeId=cr&adsUuid=ad&advertiserId=adv",
    );
    try {
      assert.equal(
        readShareChatClick("?campaignId=other", "BIFFLE1234"),
        null,
      );
      assert.equal(
        readShareChatClick("?plan_id=4&organisation_id=ZINTEL1234", "ZINTEL1234"),
        null,
      );
      assert.equal(
        readShareChatClick("?plan_id=4&organisation_id=BIFFLE1234", "BIFFLE1234")
          ?.campaignId,
        "live-9",
      );
    } finally {
      if (previous) Object.defineProperty(globalThis, "sessionStorage", previous);
      else delete (globalThis as { sessionStorage?: unknown }).sessionStorage;
    }
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
