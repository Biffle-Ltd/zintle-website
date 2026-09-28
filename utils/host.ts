export const PROD_API_HOST = "https://prod.biffle.ai";

/** Production builds always hit prod. Local `vite` still honors VITE_API_HOST (DEV). */
export const HOST = import.meta.env.PROD
  ? PROD_API_HOST
  : import.meta.env.VITE_API_HOST || PROD_API_HOST;
// export const HOST = "http://127.0.0.1:8003";
// WebView prefetch HOST is injected from vite.config.ts.