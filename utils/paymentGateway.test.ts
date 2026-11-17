import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coinCheckoutOpeningLabel } from "./paymentGateway.ts";

describe("coinCheckoutOpeningLabel", () => {
  it("names PhonePe when that gateway will open", () => {
    assert.equal(coinCheckoutOpeningLabel("PhonePe"), "Opening PhonePe…");
  });

  it("does not claim PhonePe for another gateway", () => {
    assert.equal(coinCheckoutOpeningLabel("Easebuzz"), "Opening payment…");
  });

  it("defaults to PhonePe when the page does not name a gateway", () => {
    assert.equal(coinCheckoutOpeningLabel(), "Opening PhonePe…");
  });

  it("follows payment_gateway on the current page", () => {
    const prior = (globalThis as { window?: unknown }).window;
    (globalThis as { window?: unknown }).window = {
      location: { search: "?payment_gateway=easebuzz" },
    };
    try {
      assert.equal(coinCheckoutOpeningLabel(), "Opening payment…");
    } finally {
      if (prior === undefined) {
        delete (globalThis as { window?: unknown }).window;
      } else {
        (globalThis as { window?: unknown }).window = prior;
      }
    }
  });
});
