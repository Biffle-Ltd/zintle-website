import type { CoinStorePack } from "../components/CoinStoreMobile";
import { resolvePageAuthToken } from "./authStorage";
import { getOrganisationIdFromSearch } from "./organisationIdFromUrl";
import { readCachedCoinPacks } from "./coinPacksApi";
import { tokenFingerprint } from "./webviewApiCache";
import {
  EMPTY_COIN_STORE_PLANS,
  readCachedSubscriptionPlans,
  type CoinStoreSubscriptionPlans,
} from "./subscriptionPlansApi";
import { readCachedUserDetails } from "./userProfileApi";

export type CoinStoreMembershipSeed = CoinStoreSubscriptionPlans & {
  isMember: boolean;
  loading: boolean;
};

/** `is_member` query: true / false / absent. Keep in sync with znw-boot.js. */
export function parseIsMemberQueryParam(
  raw: string | null | undefined,
): boolean | null {
  if (raw == null || !String(raw).trim()) return null;
  const v = String(raw).trim().toLowerCase();
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return null;
}

/** `null` = miss (show skeleton). Array, including empty, = cache hit. */
export function readCachedCoinPacksForLocation(
  search: string,
  pathname: string,
): CoinStorePack[] | null {
  const organisationId = getOrganisationIdFromSearch(search, pathname);
  const token = resolvePageAuthToken(search, organisationId);
  return readCachedCoinPacks(organisationId, token);
}

export function readInitialCoinPacksState(): {
  packs: CoinStorePack[];
  loading: boolean;
} {
  if (typeof window === "undefined") {
    return { packs: [], loading: true };
  }
  const cached = readCachedCoinPacksForLocation(
    window.location.search,
    window.location.pathname,
  );
  if (cached == null) return { packs: [], loading: true };
  return { packs: cached, loading: false };
}

/** React `key` so CoinsPage remounts when org / JWT / is_member changes. */
export function coinStoreSessionKey(
  organisationId: string,
  search: string,
): string {
  const token = resolvePageAuthToken(search, organisationId);
  const isMemberQuery = parseIsMemberQueryParam(
    new URLSearchParams(
      search.startsWith("?") ? search.slice(1) : search,
    ).get("is_member"),
  );
  return `${organisationId}|${tokenFingerprint(token)}|${String(isMemberQuery)}`;
}

/**
 * Instant CoinStore membership UI from session cache / URL.
 * Network revalidation still runs in CoinsPage — this only skips the skeleton.
 */
export function seedCoinStoreMembership(
  token: string | null,
  organisationId: string,
  search: string,
): CoinStoreMembershipSeed {
  const isMemberParam = parseIsMemberQueryParam(
    new URLSearchParams(
      search.startsWith("?") ? search.slice(1) : search,
    ).get("is_member"),
  );

  if (isMemberParam === true) {
    return { loading: false, isMember: true, ...EMPTY_COIN_STORE_PLANS };
  }

  if (isMemberParam === false) {
    if (!token) {
      return { loading: false, isMember: false, ...EMPTY_COIN_STORE_PLANS };
    }
    const plans = readCachedSubscriptionPlans(token, organisationId);
    if (plans) {
      return { loading: false, isMember: false, ...plans };
    }
    return { loading: true, isMember: false, ...EMPTY_COIN_STORE_PLANS };
  }

  if (!token) {
    return { loading: false, isMember: true, ...EMPTY_COIN_STORE_PLANS };
  }

  const details = readCachedUserDetails(token, organisationId);
  if (!details) {
    return { loading: true, isMember: true, ...EMPTY_COIN_STORE_PLANS };
  }
  if (details.is_member) {
    return { loading: false, isMember: true, ...EMPTY_COIN_STORE_PLANS };
  }
  const plans = readCachedSubscriptionPlans(token, organisationId);
  if (plans) {
    return { loading: false, isMember: false, ...plans };
  }
  return { loading: true, isMember: false, ...EMPTY_COIN_STORE_PLANS };
}
