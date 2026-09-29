/**
 * Pre-login auto-call overlay only: names + profile photos snapshotted from
 * prod BIFFLE1234 Variable `priority_creators`. No creator ids — Accept never
 * rings these. Refresh the snapshot when Ops changes that list.
 */

export type WebCallPreviewCreator = {
  name: string;
  profilePicUrl: string;
};

/** Raw prod names. Display formatting happens in `WEB_CALL_PREVIEW_CREATORS`. */
const PRIORITY_CREATOR_SNAPSHOT: WebCallPreviewCreator[] = [
  {
    name: "Maaya👸😘 🌸",
    profilePicUrl:
      "https://d3gao7f0o4i01l.cloudfront.net/avatar_images_cm/profile+49.webp",
  },
  {
    name: "Anjali Singh",
    profilePicUrl:
      "https://d3gao7f0o4i01l.cloudfront.net/avatar_images_cm/profile+42.webp",
  },
  {
    name: "Ishani Ji",
    profilePicUrl:
      "https://d3gao7f0o4i01l.cloudfront.net/avatar_images_cm/profile+10.webp",
  },
  {
    name: "Anjali ❤️",
    profilePicUrl:
      "https://d3gao7f0o4i01l.cloudfront.net/avatar_images_cm/profile+55.webp",
  },
  {
    name: "Radha Kumari",
    profilePicUrl:
      "https://d3gao7f0o4i01l.cloudfront.net/avatar_images_cm/profile+11.webp",
  },
  {
    name: "Kayra",
    profilePicUrl:
      "https://d3gao7f0o4i01l.cloudfront.net/avatar_images_cm/profile+33.webp",
  },
  {
    name: "Anisha",
    profilePicUrl:
      "https://d3gao7f0o4i01l.cloudfront.net/avatar_images_cm/profile+17.webp",
  },
  {
    name: "Nicky",
    profilePicUrl:
      "https://d3gao7f0o4i01l.cloudfront.net/avatar_images_cm/profile+35.webp",
  },
  {
    name: "Amayra❣️",
    profilePicUrl:
      "https://d3gao7f0o4i01l.cloudfront.net/avatar_images_cm/profile+34.webp",
  },
  {
    name: "Sweeti Sharma",
    profilePicUrl:
      "https://d3gao7f0o4i01l.cloudfront.net/avatar_images_cm/profile+21.webp",
  },
  {
    name: "Prachi Singh",
    profilePicUrl:
      "https://d3gao7f0o4i01l.cloudfront.net/avatar_images_cm/profile+17.webp",
  },
  {
    name: "vijaya shanthi",
    profilePicUrl:
      "https://d3gao7f0o4i01l.cloudfront.net/avatar_images_cm/profile+43.webp",
  },
  {
    name: "Nivi Nivi",
    profilePicUrl:
      "https://d3gao7f0o4i01l.cloudfront.net/avatar_images_cm/profile+19.webp",
  },
  {
    name: "Aiswariya H",
    profilePicUrl:
      "https://d3gao7f0o4i01l.cloudfront.net/avatar_images_cm/profile+8.webp",
  },
  {
    name: "Lakshmi Lakshmi",
    profilePicUrl:
      "https://d3gao7f0o4i01l.cloudfront.net/avatar_images_cm/profile+40.webp",
  },
  {
    name: "Renu Anu",
    profilePicUrl:
      "https://d3gao7f0o4i01l.cloudfront.net/avatar_images_cm/profile+61.webp",
  },
  {
    name: "Roopashree Roopashree",
    profilePicUrl:
      "https://d3gao7f0o4i01l.cloudfront.net/avatar_images_cm/profile+13.webp",
  },
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

/** Drive `uc?export=view` 403s in <img>; thumbnails load. CDN URLs pass through. */
function usablePreviewPhotoUrl(raw: string): string {
  const url = raw.trim();
  if (!url.includes("drive.google.com")) return url;
  const fromQuery = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const fromPath = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const fileId = fromQuery?.[1] || fromPath?.[1];
  if (!fileId) return url;
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
}

export const WEB_CALL_PREVIEW_CREATORS: WebCallPreviewCreator[] =
  PRIORITY_CREATOR_SNAPSHOT.map((row) => ({
    name: formatIncomingDisplayName(row.name),
    profilePicUrl: usablePreviewPhotoUrl(row.profilePicUrl),
  })).filter((row) => row.profilePicUrl);

/** Sticky for the tab so the landing face does not flicker on re-render. */
export function pickWebCallPreviewCreator(): WebCallPreviewCreator {
  const pool = WEB_CALL_PREVIEW_CREATORS;
  const fallback = pool[0] ?? { name: "Creator", profilePicUrl: "" };
  try {
    const stored = Number(sessionStorage.getItem(PREVIEW_INDEX_KEY));
    if (Number.isInteger(stored) && stored >= 0 && stored < pool.length) {
      return pool[stored];
    }
    const index = Math.floor(Math.random() * pool.length);
    sessionStorage.setItem(PREVIEW_INDEX_KEY, String(index));
    return pool[index] ?? fallback;
  } catch {
    return fallback;
  }
}
