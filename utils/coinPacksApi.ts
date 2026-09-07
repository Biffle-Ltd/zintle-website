import type { CoinStorePack } from "../components/CoinStoreMobile";
import { HOST } from "./host";
import { resolvePageAuthToken } from "./authStorage";

export type CoinPackApiRow = {
  id?: number;
  coin_value?: number;
  amount?: number;
  bonus_coins?: number;
  product_id?: string;
  name?: string;
  icon_url?: string | null;
  is_micropack?: boolean;
  isMicropack?: boolean;
  isBonusPack?: boolean;
  isTrialPack?: boolean;
  is_active?: boolean;
};

export const mapCoinPack = (p: CoinPackApiRow): CoinStorePack => ({
  id: p.id as number,
  coins: p.coin_value as number,
  price: p.amount as number,
  bonus: p.bonus_coins,
  bonus_coins: p.bonus_coins ?? 0,
  product_id: p.product_id,
  name: p.name,
  icon_url: p.icon_url ?? null,
  is_micropack: Boolean(p.is_micropack ?? p.isMicropack),
  color: "bg-brand-surface",
  tag: p.isBonusPack
    ? "Bonus Pack"
    : p.isTrialPack
      ? "Trial Pack"
      : (p.is_micropack ?? p.isMicropack)
        ? "Micropack"
        : undefined,
  highlight: p.isBonusPack || false,
});

function parsePacksPayload(data: {
  success?: boolean;
  data?: CoinPackApiRow[];
}): CoinStorePack[] {
  if (data.success && Array.isArray(data.data)) {
    return data.data.filter((p) => p.is_active).map((p) => mapCoinPack(p));
  }
  return [];
}

/**
 * Reuses the HTML-boot prefetch (`window.__ZNW_COIN_PACKS`) when the org matches,
 * so the WebView `/coins` request starts before the React bundle parses.
 * Keep the prefetch URL in `znw-boot.js` in sync with `HOST` in `utils/host.ts`.
 */
export async function fetchCoinPackDetails(
  organisationId: string,
  search: string,
): Promise<CoinStorePack[]> {
  const jwtToken = resolvePageAuthToken(search, organisationId);

  const pre = typeof window !== "undefined" ? window.__ZNW_COIN_PACKS : undefined;
  if (
    pre?.promise &&
    pre.organisationId === organisationId &&
    !pre.consumed &&
    Boolean(pre.hasAuth) === Boolean(jwtToken)
  ) {
    pre.consumed = true;
    try {
      const r = await pre.promise;
      if (!r.ok) {
        throw new Error(`Coin pack prefetch failed: ${r.status}`);
      }
      const data = (await r.json()) as {
        success?: boolean;
        data?: CoinPackApiRow[];
      };
      return parsePacksPayload(data);
    } catch {
      /* fall through to a fresh fetch */
    }
  }

  const r = await fetch(
    `${HOST}/api/v1.2/creator_center/details/get-coin-pack-details/`,
    {
      headers: {
        ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
        "X-Organisation-ID": organisationId,
      },
    },
  );
  if (!r.ok) {
    throw new Error(`Coin pack fetch failed: ${r.status}`);
  }
  const data = (await r.json()) as {
    success?: boolean;
    data?: CoinPackApiRow[];
  };
  return parsePacksPayload(data);
}
