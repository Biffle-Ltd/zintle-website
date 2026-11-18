import type { CoinStorePack } from "../components/CoinStoreMobile.tsx";
import {
  cachedPackHasCatalogTotals,
  isPurchasableCatalogPack,
  mapCatalogCoinPack,
  type CatalogCoinPackRow,
} from "./coinStoreOffer.ts";
import { HOST } from "./host.ts";
import { resolvePageAuthToken } from "./authStorage.ts";
import {
  COIN_PACKS_CACHE_TTL_MS,
  apiCacheStorageKey,
  readApiCache,
  takeBootPrefetchJson,
  writeApiCache,
} from "./webviewApiCache.ts";

export type CoinPackApiRow = CatalogCoinPackRow & {
  is_active?: boolean;
};

export const mapCoinPack = (p: CoinPackApiRow): CoinStorePack =>
  mapCatalogCoinPack(p);

type CoinPacksApiResponse = {
  success?: boolean;
  data?: CoinPackApiRow[];
};

function parsePacksPayload(data: CoinPacksApiResponse): CoinStorePack[] | null {
  if (!data.success || !Array.isArray(data.data)) return null;
  return data.data
    .filter((p) => p.is_active)
    .map((p) => mapCoinPack(p))
    .filter(isPurchasableCatalogPack);
}

function coinPacksCacheKey(
  organisationId: string,
  token: string | null,
): string {
  return apiCacheStorageKey("packs", organisationId, token);
}

function isValidCachedPack(row: unknown): row is CoinStorePack {
  if (!row || typeof row !== "object") return false;
  const pack = row as CoinStorePack;
  return (
    typeof pack.id === "number" &&
    Number.isFinite(pack.id) &&
    typeof pack.coins === "number" &&
    Number.isFinite(pack.coins) &&
    typeof pack.price === "number" &&
    Number.isFinite(pack.price) &&
    cachedPackHasCatalogTotals(pack)
  );
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
  if (!Array.isArray(packs)) return null;
  if (packs.length === 0) return packs;
  return packs.every(isValidCachedPack) ? packs : null;
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
