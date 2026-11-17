import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { retainLockUntilCheckoutSettles } from "./paymentCheckoutIframeLoad.ts";

describe("retainLockUntilCheckoutSettles", () => {
  it("releases the purchase lock once when checkout closes", () => {
    let releases = 0;
    const handoff = retainLockUntilCheckoutSettles("phonepe", () => {
      releases += 1;
    });
    handoff.onClosed();
    handoff.onClosed();
    handoff.armGiveUp();
    assert.equal(releases, 1);
  });
});
