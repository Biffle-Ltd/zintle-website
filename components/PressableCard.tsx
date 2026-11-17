import React, { useEffect, useRef, useState } from "react";

type Ripple = { id: number; x: number; y: number; size: number };

let rippleSeq = 0;

/**
 * Card button with a press-in and a ripple at the finger. `busyLabel` covers
 * the card while a slow handoff (UPI chooser, checkout) is still opening.
 */
export function PressableCard({
  className,
  disabled = false,
  busyLabel = null,
  onClick,
  children,
}: {
  className?: string;
  disabled?: boolean;
  busyLabel?: string | null;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const timers = useRef<number[]>([]);
  const releasePress = useRef<(() => void) | null>(null);
  const busy = Boolean(busyLabel);
  const blocked = disabled || busy;

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) window.clearTimeout(timer);
      releasePress.current?.();
    };
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (blocked) return;
    if (event.pointerType !== "touch" && event.button !== 0) return;
    const button = event.currentTarget;
    button.setAttribute("data-pressed", "");
    const clear = () => {
      button.removeAttribute("data-pressed");
      window.removeEventListener("pointerup", clear, true);
      window.removeEventListener("pointercancel", clear, true);
      if (releasePress.current === clear) releasePress.current = null;
    };
    releasePress.current?.();
    releasePress.current = clear;
    window.addEventListener("pointerup", clear, true);
    window.addEventListener("pointercancel", clear, true);
    const rect = event.currentTarget.getBoundingClientRect();
    const id = ++rippleSeq;
    const ripple = {
      id,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      size: Math.hypot(rect.width, rect.height),
    };
    setRipples((current) => [...current, ripple]);
    const timer = window.setTimeout(() => {
      timers.current = timers.current.filter((item) => item !== timer);
      setRipples((current) => current.filter((item) => item.id !== id));
    }, 480);
    timers.current.push(timer);
  };

  const clearPressed = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.removeAttribute("data-pressed");
  };

  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onPointerUp={clearPressed}
      onPointerCancel={clearPressed}
      onPointerLeave={clearPressed}
      onClick={onClick}
      disabled={blocked}
      aria-busy={busy || undefined}
      className={`group relative cursor-pointer touch-manipulation select-none transition-transform duration-100 ease-out enabled:active:scale-[0.96] data-[pressed]:scale-[0.96] data-[pressed]:brightness-125 disabled:cursor-default ${
        disabled && !busy ? "opacity-60" : ""
      } ${className ?? ""}`}
    >
      {children}
      <span className="pointer-events-none absolute inset-0 z-[2] overflow-hidden rounded-[inherit]">
        <span className="absolute inset-0 bg-transparent transition-colors duration-100 group-active:bg-white/30" />
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            aria-hidden
            className="absolute animate-tap-ripple rounded-full bg-white/70"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
            }}
          />
        ))}
      </span>
      {busyLabel ? (
        <span className="absolute inset-0 z-[4] flex items-center justify-center gap-2 rounded-[inherit] bg-[#011735]/60 px-3 text-[13px] font-semibold text-white">
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <span className="truncate">{busyLabel}</span>
        </span>
      ) : null}
    </button>
  );
}
