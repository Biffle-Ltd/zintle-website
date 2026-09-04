/**
 * PhonePe / Easebuzz checkout SDKs only expose close/response callbacks — not load.
 * Detect checkout iframe insertion + `load` so we can fire analytics once the
 * payment UI has actually loaded.
 */

export type CheckoutIframeGateway = "phonepe" | "easebuzz";

const WATCH_TIMEOUT_MS = 30_000;
const WATCH_ATTR = "data-zintle-checkout-watch";

function iframeSrc(iframe: HTMLIFrameElement): string {
  return (iframe.src || iframe.getAttribute("src") || "").trim();
}

function isPhonePeCheckoutIframe(iframe: HTMLIFrameElement): boolean {
  const src = iframeSrc(iframe);
  return /phonepe\.com/i.test(src);
}

function isEasebuzzCheckoutIframe(iframe: HTMLIFrameElement): boolean {
  const id = iframe.id || "";
  if (id.startsWith("easebuzz-checkout-frame-")) return true;
  return /easebuzz/i.test(iframeSrc(iframe));
}

function matchesGateway(
  iframe: HTMLIFrameElement,
  gateway: CheckoutIframeGateway,
): boolean {
  return gateway === "phonepe"
    ? isPhonePeCheckoutIframe(iframe)
    : isEasebuzzCheckoutIframe(iframe);
}

function collectIframes(root: Node): HTMLIFrameElement[] {
  if (root instanceof HTMLIFrameElement) return [root];
  if (root instanceof Element) {
    return Array.from(root.querySelectorAll("iframe"));
  }
  return [];
}

/**
 * Invokes `onLoaded` once when the matching payment checkout iframe fires `load`.
 * Returns a disposer that cancels the watch (no-op after fire / timeout).
 */
export function watchPaymentCheckoutIframeLoad(
  gateway: CheckoutIframeGateway,
  onLoaded: () => void,
): () => void {
  if (typeof document === "undefined" || !document.body) {
    return () => {};
  }

  let settled = false;
  let observer: MutationObserver | null = null;
  let timeoutId: number | undefined;

  const cleanup = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (timeoutId != null) {
      window.clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  const finish = () => {
    if (settled) return;
    settled = true;
    cleanup();
    onLoaded();
  };

  const attach = (iframe: HTMLIFrameElement) => {
    if (settled || !matchesGateway(iframe, gateway)) return;
    if (iframe.getAttribute(WATCH_ATTR) === gateway) return;
    iframe.setAttribute(WATCH_ATTR, gateway);
    iframe.addEventListener("load", finish, { once: true });
  };

  const scan = (root: Node = document.body) => {
    for (const iframe of collectIframes(root)) {
      attach(iframe);
    }
    if (root instanceof Element) {
      // Easebuzz creates the iframe before setting src; PhonePe may too.
      if (root.matches?.("iframe")) attach(root as HTMLIFrameElement);
    }
  };

  scan();

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => scan(node));
      } else if (
        mutation.type === "attributes" &&
        mutation.target instanceof HTMLIFrameElement
      ) {
        attach(mutation.target);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src", "id"],
  });

  timeoutId = window.setTimeout(() => {
    settled = true;
    cleanup();
  }, WATCH_TIMEOUT_MS);

  return () => {
    if (settled) return;
    settled = true;
    cleanup();
  };
}
