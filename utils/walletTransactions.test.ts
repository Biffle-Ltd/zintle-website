import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  coinHistoryFilter,
  formatWalletCoins,
  groupHistoryByMonth,
  historyDateLabel,
  parseWalletTransactionHistory,
  walletTransactionTitle,
} from "./walletTransactions.ts";

describe("parseWalletTransactionHistory", () => {
  it("folds bonus coins into the recharge row", () => {
    const page = parseWalletTransactionHistory({
      success: true,
      data: {
        total_transactions: 2,
        transactions: [
          {
            id: 9,
            value: 200,
            transaction_type: "credit",
            transaction_for: "coin_pack",
            description: null,
            created_at: "18 November, 2026",
            bonus_transactions: [{ id: 10, value: 160, transaction_for: "bonus" }],
          },
        ],
      },
    });
    assert.ok(page);
    assert.equal(page.total, 2);
    assert.equal(page.transactions.length, 1);
    assert.equal(page.transactions[0].bonusValue, 160);
    assert.equal(walletTransactionTitle(page.transactions[0]), "Recharge");
  });

  it("keeps a debit and prefers the backend description", () => {
    const page = parseWalletTransactionHistory({
      success: true,
      data: {
        total_transactions: 1,
        transactions: [
          {
            id: "4",
            value: "20",
            transaction_type: "debit",
            transaction_for: "video_call",
            description: " Call with Aria ",
            created_at: "18 November, 2026",
          },
        ],
      },
    });
    assert.ok(page);
    assert.equal(page.transactions[0].value, 20);
    assert.equal(walletTransactionTitle(page.transactions[0]), "Call with Aria");
  });

  it("drops a row with no id and rejects a failed envelope", () => {
    const page = parseWalletTransactionHistory({
      success: true,
      data: {
        total_transactions: 1,
        transactions: [{ value: 10 }, { id: 1, value: 5, transaction_for: "gift" }],
      },
    });
    assert.ok(page);
    assert.equal(page.transactions.length, 1);
    assert.equal(walletTransactionTitle(page.transactions[0]), "Gift");
    assert.equal(
      walletTransactionTitle({
        ...page.transactions[0],
        description: "Gift for Jia AI from Sam",
      }),
      "Gift sent to Jia AI",
    );
    assert.equal(coinHistoryFilter(page.transactions[0]), "gift");
    assert.equal(parseWalletTransactionHistory({ success: false, data: {} }), null);
    assert.equal(formatWalletCoins(10), "10");
    assert.equal(formatWalletCoins(10.5), "10.5");
  });

  it("names a chat from the other person and hides expiry rows", () => {
    const page = parseWalletTransactionHistory({
      success: true,
      data: {
        total_transactions: 3,
        transactions: [
          {
            id: 1,
            value: 10,
            transaction_type: "debit",
            transaction_for: "chat",
            description: "Coins spent for call",
            created_at: "10 May, 2025",
            given_to_user: { first_name: "Jia", last_name: "AI" },
          },
          {
            id: 2,
            value: 50,
            transaction_type: "credit",
            transaction_for: "coin_pack",
            description: "Coins purchased by Shashwat",
            created_at: "10 May, 2025",
          },
          {
            id: 3,
            value: 200,
            transaction_type: "debit",
            transaction_for: "expired_coins",
            description: "Coins expired from subscription 420368 (subscription expiration policy).",
            created_at: "02 April, 2025",
          },
        ],
      },
    });
    assert.ok(page);
    assert.equal(walletTransactionTitle(page.transactions[0]), "Chat to Jia AI");
    assert.equal(coinHistoryFilter(page.transactions[0]), "chat");
    assert.equal(walletTransactionTitle(page.transactions[1]), "Recharge");
    assert.equal(coinHistoryFilter(page.transactions[1]), "recharge");
    assert.equal(coinHistoryFilter(page.transactions[2]), null);
    assert.equal(historyDateLabel("10 May, 2025"), "May 10, 2025");
    const groups = groupHistoryByMonth(
      page.transactions.filter((row) => coinHistoryFilter(row) != null),
    );
    assert.deepEqual(groups.map((group) => group.label), ["May 2025"]);
  });
});
