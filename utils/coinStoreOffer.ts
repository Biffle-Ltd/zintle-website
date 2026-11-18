import type { CoinStorePack } from "../components/CoinStoreMobile";

type BonusPack = Pick<
  CoinStorePack,
  | "coins"
  | "bonus_coins"
  | "bonus"
  | "base_coins"
  | "total_coins"
  | "bonus_percent"
> & { price?: number };

function positiveNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function apiNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

export type CatalogCoinPackRow = {
  id?: number;
  coin_value?: number | string;
  amount?: number | string;
  bonus_coins?: number | string;
  total_coins?: number | string;
  base_coins?: number | string;
  base_coin_value?: number | string;
  bonus_percent?: number | string;
  bonus_percentage?: number | string;
  percent_bonus?: number | string;
  product_id?: string;
  name?: string;
  icon_url?: string | null;
  is_micropack?: boolean;
  isMicropack?: boolean;
  isBonusPack?: boolean;
  isTrialPack?: boolean;
};

/** Catalog row → store pack. `coins` stays the paid `coin_value`; the card uses `total_coins`. */
export function mapCatalogCoinPack(p: CatalogCoinPackRow): CoinStorePack {
  const coinValue = apiNumber(p.coin_value) ?? 0;
  const totalCoins = apiNumber(p.total_coins);
  const bonusCoins = apiNumber(p.bonus_coins) ?? 0;
  const explicitBase = apiNumber(p.base_coins ?? p.base_coin_value);
  return {
    id: p.id as number,
    coins: coinValue,
    price: apiNumber(p.amount) ?? Number.NaN,
    bonus: bonusCoins,
    bonus_coins: bonusCoins,
    ...(explicitBase != null
      ? { base_coins: explicitBase }
      : totalCoins != null
        ? { base_coins: coinValue }
        : {}),
    ...(totalCoins != null ? { total_coins: totalCoins } : {}),
    bonus_percent: apiNumber(
      p.bonus_percent ?? p.bonus_percentage ?? p.percent_bonus,
    ),
    product_id: p.product_id,
    name: p.name,
    icon_url: p.icon_url ?? null,
    is_micropack: Boolean(p.is_micropack ?? p.isMicropack),
    color: "bg-brand-surface",
    // isBonusPack now means "this pack has bonus coins", which is every
    // normal pack. The percent badge already says that. A generated
    // "Bonus Pack" tag would land on all of them.
    tag: p.isTrialPack
      ? "Trial Pack"
      : (p.is_micropack ?? p.isMicropack)
        ? "Micropack"
        : undefined,
    highlight: p.isBonusPack || false,
  };
}

/** A missing price must not survive as a cached ₹0 pack. */
export function isPurchasableCatalogPack(pack: {
  id?: number;
  price?: number;
}): boolean {
  return (
    typeof pack.id === "number" &&
    Number.isFinite(pack.id) &&
    typeof pack.price === "number" &&
    Number.isFinite(pack.price) &&
    pack.price >= 0
  );
}

/**
 * Packs cached before `total_coins` existed show the base amount as the
 * headline. A bonus without a total is that stale shape.
 */
export function cachedPackHasCatalogTotals(pack: {
  bonus_coins?: number;
  total_coins?: number;
}): boolean {
  const bonus = Number(pack.bonus_coins ?? 0);
  if (!(bonus > 0)) return true;
  return typeof pack.total_coins === "number" && Number.isFinite(pack.total_coins);
}

export function coinBonusAmount(pack: Pick<CoinStorePack, "bonus_coins" | "bonus">): number {
  return positiveNumber(pack.bonus_coins ?? pack.bonus) ?? 0;
}

/**
 * Labels for the coin card.
 * Main number is `total_coins`. `bonus_coins` is the free-coin line.
 * `bonus_percentage` is the badge. Each one is omitted when the catalog
 * does not send a positive value. Without `total_coins`, the main number
 * stays `coin_value`.
 */
export function packCardFigures(pack: BonusPack): {
  coins: number;
  free: number;
  percent: number | null;
} {
  const total = positiveNumber(pack.total_coins);
  const catalogCoins = Number(pack.coins);
  const givenPercent = positiveNumber(pack.bonus_percent);
  return {
    coins:
      total ??
      (Number.isFinite(catalogCoins) && catalogCoins > 0 ? catalogCoins : 0),
    free: coinBonusAmount(pack),
    percent:
      givenPercent != null ? Math.round(givenPercent * 100) / 100 : null,
  };
}

function packPrice(pack: CoinStorePack): number {
  const price = Number(pack.price);
  return Number.isFinite(price) ? price : Number.POSITIVE_INFINITY;
}

/**
 * A backend "recommended" name outranks looser words like "best value".
 * Highlight is a fallback only when a single pack is flagged. The catalog
 * now flags every pack that has bonus coins, and that is not a recommendation.
 */
function featuredRank(pack: CoinStorePack, loneHighlight: boolean): number {
  const name = pack.name ?? "";
  if (/recommend/i.test(name)) return 3;
  if (/\b(?:most|best|popular)\b/i.test(name)) return 2;
  return loneHighlight && pack.highlight === true ? 1 : 0;
}

export function comparePackPrice(a: CoinStorePack, b: CoinStorePack): number {
  return packPrice(a) - packPrice(b) || a.id - b.id;
}

/** Starter, then Most Purchased, then one-time rows. `oneTimeLimit` hides the tail. */
export function orderedOfferPacks<T extends CoinStorePack>(
  packs: T[],
  oneTimeLimit?: number | null,
): T[] {
  const split = splitCoinStoreOffers(packs);
  const oneTime = [...split.oneTime].sort(comparePackPrice);
  const shown = oneTimeLimit == null ? oneTime : oneTime.slice(0, oneTimeLimit);
  return [
    ...(split.starter ? [split.starter] : []),
    ...(split.mostPurchased ? [split.mostPurchased] : []),
    ...shown,
  ];
}

/**
 * Named Starter, else the cheapest pack.
 * Most Purchased only when a pack is actually flagged. An ordinary pack stays
 * in the one-time list instead of borrowing the heading.
 */
export function splitCoinStoreOffers<T extends CoinStorePack>(
  packs: T[],
): { starter: T | null; mostPurchased: T | null; oneTime: T[] } {
  if (packs.length === 0) {
    return { starter: null, mostPurchased: null, oneTime: [] };
  }
  const namedStarter = packs.find((pack) => /^starter\b/i.test(pack.name ?? ""));
  const starter =
    namedStarter ??
    packs.reduce((best, pack) => (packPrice(pack) < packPrice(best) ? pack : best));
  const rest = packs.filter((pack) => pack.id !== starter.id);
  const loneHighlight =
    rest.filter((pack) => pack.highlight === true).length === 1;
  const featured = rest.reduce<T | null>((best, pack) => {
    const rank = featuredRank(pack, loneHighlight);
    if (rank === 0) return best;
    if (best == null || rank > featuredRank(best, loneHighlight)) return pack;
    return best;
  }, null);
  return {
    starter,
    mostPurchased: featured,
    oneTime: featured
      ? rest.filter((pack) => pack.id !== featured.id)
      : rest,
  };
}
