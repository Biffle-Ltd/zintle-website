import type { CoinStorePack } from "../components/CoinStoreMobile";
import { HOST } from "./host";
import { resolvePageAuthToken } from "./authStorage";
import {
  COIN_PACKS_CACHE_TTL_MS,
  readApiCache,
  takeBootPrefetchJson,
  tokenFingerprint,
  writeApiCache,
} from "./webviewApiCache";

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

type CoinPacksApiResponse = {
  success?: boolean;
  data?: CoinPackApiRow[];
};

function parsePacksPayload(data: CoinPacksApiResponse): CoinStorePack[] | null {
  if (!data.success || !Array.isArray(data.data)) return null;
  return data.data.filter((p) => p.is_active).map((p) => mapCoinPack(p));
}

function coinPacksCacheKey(
  organisationId: string,
  token: string | null,
): string {
  return `znw.v1.packs.${organisationId}.${tokenFingerprint(token)}`;
}

/** `null` = cache miss. `[]` = confirmed empty catalog. */
export function readCachedCoinPacks(
  organisationId: string,
  token: string | null,
): CoinStorePack[] | null {
  const packs = readApiCache<CoinStorePack[]>(
    coinPacksCacheKey(organisationId, token),
    COIN_PACKS_CACHE_TTL_MS,
  );
  return Array.isArray(packs) ? packs : null;
}

function rememberCoinPacks(
  organisationId: string,
  token: string | null,
  packs: CoinStorePack[],
): CoinStorePack[] {
  writeApiCache(coinPacksCacheKey(organisationId, token), packs);
  return packs;
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
  const hasAuth = Boolean(jwtToken);

  const boot = await takeBootPrefetchJson<CoinPacksApiResponse>(
    typeof window !== "undefined" ? window.__ZNW_COIN_PACKS : undefined,
    organisationId,
    hasAuth,
  );
  if (boot?.ok) {
    const packs = parsePacksPayload(boot.json);
    if (packs) {
      return rememberCoinPacks(organisationId, jwtToken, packs);
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
  const data = (await r.json()) as CoinPacksApiResponse;
  const packs = parsePacksPayload(data);
  // Invalid payload: same as before — empty catalog, do not cache garbage.
  if (!packs) return [];
  return rememberCoinPacks(organisationId, jwtToken, packs);
}
