import type { CoinStorePack, SubscriptionPlan } from "../components/CoinStoreMobile";

export type QuickRechargeSessionType = "call" | "chat";

export type QuickRechargeCallContext = {
  walletBalance: number;
  callPrice: number;
  sessionType: QuickRechargeSessionType;
};

type PackLike = {
  id: number;
  coins: number;
  price: number;
};

function parsePositiveNumberParam(
  params: URLSearchParams,
  key: string,
): number | null {
  const raw = params.get(key);
  if (raw == null || raw.trim() === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function parseSessionType(params: URLSearchParams): QuickRechargeSessionType {
  const raw = params.get("call_type")?.toLowerCase().trim();
  return raw === "chat" ? "chat" : "call";
}

export function parseQuickRechargeCallContext(
  search: string,
): QuickRechargeCallContext | null {
  const query = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(query);
  const walletBalance = parsePositiveNumberParam(params, "wallet_balance");
  const callPrice = parsePositiveNumberParam(params, "call_price");
  if (walletBalance == null || callPrice == null || callPrice <= 0) {
    return null;
  }
  return {
    walletBalance,
    callPrice,
    sessionType: parseSessionType(params),
  };
}

export function computeContinueCallMinutes(
  walletBalance: number,
  callPrice: number,
  packCoins: number,
): number {
  return Math.floor((walletBalance + packCoins) / callPrice);
}

export function resolveSelectedPackDetails(
  selectedPackageId: number | null,
  packs: PackLike[],
  featuredWeeklyPlan: SubscriptionPlan | null,
  basicWeeklyPlan: SubscriptionPlan | null,
  timerPack: CoinStorePack | null,
): { coins: number; price: number } | null {
  if (selectedPackageId == null) return null;
  if (featuredWeeklyPlan?.id === selectedPackageId) {
    return {
      coins: featuredWeeklyPlan.coin_value ?? 0,
      price: featuredWeeklyPlan.price,
    };
  }
  if (basicWeeklyPlan?.id === selectedPackageId) {
    return {
      coins: basicWeeklyPlan.coin_value ?? 0,
      price: basicWeeklyPlan.price,
    };
  }
  if (timerPack?.id === selectedPackageId) {
    return { coins: timerPack.coins, price: timerPack.price };
  }
  const match = packs.find((p) => p.id === selectedPackageId);
  if (!match) return null;
  return { coins: match.coins, price: match.price };
}
