import { HOST } from "./host";
import { headerSafeToken } from "./headerSafeToken";

export type LanguageOption = {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
};

export type UserDetailsData = {
  is_member?: boolean;
  languages?: LanguageOption[];
  [key: string]: unknown;
};

function normalizeLanguageOption(raw: unknown): LanguageOption | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = typeof row.id === "number" ? row.id : Number(row.id);
  const code = row.code != null ? String(row.code).trim() : "";
  const name = row.name != null ? String(row.name).trim() : "";
  if (!Number.isFinite(id) || !code || !name) return null;
  return {
    id,
    code,
    name,
    is_active: row.is_active !== false,
  };
}

function parseLanguageList(payload: unknown): LanguageOption[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const data = root.data ?? root;
  if (Array.isArray(data)) {
    return data
      .map(normalizeLanguageOption)
      .filter((l): l is LanguageOption => l != null);
  }
  if (data && typeof data === "object") {
    const inner = data as Record<string, unknown>;
    const list = inner.languages ?? inner.results;
    if (Array.isArray(list)) {
      return list
        .map(normalizeLanguageOption)
        .filter((l): l is LanguageOption => l != null);
    }
  }
  return [];
}

export function userNeedsLanguageSelection(
  details: Pick<UserDetailsData, "languages">,
): boolean {
  const langs = details.languages;
  if (!Array.isArray(langs) || langs.length === 0) return true;
  return !langs.some(
    (l) => l.is_active !== false && String(l.code ?? "").trim(),
  );
}

export async function fetchUserDetails(
  token: string,
  organisationId: string,
  signal?: AbortSignal,
): Promise<UserDetailsData> {
  const jwtToken = headerSafeToken(token);
  const response = await fetch(
    `${HOST}/api/v1/user_center/details/get-user-details/`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
        "X-Organisation-ID": organisationId,
      },
      signal,
    },
  );
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`) as Error & {
      status?: number;
    };
    err.status = response.status;
    throw err;
  }
  const json = (await response.json()) as { data?: UserDetailsData };
  return json?.data ?? {};
}

export async function fetchAvailableLanguages(
  organisationId: string,
  token?: string | null,
  signal?: AbortSignal,
): Promise<LanguageOption[]> {
  const jwtToken = headerSafeToken(token);
  const response = await fetch(
    `${HOST}/api/v1/creator_center/application/get-languages/`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
        "X-Organisation-ID": organisationId,
      },
      signal,
    },
  );
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`) as Error & {
      status?: number;
    };
    err.status = response.status;
    throw err;
  }
  const json = await response.json();
  return parseLanguageList(json).filter((l) => l.is_active);
}

export async function updateUserLanguages(
  token: string,
  organisationId: string,
  languageCode: string,
  signal?: AbortSignal,
): Promise<void> {
  const jwtToken = headerSafeToken(token);
  const code = languageCode.trim();
  if (!code) throw new Error("Language code is required");

  const response = await fetch(
    `${HOST}/api/v1/user_center/details/update-user-profile-details/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
        "X-Organisation-ID": organisationId,
      },
      body: JSON.stringify({ languages: [code] }),
      signal,
    },
  );
  if (!response.ok) {
    const err = new Error(`HTTP ${response.status}`) as Error & {
      status?: number;
    };
    err.status = response.status;
    throw err;
  }
}

export function languageScriptGlyph(code: string): string {
  const map: Record<string, string> = {
    hi: "हि",
    ta: "த",
    te: "త",
    bn: "ব",
    kn: "ಕ",
  };
  return map[code.trim().toLowerCase()] ?? code.slice(0, 2).toUpperCase();
}
