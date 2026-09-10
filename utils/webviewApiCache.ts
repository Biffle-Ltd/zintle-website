/**
 * localStorage SWR cache for CoinStore GET payloads (falls back to sessionStorage).
 * Survives WebView process kills; TTL still applies. Boot prefetch still wins
 * on first paint.
 */

export const COIN_PACKS_CACHE_TTL_MS = 10 * 60 * 1000;
export const SUBSCRIPTION_PACKS_CACHE_TTL_MS = 10 * 60 * 1000;
/** Membership can change after a purchase — keep this short and bust on success. */
export const USER_DETAILS_CACHE_TTL_MS = 60 * 1000;

/** Bumped after fingerprint keys stopped embedding JWT suffixes. */
export const API_CACHE_KEY_PREFIX = "znw.v2.";
const LEGACY_API_CACHE_PREFIXES = ["znw.v1."] as const;
/** Drop unread keys (JWT refresh orphans) even if their per-entry TTL was shorter. */
const API_CACHE_HARD_EXPIRE_MS = 10 * 60 * 1000;

let prunedThisDocument = false;

export type ApiCacheKind = "packs" | "subPacks" | "userDetails";

export function apiCacheStorageKey(
  kind: ApiCacheKind,
  organisationId: string,
  token: string | null | undefined,
): string {
  return `${API_CACHE_KEY_PREFIX}${kind}.${organisationId}.${tokenFingerprint(token)}`;
}

export type BootPrefetchHandle = {
  organisationId: string;
  promise: Promise<Response>;
  consumed?: boolean;
  hasAuth?: boolean;
};

type CacheEntry<T> = {
  t: number;
  v: T;
};

export function tokenFingerprint(
  token: string | null | undefined,
): string {
  if (!token) return "anon";
  // FNV-1a 32 with a length-mixed second pass — storage keys must not hold token bytes.
  const a = fnv1a32(token, 0x811c9dc5);
  const b = fnv1a32(token, 0x811c9dc5 ^ token.length);
  return `h${a.toString(16).padStart(8, "0")}${b.toString(16).padStart(8, "0")}`;
}

function fnv1a32(value: string, seed: number): number {
  let h = seed;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function getApiCacheStorage(): Storage | null {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    /* private mode / blocked */
  }
  try {
    if (typeof sessionStorage !== "undefined") return sessionStorage;
  } catch {
    /* ignore */
  }
  return null;
}

function collectPrefixedKeys(storage: Storage, prefix: string): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith(prefix)) keys.push(key);
  }
  return keys;
}

function wipeLegacyApiCache(storage: Storage): void {
  for (const prefix of LEGACY_API_CACHE_PREFIXES) {
    for (const key of collectPrefixedKeys(storage, prefix)) {
      try {
        storage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
  }
}

function ensurePruned(storage: Storage): void {
  wipeLegacyApiCache(storage);
  if (prunedThisDocument) return;
  pruneExpiredApiCache(storage);
  prunedThisDocument = true;
}

function pruneExpiredApiCache(storage: Storage): void {
  const now = Date.now();
  for (const key of collectPrefixedKeys(storage, API_CACHE_KEY_PREFIX)) {
    try {
      const raw = storage.getItem(key);
      if (!raw) {
        storage.removeItem(key);
        continue;
      }
      const entry = JSON.parse(raw) as CacheEntry<unknown>;
      if (
        !entry ||
        typeof entry !== "object" ||
        typeof entry.t !== "number" ||
        now - entry.t > API_CACHE_HARD_EXPIRE_MS
      ) {
        storage.removeItem(key);
      }
    } catch {
      storage.removeItem(key);
    }
  }
}

export function readApiCache<T>(key: string, ttlMs: number): T | null {
  const storage = getApiCacheStorage();
  if (!storage) return null;
  try {
    ensurePruned(storage);
    const raw = storage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (
      !entry ||
      typeof entry !== "object" ||
      typeof entry.t !== "number" ||
      !("v" in entry) ||
      Date.now() - entry.t > ttlMs
    ) {
      storage.removeItem(key);
      return null;
    }
    return entry.v;
  } catch {
    try {
      storage.removeItem(key);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function writeApiCache<T>(key: string, value: T): void {
  const storage = getApiCacheStorage();
  if (!storage) return;
  const persist = (): void => {
    const entry: CacheEntry<T> = { t: Date.now(), v: value };
    storage.setItem(key, JSON.stringify(entry));
  };
  try {
    ensurePruned(storage);
    persist();
  } catch {
    try {
      wipeLegacyApiCache(storage);
      pruneExpiredApiCache(storage);
      prunedThisDocument = true;
      persist();
    } catch {
      /* quota / private mode */
    }
  }
}

export function clearApiCache(key: string): void {
  const storage = getApiCacheStorage();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Drop every CoinStore SWR entry (logout / org switch). */
export function clearAllApiCache(): void {
  const storage = getApiCacheStorage();
  if (!storage) return;
  wipeLegacyApiCache(storage);
  for (const key of collectPrefixedKeys(storage, API_CACHE_KEY_PREFIX)) {
    try {
      storage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

/** Drain an unused boot prefetch so the Response body is not left hanging. */
export function discardBootPrefetch(
  pre: BootPrefetchHandle | undefined,
): void {
  if (!pre?.promise || pre.consumed) return;
  pre.consumed = true;
  void pre.promise
    .then((r) => r.json().catch(() => null))
    .catch(() => {});
}

export async function takeBootPrefetchJson<T>(
  pre: BootPrefetchHandle | undefined,
  organisationId: string,
  hasAuth: boolean,
): Promise<{ ok: boolean; status: number; json: T } | null> {
  if (!pre?.promise || pre.consumed) return null;
  if (
    pre.organisationId !== organisationId ||
    Boolean(pre.hasAuth) !== hasAuth
  ) {
    discardBootPrefetch(pre);
    return null;
  }
  pre.consumed = true;
  try {
    const r = await pre.promise;
    const json = (await r.json()) as T;
    return { ok: r.ok, status: r.status, json };
  } catch {
    return null;
  }
}
