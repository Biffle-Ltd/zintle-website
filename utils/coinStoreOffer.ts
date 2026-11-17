import type { CoinStorePack } from "../components/CoinStoreMobile";

type BonusPack = Pick<
  CoinStorePack,
  "coins" | "bonus_coins" | "bonus" | "base_coins" | "bonus_percent"
> & { price?: number };

function positiveNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function coinBonusAmount(pack: Pick<CoinStorePack, "bonus_coins" | "bonus">): number {
  return positiveNumber(pack.bonus_coins ?? pack.bonus) ?? 0;
}

/**
 * Labels for the coin card. The coin count stays `coin_value`.
 * Bonus coins and the percent badge render only when the catalog sends them.
 */
export function packCardFigures(pack: BonusPack): {
  coins: number;
  free: number;
  percent: number | null;
} {
  const catalogCoins = Number(pack.coins);
  const givenPercent = positiveNumber(pack.bonus_percent);
  return {
    coins: Number.isFinite(catalogCoins) && catalogCoins > 0 ? catalogCoins : 0,
    free: coinBonusAmount(pack),
    percent: givenPercent != null ? Math.round(givenPercent) : null,
  };
}

function packPrice(pack: CoinStorePack): number {
  const price = Number(pack.price);
  return Number.isFinite(price) ? price : Number.POSITIVE_INFINITY;
}

function packLabel(pack: CoinStorePack): string {
  return `${pack.name ?? ""} ${pack.tag ?? ""}`;
}

/**
 * A backend "recommended" name outranks looser words like "best value".
 * A highlight flag is only a fallback, and the generated "Micropack" tag is not.
 */
function featuredRank(pack: CoinStorePack): number {
  const label = packLabel(pack);
  if (/recommend/i.test(label)) return 3;
  if (/\b(?:most|best|popular)\b/i.test(label)) return 2;
  return pack.highlight === true ? 1 : 0;
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
  const featured = rest.reduce<T | null>((best, pack) => {
    const rank = featuredRank(pack);
    if (rank === 0) return best;
    if (best == null || rank > featuredRank(best)) return pack;
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
