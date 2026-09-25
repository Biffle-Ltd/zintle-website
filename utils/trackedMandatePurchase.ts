import type { ParsedCoinPixelContext } from "./pixelEvents";

const STORAGE_KEY = "znw_tracked_mandate_purchase";

export type TrackedMandatePurchase = {
  mandateId: number;
  mandateUuid: string;
  coinPackId: number;
  amount: number;
  coinQuantity: number;
  isSubscription: true;
  pixelContext: ParsedCoinPixelContext;
};

let memory: TrackedMandatePurchase | null = null;

function isTrackedMandatePurchase(
  value: unknown,
): value is TrackedMandatePurchase {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.mandateId === "number" &&
    Number.isFinite(v.mandateId) &&
    typeof v.mandateUuid === "string" &&
    typeof v.coinPackId === "number" &&
    typeof v.amount === "number" &&
    typeof v.coinQuantity === "number" &&
    v.isSubscription === true &&
    v.pixelContext != null &&
    typeof v.pixelContext === "object"
  );
}

function readStorage(): TrackedMandatePurchase | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isTrackedMandatePurchase(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveTrackedMandate(purchase: TrackedMandatePurchase): void {
  memory = purchase;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(purchase));
  } catch {
    // private mode / quota — in-memory ref still works for this document
  }
}

export function peekTrackedMandate(
  mandateId?: number,
): TrackedMandatePurchase | null {
  if (!memory) memory = readStorage();
  if (!memory) return null;
  if (mandateId != null && memory.mandateId !== mandateId) return null;
  return memory;
}

export function takeTrackedMandate(
  mandateId: number,
): TrackedMandatePurchase | null {
  const ref = peekTrackedMandate(mandateId);
  if (!ref) return null;
  clearTrackedMandate();
  return ref;
}

export function clearTrackedMandate(): void {
  memory = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
