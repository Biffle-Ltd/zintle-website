import type { CoinStorePack, SubscriptionPlan } from "../components/CoinStoreMobile";
import { TIMER_COIN_FALLBACK_PRODUCT_ID } from "../components/CoinStoreMobile";

export type QuickRechargeCallType = "call" | "chat" | "audio" | "video";

/** UI-facing session word after mapping audio/video → call. */
export type QuickRechargeSessionType = "call" | "chat";

export type QuickRechargeCallContext = {
  walletBalance: number;
  callPrice: number;
  /** Raw `call_type` from URL — use for logic (`audio` / `video` preserved). */
  callType: QuickRechargeCallType;
};

type PackLike = {
  id: number;
  coins: number;
  price: number;
  name?: string;
  product_id?: string;
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

function parseCallType(
  params: URLSearchParams,
  defaultCallType: QuickRechargeCallType,
): QuickRechargeCallType {
  const raw = params.get("call_type")?.toLowerCase().trim();
  if (raw === "chat" || raw === "call" || raw === "audio" || raw === "video") {
    return raw;
  }
  return defaultCallType;
}

/**
 * UI copy only — never surface "audio" / "video".
 * chat → "chat"; call | audio | video → "call".
 */
export function quickRechargeSessionDisplayLabel(
  callType: QuickRechargeCallType | QuickRechargeSessionType,
): "call" | "chat" {
  return callType === "chat" ? "chat" : "call";
}

export function parseQuickRechargeCallContext(
  search: string,
  options?: { defaultSessionType?: QuickRechargeSessionType },
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
    callType: parseCallType(
      params,
      options?.defaultSessionType ?? "call",
    ),
  };
}

export function computeContinueCallMinutes(
  walletBalance: number,
  callPrice: number,
  packCoins: number,
): number {
  return Math.floor((walletBalance + packCoins) / callPrice);
}

/** Coins still needed so wallet + purchase covers 1 minute at `callPrice`. */
export function coinsNeededForOneMinute(
  walletBalance: number,
  callPrice: number,
): number {
  if (!(callPrice > 0)) return 0;
  return Math.max(0, callPrice - Math.max(0, walletBalance));
}

export type RecommendablePack = {
  id: number;
  coins: number;
  price: number;
  name?: string;
  isWeekly: boolean;
};

/**
 * Cheapest pack whose coins cover 1 minute at the given call price (after wallet).
 * On equal price, weekly packs win over one-time packs.
 */
export function recommendLowestPackForOneMinute(
  callContext: QuickRechargeCallContext,
  candidates: RecommendablePack[],
): RecommendablePack | null {
  if (candidates.length === 0) return null;

  const needed = coinsNeededForOneMinute(
    callContext.walletBalance,
    callContext.callPrice,
  );
  const sufficient = candidates.filter(
    (p) => Number.isFinite(p.coins) && p.coins >= needed,
  );
  if (sufficient.length === 0) return null;

  return [...sufficient].sort((a, b) => {
    if (a.price !== b.price) return a.price - b.price;
    if (a.isWeekly !== b.isWeekly) return a.isWeekly ? -1 : 1;
    return a.id - b.id;
  })[0];
}

/** Default one-time pack for in-call QR (₹149 / coin_149); no weekly preference. */
export function resolveInCallDefaultPack(
  packs: PackLike[],
): PackLike | null {
  const byProductId = packs.find(
    (p) => p.product_id === TIMER_COIN_FALLBACK_PRODUCT_ID,
  );
  if (byProductId) return byProductId;
  const byPrice = packs.find((p) => p.price === 149);
  if (byPrice) return byPrice;
  return packs[0] ?? null;
}

export function buildRecommendablePacks(options: {
  packs: PackLike[];
  featuredWeeklyPlan: SubscriptionPlan | null;
  basicWeeklyPlan: SubscriptionPlan | null;
  timerPack: CoinStorePack | null;
  isMember: boolean;
}): RecommendablePack[] {
  const {
    packs,
    featuredWeeklyPlan,
    basicWeeklyPlan,
    timerPack,
    isMember,
  } = options;
  const out: RecommendablePack[] = [];
  const seen = new Set<number>();

  const push = (pack: RecommendablePack) => {
    if (seen.has(pack.id)) return;
    if (!(pack.price >= 0) || !(pack.coins >= 0)) return;
    seen.add(pack.id);
    out.push(pack);
  };

  if (!isMember) {
    if (featuredWeeklyPlan) {
      push({
        id: featuredWeeklyPlan.id,
        coins: featuredWeeklyPlan.coin_value ?? 0,
        price: featuredWeeklyPlan.price,
        name: featuredWeeklyPlan.plan_name,
        isWeekly: true,
      });
    }
    if (basicWeeklyPlan) {
      push({
        id: basicWeeklyPlan.id,
        coins: basicWeeklyPlan.coin_value ?? 0,
        price: basicWeeklyPlan.price,
        name: basicWeeklyPlan.plan_name,
        isWeekly: true,
      });
    }
  } else if (timerPack) {
    push({
      id: timerPack.id,
      coins: timerPack.coins,
      price: timerPack.price,
      name: timerPack.name,
      isWeekly: false,
    });
  }

  for (const pack of packs) {
    if (timerPack && pack.id === timerPack.id) continue;
    if (
      !isMember &&
      basicWeeklyPlan &&
      pack.price === basicWeeklyPlan.price
    ) {
      // Mirror popup filtering: hide duplicate-priced micropack vs basic weekly.
      continue;
    }
    push({
      id: pack.id,
      coins: pack.coins,
      price: pack.price,
      name: pack.name,
      isWeekly: false,
    });
  }

  return out;
}

/** Header copy for Quick Recharge, driven by URL `surface`.
 * `headerPack` is the initial pack used for copy and must stay fixed when the user taps another pack.
 */
export function buildQuickRechargePopupHeader(options: {
  surface: string | null | undefined;
  headerPack: { coins: number; price: number } | null;
  callContext: QuickRechargeCallContext | null;
  formatPrice: (amount: number) => string;
  fallback: string;
}): string {
  const { surface, headerPack, callContext, formatPrice, fallback } = options;
  if (!headerPack) return fallback;

  const isChatSurface =
    surface === "initiate_chat_coin_popup" || surface === "in_chat_coin_popup";
  const sessionLabel = callContext
    ? quickRechargeSessionDisplayLabel(callContext.callType)
    : isChatSurface
      ? "chat"
      : "call";

  // initiate_* / top_creators — pre-session start
  if (
    surface === "initiate_call_coin_popup" ||
    surface === "initiate_chat_coin_popup" ||
    surface === "top_creators_coin_popup"
  ) {
    return `${formatPrice(headerPack.price)} to start your ${sessionLabel}`;
  }

  // in_call / in_chat — ongoing session continue
  if (surface === "in_call_coin_popup" || surface === "in_chat_coin_popup") {
    if (!callContext) return fallback;
    const mins = computeContinueCallMinutes(
      callContext.walletBalance,
      callContext.callPrice,
      headerPack.coins,
    );
    const unit = mins === 1 ? "minute" : "minutes";
    return `${formatPrice(headerPack.price)} to continue your ${sessionLabel} for ${mins} ${unit}`;
  }

  if (callContext) {
    const mins = computeContinueCallMinutes(
      callContext.walletBalance,
      callContext.callPrice,
      headerPack.coins,
    );
    const minLabel = mins === 1 ? "min" : "mins";
    const coinsLabel = Number.isInteger(headerPack.coins)
      ? String(headerPack.coins)
      : String(Math.round(headerPack.coins));
    return `Recharge for ${coinsLabel} coins to continue ${sessionLabel} for ${mins} ${minLabel} at just ${formatPrice(headerPack.price)}`;
  }

  return fallback;
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
