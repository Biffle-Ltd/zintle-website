import { isBiffleOrganisationId } from "./organisationIdFromUrl";
import { clearAllLoginContactStorage } from "./loginContactStorage";

export const ZINTLE_JWT_STORAGE_KEY = "zintle_jwt";
export const BIFFLE_JWT_STORAGE_KEY = "biffle_jwt";

export function getJwtFromStorage(
  organisationId: string | undefined,
): string | null {
  if (isBiffleOrganisationId(organisationId)) {
    return localStorage.getItem(BIFFLE_JWT_STORAGE_KEY);
  }
  return localStorage.getItem(ZINTLE_JWT_STORAGE_KEY);
}

export function setJwtForOrganisation(
  organisationId: string | undefined,
  token: string,
): void {
  if (isBiffleOrganisationId(organisationId)) {
    localStorage.setItem(BIFFLE_JWT_STORAGE_KEY, token);
  } else {
    localStorage.setItem(ZINTLE_JWT_STORAGE_KEY, token);
  }
}

export function clearJwtForOrganisation(
  organisationId: string | undefined,
): void {
  if (isBiffleOrganisationId(organisationId)) {
    localStorage.removeItem(BIFFLE_JWT_STORAGE_KEY);
  } else {
    localStorage.removeItem(ZINTLE_JWT_STORAGE_KEY);
  }
}

export function clearAllJwtStorage(): void {
  localStorage.removeItem(ZINTLE_JWT_STORAGE_KEY);
  localStorage.removeItem(BIFFLE_JWT_STORAGE_KEY);
  clearAllLoginContactStorage();
}

export function hasAnyJwtInStorage(): boolean {
  return !!(
    localStorage.getItem(ZINTLE_JWT_STORAGE_KEY) ||
    localStorage.getItem(BIFFLE_JWT_STORAGE_KEY)
  );
}
