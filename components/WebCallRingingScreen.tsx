import React, { useEffect, useState } from "react";

const SCREEN_GRADIENT =
  "linear-gradient(180deg, #8B23FC 0%, #A351FC 38%, #C77FFD 68%, #E3CBFE 100%)";
const HANGUP_RED = "#F3373A";

const RINGS = [
  { size: 284, opacity: 0.18 },
  { size: 228, opacity: 0.28 },
  { size: 172, opacity: 0.4 },
  { size: 148, opacity: 0.55 },
];

export function WebCallRingingScreen({
  name,
  photoUrl,
  statusLabel,
  onHangUp,
}: {
  name: string;
  photoUrl?: string;
  statusLabel: string;
  onHangUp: () => void;
}) {
  const initial = (name.trim().slice(0, 1) || "?").toUpperCase();
  const [photoFailed, setPhotoFailed] = useState(false);
  useEffect(() => {
    setPhotoFailed(false);
  }, [photoUrl]);
  const showPhoto = Boolean(photoUrl) && !photoFailed;

  return (
    <div
      className="relative flex min-h-dvh flex-col overflow-hidden text-white"
      style={{ background: SCREEN_GRADIENT }}
    >
      <div className="flex min-h-0 flex-1 flex-col items-center px-6 pt-[18vh]">
        <div className="relative flex h-[280px] w-[280px] items-center justify-center">
          {RINGS.map((ring, index) => (
            <span
              key={ring.size}
              aria-hidden
              className="pointer-events-none absolute rounded-full border-2 border-white"
              style={{
                width: ring.size,
                height: ring.size,
                animation: "web-call-ring 2.4s ease-in-out infinite",
                animationDelay: `${index * 0.28}s`,
                ["--ring-opacity" as string]: String(ring.opacity),
              }}
            />
          ))}
          {showPhoto ? (
            <img
              src={photoUrl}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setPhotoFailed(true)}
              className="relative z-10 h-[120px] w-[120px] rounded-full object-cover ring-2 ring-white/80"
            />
          ) : (
            <div className="relative z-10 flex h-[120px] w-[120px] items-center justify-center rounded-full bg-white/20 text-3xl font-semibold ring-2 ring-white/80">
              {initial}
            </div>
          )}
        </div>

        <p className="mt-6 text-[16px] font-normal text-white/80">{statusLabel}</p>
        <p className="mt-1 text-[28px] font-semibold leading-tight tracking-[-0.3px]">
          {name || "Creator"}
        </p>
        <div className="flex-1" />
      </div>

      <div className="flex shrink-0 justify-center pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onHangUp}
          aria-label="End call"
          className="flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: HANGUP_RED }}
        >
          <img
            src="/web-call/phone-decline.svg"
            alt=""
            className="h-7 w-7"
          />
        </button>
      </div>

      <style>{`
        @keyframes web-call-ring {
          0%, 100% { transform: scale(1); opacity: var(--ring-opacity, 0.3); }
          50% { transform: scale(1.04); opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}
