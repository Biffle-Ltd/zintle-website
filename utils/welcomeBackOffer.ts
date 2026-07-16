import { HOST } from "./host";
import { headerSafeToken } from "./headerSafeToken";

export type WelcomeBackCoinPack = {
  id: number;
  name: string;
  description?: string;
  coin_value: number;
  bonus_coins?: number;
  icon_url?: string | null;
  is_active?: boolean;
  amount: number;
  product_id?: string;
  currency?: string;
  currency_symbol?: string;
};

export type WelcomeBackOfferResponse = {
  success: boolean;
  data: {
    is_eligible: boolean;
    coin_pack: WelcomeBackCoinPack | null;
  };
  organisation_id?: string;
};

function unwrapCoinPackJson(parsed: unknown): WelcomeBackCoinPack | null {
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  const inner = o.coin_pack ?? o.data ?? o;
  if (!inner || typeof inner !== "object") return null;
  const pack = inner as Record<string, unknown>;
  const id = typeof pack.id === "number" ? pack.id : null;
  const amount =
    typeof pack.amount === "number"
      ? pack.amount
      : typeof pack.amount === "string"
        ? Number(pack.amount)
        : NaN;
  if (id == null || !Number.isFinite(amount)) return null;
  return {
    id,
    name: String(pack.name ?? "Welcome Back Pack"),
    description:
      typeof pack.description === "string" ? pack.description : undefined,
    coin_value:
      typeof pack.coin_value === "number"
        ? pack.coin_value
        : Number(pack.coin_value) || 0,
    bonus_coins:
      typeof pack.bonus_coins === "number" ? pack.bonus_coins : undefined,
    icon_url:
      typeof pack.icon_url === "string"
        ? pack.icon_url
        : pack.icon_url === null
          ? null
          : undefined,
    is_active: typeof pack.is_active === "boolean" ? pack.is_active : true,
    amount,
    product_id:
      typeof pack.product_id === "string" ? pack.product_id : undefined,
    currency: typeof pack.currency === "string" ? pack.currency : "INR",
    currency_symbol:
      typeof pack.currency_symbol === "string" ? pack.currency_symbol : "₹",
  };
}

/** URI-encoded JSON in query `coin_pack` (same pattern as `plan_details` on /subscriptions). */
export function parseCoinPackFromUrl(
  search: string,
): WelcomeBackCoinPack | null {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const raw = params.get("coin_pack");
  if (!raw || !String(raw).trim()) return null;
  try {
    const decoded = decodeURIComponent(raw.replace(/\+/g, " "));
    const parsed: unknown = JSON.parse(decoded);
    return unwrapCoinPackJson(parsed);
  } catch {
    return null;
  }
}

/** Compare/strikethrough price: round to int, round to nearest 10, ×4 − 1 (e.g. ₹49 → ₹199). */
export function computeComparePrice(amount: number): number {
  const rounded = Math.round(amount);
  const nearestTen = Math.round(rounded / 10) * 10;
  return nearestTen * 4 - 1;
}

export function formatWelcomeBackPrice(
  amount: number,
  currencySymbol = "₹",
): string {
  const rounded = Math.round(amount);
  return `${currencySymbol}${rounded.toLocaleString("en-IN")}`;
}

/** Terminal payment outcomes — no welcome-back re-fetch after poll. */
export function isClearPaymentStatus(status: string | undefined): boolean {
  const normalized = (status ?? "").toUpperCase();
  return normalized === "SUCCESS" || normalized === "FAILED";
}

export async function fetchWelcomeBackOffer(
  token: string | null | undefined,
  organisationId: string,
  signal?: AbortSignal,
): Promise<WelcomeBackOfferResponse> {
  const jwtToken = headerSafeToken(token);
  const r = await fetch(
    `${HOST}/api/v1/creator_center/details/get-welcome-back-offer/`,
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
  const data = (await r.json().catch(() => null)) as WelcomeBackOfferResponse;
  if (!r.ok) {
    throw new Error("Failed to fetch welcome back offer");
  }
  return data;
}
