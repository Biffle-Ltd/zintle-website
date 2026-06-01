const LOGIN_CONTACT_STORAGE_KEY = "zintle_login_contact";

type StoredLoginContact = {
  countryCode: string;
  phone: string;
};

function readAll(): Record<string, StoredLoginContact> {
  try {
    const raw = sessionStorage.getItem(LOGIN_CONTACT_STORAGE_KEY);
    if (!raw?.trim()) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, StoredLoginContact>;
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, StoredLoginContact>): void {
  sessionStorage.setItem(LOGIN_CONTACT_STORAGE_KEY, JSON.stringify(data));
}

/** Persist phone used at OTP login for checkout UI (per organisation). */
export function setLoginPhoneForOrganisation(
  organisationId: string,
  countryCode: string,
  phoneNumber: string,
): void {
  const org = organisationId.trim();
  if (!org) return;
  const phone = phoneNumber.replace(/\D/g, "");
  if (!phone) return;
  const all = readAll();
  all[org] = { countryCode: countryCode.replace(/\D/g, "") || "91", phone };
  writeAll(all);
}

export function getLoginPhoneForOrganisation(
  organisationId: string,
): string {
  const entry = readAll()[organisationId.trim()];
  return entry?.phone ?? "";
}

export function clearAllLoginContactStorage(): void {
  sessionStorage.removeItem(LOGIN_CONTACT_STORAGE_KEY);
}
