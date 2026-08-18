export const PAYMENT_GATEWAY_MAP = {
  PhonePe: "PHONEPE",
  Easebuzz: "EASEBUZZ",
} as const;

export type PaymentGateway = keyof typeof PAYMENT_GATEWAY_MAP;

/**
 * Coin checkout is always Easebuzz iframe. URL `payment_gateway` is ignored.
 */
export function getPaymentGatewayFromUrl(
  _search: string = typeof window !== "undefined" ? window.location.search : "",
): PaymentGateway {
  return "Easebuzz";
}

export const PAYMENT_GATEWAY: PaymentGateway = "Easebuzz";
export const COIN_ORDER_PAYMENT_GATEWAY = PAYMENT_GATEWAY_MAP[PAYMENT_GATEWAY];
