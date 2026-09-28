import React from "react";

export const ZNW_CHUNK_RELOAD_KEY = "znw_chunk_reload";

export function isStaleChunkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err || "");
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i.test(
    msg,
  );
}

export function reloadOnceForStaleChunk(): boolean {
  try {
    if (sessionStorage.getItem(ZNW_CHUNK_RELOAD_KEY) === "1") return false;
    sessionStorage.setItem(ZNW_CHUNK_RELOAD_KEY, "1");
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

export function clearChunkReloadFlag(): void {
  try {
    sessionStorage.removeItem(ZNW_CHUNK_RELOAD_KEY);
  } catch {
    /* private mode */
  }
}

/** Reload once when a hashed Vite chunk 404s after a deploy, instead of a blank page. */
export function lazyWithRetry<T extends { default: React.ComponentType<any> }>(
  importer: () => Promise<T>,
): React.LazyExoticComponent<T["default"]> {
  return React.lazy(() =>
    importer()
      .then((mod) => {
        clearChunkReloadFlag();
        return mod;
      })
      .catch((err: unknown) => {
        if (isStaleChunkError(err) && reloadOnceForStaleChunk()) {
          return new Promise<T>(() => {});
        }
        throw err;
      }),
  );
}
