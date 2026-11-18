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
};

export type WalletTransactionPage = {
  total: number;
  transactions: WalletTransaction[];
};

const TITLES: Record<string, string> = {
  gift: "Gift",
  regular: "Coins",
  tip: "Tip",
  refund: "Refund",
  withdrawal: "Withdrawal",
  coin_pack: "Recharge",
  call: "Call",
  audio_call: "Audio call",
  video_call: "Video call",
  chat: "Chat",
  voice_note: "Voice note",
  referral: "Referral",
  reward: "Reward",
  daily_reward: "Daily reward",
  bonus: "Bonus",
  expired_coins: "Expired coins",
  call_end_charge: "Call",
};

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

export function walletTransactionTitle(transaction: WalletTransaction): string {
  const description = transaction.description?.trim();
  if (description) return description;
  return TITLES[transaction.transactionFor] ?? "Coins";
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
