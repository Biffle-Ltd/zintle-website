export const PAYMENT_GATEWAY_MAP = {
  PhonePe: "PHONEPE",
  Easebuzz: "EASEBUZZ",
} as const;

export type PaymentGateway = keyof typeof PAYMENT_GATEWAY_MAP;

function parsePaymentGatewayParam(raw: string | null | undefined): PaymentGateway | null {
  if (!raw?.trim()) return null;
  const normalized = raw.trim().toLowerCase();
  if (normalized === "phonepe") return "PhonePe";
  if (normalized === "easebuzz") return "Easebuzz";
  return null;
}

/** Defaults to PhonePe; honours `payment_gateway` (case-insensitive: `phonepe`, `easebuzz`). */
export function getPaymentGatewayFromUrl(
  search: string = typeof window !== "undefined" ? window.location.search : "",
): PaymentGateway {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  return parsePaymentGatewayParam(params.get("payment_gateway")) ?? "PhonePe";
}

export const PAYMENT_GATEWAY: PaymentGateway = getPaymentGatewayFromUrl();
export const COIN_ORDER_PAYMENT_GATEWAY = PAYMENT_GATEWAY_MAP[PAYMENT_GATEWAY];
