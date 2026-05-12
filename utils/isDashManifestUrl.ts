/** True when URL points to an MPEG-DASH manifest (.mpd). */
export function isDashManifestUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const path = new URL(trimmed, window.location.href).pathname.toLowerCase();
    return path.endsWith(".mpd");
  } catch {
    return /\.mpd(\?|#|$)/i.test(trimmed);
  }
}
