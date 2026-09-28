import { isBiffleOrganisationId } from "./organisationIdFromUrl.ts";
import { headerSafeToken } from "./headerSafeToken.ts";
import { clearAllLoginContactStorage } from "./loginContactStorage.ts";

export const ZINTLE_JWT_STORAGE_KEY = "zintle_jwt";
export const BIFFLE_JWT_STORAGE_KEY = "biffle_jwt";

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode / quota */
  }
}

function removeLocal(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* private mode */
  }
}

export function getJwtFromStorage(
  organisationId: string | undefined,
): string | null {
  if (isBiffleOrganisationId(organisationId)) {
    return readLocal(BIFFLE_JWT_STORAGE_KEY);
  }
  return readLocal(ZINTLE_JWT_STORAGE_KEY);
}

export function setJwtForOrganisation(
  organisationId: string | undefined,
  token: string,
): void {
  if (isBiffleOrganisationId(organisationId)) {
    writeLocal(BIFFLE_JWT_STORAGE_KEY, token);
  } else {
    writeLocal(ZINTLE_JWT_STORAGE_KEY, token);
  }
}

export function clearJwtForOrganisation(
  organisationId: string | undefined,
): void {
  if (isBiffleOrganisationId(organisationId)) {
    removeLocal(BIFFLE_JWT_STORAGE_KEY);
  } else {
    removeLocal(ZINTLE_JWT_STORAGE_KEY);
  }
}

export function clearAllJwtStorage(): void {
  removeLocal(ZINTLE_JWT_STORAGE_KEY);
  removeLocal(BIFFLE_JWT_STORAGE_KEY);
  clearAllLoginContactStorage();
}

export function hasAnyJwtInStorage(): boolean {
  return !!(readLocal(ZINTLE_JWT_STORAGE_KEY) || readLocal(BIFFLE_JWT_STORAGE_KEY));
}

/** Query `id` wins when it is header-safe; otherwise fall back to org storage. */
export function resolvePageAuthToken(
  search: string,
  organisationId: string | undefined,
): string | null {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  return (
    headerSafeToken(params.get("id")) ||
    headerSafeToken(getJwtFromStorage(organisationId))
  );
}
