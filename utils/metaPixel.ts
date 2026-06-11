import { isBiffleOrganisationId } from "./organisationIdFromUrl";

/** Zintle Meta Pixel / dataset */
export const ZINTLE_META_PIXEL_ID = "1223829379897212";

/** Biffle Meta Pixel / dataset */
export const BIFFLE_META_PIXEL_ID = "661930529945825";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function getMetaPixelIdForOrganisation(organisationId: string): string {
  return isBiffleOrganisationId(organisationId)
    ? BIFFLE_META_PIXEL_ID
    : ZINTLE_META_PIXEL_ID;
}

/** Route PageView to the org-specific pixel only (both pixels are inited in index.html). */
export function sendMetaPixelPageView(organisationId: string): void {
  const fbq = typeof window !== "undefined" ? window.fbq : undefined;
  if (typeof fbq !== "function") return;

  const pixelId = getMetaPixelIdForOrganisation(organisationId);
  try {
    fbq("trackSingle", pixelId, "PageView");
  } catch {
    console.error("Failed to send Meta PageView", pixelId);
  }
}

/** Route a custom event to the org-specific pixel only (not all inited pixels). */
export function sendMetaPixelCustomEvent(
  organisationId: string,
  eventName: string,
  payload: Record<string, unknown>,
): void {
  const fbq = typeof window !== "undefined" ? window.fbq : undefined;
  if (typeof fbq !== "function") return;

  const pixelId = getMetaPixelIdForOrganisation(organisationId);
  try {
    fbq("trackSingleCustom", pixelId, eventName, payload);
    console.log("Meta pixel event sent", pixelId, eventName, payload);
  } catch {
    console.error("Failed to send Meta pixel event", pixelId, eventName, payload);
  }
}
