import { headerSafeToken } from "./headerSafeToken.ts";

/** One row from get-wallet-transaction-history, with bonus coins folded in. */
export type WalletTransaction = {
  id: number;
  value: number;
  transactionType: string;
  transactionFor: string;
  description: string | null;
  createdAt: string;
  bonusValue: number;
  counterpartyName: string | null;
};

export type CoinHistoryFilter = "chat" | "recharge" | "gift";

export type HistoryMonthGroup = {
  label: string;
  transactions: WalletTransaction[];
};

export type WalletTransactionPage = {
  total: number;
  transactions: WalletTransaction[];
};

const CHAT_TYPES = new Set([
  "chat",
  "call",
  "audio_call",
  "video_call",
  "voice_note",
  "call_end_charge",
]);
const RECHARGE_TYPES = new Set([
  "coin_pack",
  "bonus",
  "refund",
  "reward",
  "daily_reward",
  "referral",
  "regular",
]);
const GIFT_TYPES = new Set(["gift", "tip"]);
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function personName(value: unknown): string | null {
  const user = asRecord(value);
  if (!user) return null;
  const first = typeof user.first_name === "string" ? user.first_name.trim() : "";
  const last = typeof user.last_name === "string" ? user.last_name.trim() : "";
  const name = [first, last].filter(Boolean).join(" ");
  return name || null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function bonusTotal(value: unknown): number {
  if (!Array.isArray(value)) return 0;
  return value.reduce((sum, row) => {
    const record = asRecord(row);
    const amount = record ? asNumber(record.value) : null;
    return amount == null ? sum : sum + amount;
  }, 0);
}

function parseRow(value: unknown): WalletTransaction | null {
  const row = asRecord(value);
  if (!row) return null;
  const id = asNumber(row.id);
  const amount = asNumber(row.value);
  if (id == null || amount == null) return null;
  const description = typeof row.description === "string" ? row.description : null;
  return {
    id,
    value: amount,
    transactionType: typeof row.transaction_type === "string" ? row.transaction_type : "",
    transactionFor: typeof row.transaction_for === "string" ? row.transaction_for : "",
    description,
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    bonusValue: bonusTotal(row.bonus_transactions),
    counterpartyName: personName(row.given_to_user),
  };
}

/** Reads the success envelope from get-wallet-transaction-history. */
export function parseWalletTransactionHistory(
  payload: unknown,
): WalletTransactionPage | null {
  const body = asRecord(payload);
  const data = body ? asRecord(body.data) : null;
  if (!body || body.success !== true || !data || !Array.isArray(data.transactions)) {
    return null;
  }
  const total = asNumber(data.total_transactions);
  return {
    total: total == null ? data.transactions.length : total,
    transactions: data.transactions
      .map(parseRow)
      .filter((row): row is WalletTransaction => row != null),
  };
}

function boilerplateDescription(description: string): boolean {
  return (
    description.length > 80 ||
    /^(coins spent for call|coins purchased by|coins expired)/i.test(description)
  );
}

/** Chat, recharge, and gift are the history tabs. Other ledger rows stay out. */
export function coinHistoryFilter(
  transaction: WalletTransaction,
): CoinHistoryFilter | null {
  if (CHAT_TYPES.has(transaction.transactionFor)) return "chat";
  if (GIFT_TYPES.has(transaction.transactionFor)) return "gift";
  if (RECHARGE_TYPES.has(transaction.transactionFor)) return "recharge";
  return null;
}

export function walletTransactionTitle(transaction: WalletTransaction): string {
  const description = transaction.description?.trim() ?? "";
  const name = transaction.counterpartyName;
  if (GIFT_TYPES.has(transaction.transactionFor)) {
    const sentTo = description.match(/^Gift for (.+?) from .+$/i);
    const who = name || sentTo?.[1]?.trim();
    return who ? `Gift sent to ${who}` : "Gift";
  }
  if (description && !boilerplateDescription(description)) return description;
  if (CHAT_TYPES.has(transaction.transactionFor)) {
    if (name) return `Chat to ${name}`;
    return transaction.transactionFor === "chat" ? "Chat" : "Call";
  }
  if (
    transaction.transactionFor === "coin_pack" ||
    transaction.transactionFor === "bonus"
  ) {
    return "Recharge";
  }
  return "Coins";
}

export function historyAmountLabel(transaction: WalletTransaction): string {
  if (coinHistoryFilter(transaction) === "gift") return "Gift";
  if (coinHistoryFilter(transaction) === "recharge") return "Recharge";
  return transaction.transactionType === "credit" ? "Credit" : "Debit";
}

export function parseHistoryDate(createdAt: string): Date | null {
  const match = createdAt.trim().match(/^(\d{1,2}) ([A-Za-z]+), (\d{4})$/);
  if (!match) return null;
  const month = MONTHS.findIndex(
    (name) => name.toLowerCase() === match[2].toLowerCase(),
  );
  const day = Number(match[1]);
  const year = Number(match[3]);
  if (month < 0 || day < 1 || day > 31) return null;
  return new Date(year, month, day);
}

export function historyDateLabel(createdAt: string): string {
  const date = parseHistoryDate(createdAt);
  if (!date) return createdAt;
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function groupHistoryByMonth(
  transactions: WalletTransaction[],
): HistoryMonthGroup[] {
  const groups: HistoryMonthGroup[] = [];
  for (const transaction of transactions) {
    const date = parseHistoryDate(transaction.createdAt);
    const label = date
      ? `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
      : "Earlier";
    const current = groups[groups.length - 1];
    if (current && current.label === label) {
      current.transactions.push(transaction);
    } else {
      groups.push({ label, transactions: [transaction] });
    }
  }
  return groups;
}

export function formatWalletCoins(value: number): string {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export async function fetchWalletTransactionPage(
  host: string,
  opts: {
    organisationId: string;
    token: string;
    pageNo: number;
    perPage?: number;
    signal?: AbortSignal;
  },
): Promise<WalletTransactionPage | null> {
  const token = headerSafeToken(opts.token);
  if (!token) return null;
  const url = new URL(
    `${host}/api/v1/user_center/details/get-wallet-transaction-history/`,
  );
  url.searchParams.set("page_no", String(opts.pageNo));
  url.searchParams.set("per_page", String(opts.perPage ?? 30));
  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Organisation-ID": opts.organisationId,
    },
    signal: opts.signal,
  });
  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) return null;
  return parseWalletTransactionHistory(payload);
}
