/**
 * Origins that work in prod when CloudFront sends CORS headers, but fail in local
 * dev (different origin → XHR blocked). In dev we rewrite to Vite `server.proxy`
 * paths so manifest + segments are same-origin.
 *
 * Production: keep full HTTPS URLs; fix CORS on the CDN (or proxy via your API).
 */
const DASH_DEV_PROXY_ORIGINS: readonly string[] = [
  "https://d3gao7f0o4i01l.cloudfront.net",
];

const DEV_PROXY_PREFIX = "/__dash_cf_proxy";

export function resolveDashManifestUrlForBrowser(url: string): string {
  if (!import.meta.env.DEV) return url;
  try {
    const parsed = new URL(url.trim());
    const origin = `${parsed.protocol}//${parsed.host}`;
    if (DASH_DEV_PROXY_ORIGINS.includes(origin)) {
      return `${DEV_PROXY_PREFIX}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    /* ignore */
  }
  return url;
}
