/**
 * Pre-login auto-call overlay only: names + profile photos from prod
 * BIFFLE1234 priority_creators. No creator ids — Accept never rings these.
 */

const CDN = "https://d3gao7f0o4i01l.cloudfront.net/avatar_images_cm";

export type WebCallPreviewCreator = {
  name: string;
  profilePicUrl: string;
};

/** Prod priority list, display names formatted like the incoming card (First L.). */
export const WEB_CALL_PREVIEW_CREATORS: WebCallPreviewCreator[] = [
  { name: "Kayra", profilePicUrl: `${CDN}/profile+33.webp` },
  { name: "Maaya", profilePicUrl: `${CDN}/profile+49.webp` },
  { name: "Amayra", profilePicUrl: `${CDN}/profile+34.webp` },
  { name: "Radha K.", profilePicUrl: `${CDN}/profile+11.webp` },
  { name: "Payal K.", profilePicUrl: `${CDN}/profile+36.webp` },
  { name: "Soumya Y.", profilePicUrl: `${CDN}/profile+39.webp` },
  { name: "Sweeti S.", profilePicUrl: `${CDN}/profile+21.webp` },
  { name: "Aarohi M.", profilePicUrl: `${CDN}/profile+51.webp` },
  { name: "Nicky", profilePicUrl: `${CDN}/profile+35.webp` },
  { name: "Riya M.", profilePicUrl: `${CDN}/profile+35.webp` },
  { name: "Aarya", profilePicUrl: `${CDN}/profile+59.webp` },
  { name: "Avantika", profilePicUrl: `${CDN}/profile+7.webp` },
  { name: "Kalyani K.", profilePicUrl: `${CDN}/profile+40.webp` },
  { name: "Nikita S.", profilePicUrl: `${CDN}/profile+31.webp` },
  { name: "Aayesha K.", profilePicUrl: `${CDN}/profile+27.webp` },
  { name: "Sonu C.", profilePicUrl: `${CDN}/profile+47.webp` },
  { name: "Prachi S.", profilePicUrl: `${CDN}/profile+17.webp` },
  { name: "Koko C.", profilePicUrl: `${CDN}/profile+19.webp` },
  { name: "Anjali S.", profilePicUrl: `${CDN}/profile+42.webp` },
  { name: "Vijaya S.", profilePicUrl: `${CDN}/profile+43.webp` },
  { name: "Nivi", profilePicUrl: `${CDN}/profile+19.webp` },
  { name: "Aiswariya H.", profilePicUrl: `${CDN}/profile+8.webp` },
  { name: "Lakshmi", profilePicUrl: `${CDN}/profile+40.webp` },
];

const PREVIEW_INDEX_KEY = "zintle_web_call_preview_index";

export function formatIncomingDisplayName(raw: string): string {
  const cleaned = raw
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, " ")
    .replace(/[❤️❣️]/g, " ")
    .replace(/[^\p{L}\p{N}\s.'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "Creator";
  const parts = cleaned
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));
  if (parts.length === 1) return parts[0];
  if (parts[0].toLowerCase() === "miss") {
    return parts.slice(1).join(" ") || parts[0];
  }
  if (parts[0].toLowerCase() === parts[1].toLowerCase()) return parts[0];
  return `${parts[0]} ${parts[1][0].toUpperCase()}.`;
}

/** Sticky for the tab so the landing face does not flicker on re-render. */
export function pickWebCallPreviewCreator(): WebCallPreviewCreator {
  const pool = WEB_CALL_PREVIEW_CREATORS;
  try {
    const stored = Number(sessionStorage.getItem(PREVIEW_INDEX_KEY));
    if (Number.isInteger(stored) && stored >= 0 && stored < pool.length) {
      return pool[stored];
    }
    const index = Math.floor(Math.random() * pool.length);
    sessionStorage.setItem(PREVIEW_INDEX_KEY, String(index));
    return pool[index];
  } catch {
    return pool[0];
  }
}
