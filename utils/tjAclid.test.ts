import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeCampaignAclid,
  readCampaignAclidFromParams,
  readCampaignAclidFromSearch,
} from "./tjAclid.ts";

describe("normalizeCampaignAclid", () => {
  it("drops blank values, non-strings, and the unsubstituted macro", () => {
    assert.equal(normalizeCampaignAclid(null), "");
    assert.equal(normalizeCampaignAclid(undefined), "");
    assert.equal(normalizeCampaignAclid(12), "");
    assert.equal(normalizeCampaignAclid("  "), "");
    assert.equal(normalizeCampaignAclid("{ACLID}"), "");
    assert.equal(normalizeCampaignAclid("  {ACLID}  "), "");
  });

  it("keeps a real click id", () => {
    assert.equal(normalizeCampaignAclid("  click-1  "), "click-1");
  });
});

describe("readCampaignAclidFromParams", () => {
  it("skips a leading unsubstituted macro and keeps the real click", () => {
    const params = new URLSearchParams();
    params.append("aclid", "{ACLID}");
    params.append("aclid", "click-from-ad");
    assert.equal(readCampaignAclidFromParams(params), "click-from-ad");
  });

  it("reads aclid from a search string", () => {
    assert.equal(
      readCampaignAclidFromSearch("?organisation_id=BIFFLE1234&aclid=click-1"),
      "click-1",
    );
    assert.equal(readCampaignAclidFromSearch("?aclid={ACLID}"), "");
  });
});
