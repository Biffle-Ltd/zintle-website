const EASEBUZZ_SRC =
  "https://ebz-static.s3.ap-south-1.amazonaws.com/easecheckout/v2.0.0/easebuzz-checkout-v2.min.js";
const PHONEPE_SRC = "https://mercury.phonepe.com/web/bundle/checkout.js";
const LOAD_TIMEOUT_MS = 15_000;

const scriptLoads = new Map<string, Promise<void>>();

function findCheckoutScript(src: string): HTMLScriptElement | null {
  const scripts = document.getElementsByTagName("script");
  for (let i = 0; i < scripts.length; i++) {
    const el = scripts[i];
    if (el.getAttribute("src") === src || el.src === src) return el;
  }
  return null;
}

function isCheckoutSdkReady(src: string): boolean {
  if (src === EASEBUZZ_SRC) return Boolean(window.EasebuzzCheckout);
  if (src === PHONEPE_SRC) return Boolean(window.PhonePeCheckout?.transact);
  return false;
}

function loadExternalScript(src: string): Promise<void> {
  const existing = scriptLoads.get(src);
  if (existing) return existing;

  const load = new Promise<void>((resolve, reject) => {
    let settled = false;

    const settleOk = (script: HTMLScriptElement | null) => {
      if (settled) return;
      settled = true;
      script?.setAttribute("data-znw-loaded", "1");
      resolve();
    };

    const settleErr = (script: HTMLScriptElement | null) => {
      if (settled) return;
      settled = true;
      scriptLoads.delete(src);
      script?.remove();
      reject(new Error(`Failed to load checkout script: ${src}`));
    };

    const timer = window.setTimeout(() => {
      const script = findCheckoutScript(src);
      if (isCheckoutSdkReady(src)) {
        settleOk(script);
        return;
      }
      settleErr(script);
    }, LOAD_TIMEOUT_MS);

    const wrapOk = (script: HTMLScriptElement | null) => {
      window.clearTimeout(timer);
      settleOk(script);
    };
    const wrapErr = (script: HTMLScriptElement | null) => {
      window.clearTimeout(timer);
      settleErr(script);
    };

    const already = findCheckoutScript(src);
    if (already) {
      if (
        already.getAttribute("data-znw-loaded") === "1" ||
        isCheckoutSdkReady(src)
      ) {
        wrapOk(already);
        return;
      }
      already.addEventListener("load", () => wrapOk(already), { once: true });
      already.addEventListener("error", () => wrapErr(already), { once: true });
      // load may already have fired before we attached listeners.
      window.setTimeout(() => {
        if (!settled && isCheckoutSdkReady(src)) wrapOk(already);
      }, 0);
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => wrapOk(script);
    script.onerror = () => wrapErr(script);
    document.head.appendChild(script);
  });

  scriptLoads.set(src, load);
  return load;
}

async function ensureCheckoutScript(
  src: string,
  isReady: () => boolean,
  sdkName: string,
): Promise<void> {
  if (isReady()) return;
  await loadExternalScript(src);
  if (isReady()) return;
  scriptLoads.delete(src);
  findCheckoutScript(src)?.remove();
  throw new Error(`${sdkName} checkout script loaded but SDK is missing`);
}

export function loadEasebuzzCheckoutScript(): Promise<void> {
  return ensureCheckoutScript(
    EASEBUZZ_SRC,
    () => Boolean(typeof window !== "undefined" && window.EasebuzzCheckout),
    "Easebuzz",
  );
}

export function loadPhonePeCheckoutScript(): Promise<void> {
  return ensureCheckoutScript(
    PHONEPE_SRC,
    () =>
      Boolean(
        typeof window !== "undefined" && window.PhonePeCheckout?.transact,
      ),
    "PhonePe",
  );
}
