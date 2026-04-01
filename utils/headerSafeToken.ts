/** Sanitize token for HTTP headers (ISO-8859-1 only) to avoid fetch "non ISO-8859-1 code point" error. */
export function headerSafeToken(t: string | null | undefined): string | null {
  if (!t || typeof t !== "string") return null;
  const safe = t.replace(/[\u0100-\uFFFF]/g, "");
  return safe.length > 0 ? safe : null;
}
