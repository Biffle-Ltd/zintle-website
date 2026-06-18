export const PAYMENT_GATEWAY_MAP = {
  PhonePe: "PHONEPE",
  Easebuzz: "EASEBUZZ",
} as const;

export type PaymentGateway = keyof typeof PAYMENT_GATEWAY_MAP;

export function getPaymentGatewayFromUrl(): PaymentGateway {
  const raw = new URLSearchParams(window.location.search)
    .get("payment_gateway")
    ?.trim();
  if (raw && raw in PAYMENT_GATEWAY_MAP) return raw as PaymentGateway;
  return "Easebuzz";
}

export const PAYMENT_GATEWAY: PaymentGateway = getPaymentGatewayFromUrl();
export const COIN_ORDER_PAYMENT_GATEWAY = PAYMENT_GATEWAY_MAP[PAYMENT_GATEWAY];
