/** Hold the pressed fade long enough that a phone tap is visible. */
const TAP_FADE_HOLD_MS = 180;

function pressableFromEvent(event: Event): HTMLElement | null {
  const target = event.target;
  if (!(target instanceof Element)) return null;
  const el = target.closest("button, a");
  if (!(el instanceof HTMLElement)) return null;
  if (el instanceof HTMLButtonElement && el.disabled) return null;
  if (el.getAttribute("aria-disabled") === "true") return null;
  return el;
}

/**
 * Campaign / m-web call buttons. :active is too brief on phones, and iOS
 * often skips it unless the press is tracked. Keep a short fade after lift.
 */
export function installTapFadeFeedback(): void {
  let pressed: HTMLElement | null = null;
  let holdTimer = 0;

  const clearHold = () => {
    if (holdTimer) window.clearTimeout(holdTimer);
    holdTimer = 0;
  };

  const unpress = (el: HTMLElement | null) => {
    if (!el) return;
    el.classList.remove("is-pressed");
  };

  const release = () => {
    if (!pressed) return;
    const el = pressed;
    clearHold();
    holdTimer = window.setTimeout(() => {
      unpress(el);
      if (pressed === el) pressed = null;
    }, TAP_FADE_HOLD_MS);
  };

  document.addEventListener(
    "pointerdown",
    (event) => {
      if (!document.documentElement.classList.contains("znw-campaign-lock")) {
        return;
      }
      const el = pressableFromEvent(event);
      if (!el) return;
      clearHold();
      if (pressed && pressed !== el) unpress(pressed);
      pressed = el;
      el.classList.add("is-pressed");
    },
    true,
  );
  document.addEventListener("pointerup", release, true);
  document.addEventListener("pointercancel", release, true);
}
