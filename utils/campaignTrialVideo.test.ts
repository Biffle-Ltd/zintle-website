import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { withPublicTrialVideo } from "./campaignTrialVideo.ts";

const TAMIL = "https://cdn.example/tamil.mpd";
const DEFAULT = "https://cdn.example/default.mpd";

describe("withPublicTrialVideo", () => {
  it("replaces both video fields from the public plan and keeps the signed-in sku", () => {
    const merged = withPublicTrialVideo(
      {
        id: 11,
        subscription_id: "coin_weekly_99",
        extra_info: { video_url: TAMIL, mpd_video_url: TAMIL, thumbnail_url: "t" },
      },
      {
        extra_info: { video_url: DEFAULT, mpd_video_url: DEFAULT },
      },
    );
    assert.equal(merged.id, 11);
    assert.equal(merged.subscription_id, "coin_weekly_99");
    assert.equal(merged.extra_info?.video_url, DEFAULT);
    assert.equal(merged.extra_info?.mpd_video_url, DEFAULT);
    assert.equal(merged.extra_info?.thumbnail_url, "t");
  });

  it("leaves the signed-in plan alone when the public video is missing", () => {
    const signedIn = {
      id: 4,
      extra_info: { video_url: TAMIL, mpd_video_url: TAMIL },
    };
    assert.equal(withPublicTrialVideo(signedIn, {}), signedIn);
    assert.equal(
      withPublicTrialVideo(signedIn, { extra_info: { video_url: "  " } }),
      signedIn,
    );
  });
});
