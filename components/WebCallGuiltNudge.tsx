import React, { useEffect, useRef, useState } from "react";

/** Template clip until a creator-specific 15s asset is wired. */
export const WEB_CALL_GUILT_CLIP_URL =
  "https://d3gao7f0o4i01l.cloudfront.net/Bifflecompressed.mp4";
const CLIP_SECONDS = 15;
const CTA_GRADIENT = "linear-gradient(90deg, #ED67FF 2.08%, #821DFC 100%)";

export function WebCallGuiltNudge({
  amountLabel,
  stayLabel,
  onStay,
  posterUrl,
}: {
  amountLabel: string;
  stayLabel: string;
  onStay: () => void;
  posterUrl?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [needsTap, setNeedsTap] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    el.setAttribute("playsinline", "true");
    el.setAttribute("webkit-playsinline", "true");
    el.disablePictureInPicture = true;

    const stopAtClipEnd = () => {
      if (el.currentTime >= CLIP_SECONDS) {
        el.pause();
        el.currentTime = CLIP_SECONDS;
      }
    };
    el.addEventListener("timeupdate", stopAtClipEnd);

    const tryPlay = (muted: boolean) => {
      el.muted = muted;
      return el.play();
    };

    void tryPlay(false).catch(() => {
      void tryPlay(true).then(
        () => setNeedsTap(true),
        () => setNeedsTap(true),
      );
    });

    return () => {
      el.removeEventListener("timeupdate", stopAtClipEnd);
      el.pause();
    };
  }, []);

  const playWithSound = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    void el.play().then(
      () => setNeedsTap(false),
      () => {},
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex h-dvh max-h-dvh w-full min-w-0 flex-col overflow-hidden overscroll-none bg-black">
      <div
        className="relative min-h-0 min-w-0 w-full flex-1"
        onClick={playWithSound}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            playWithSound();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={needsTap ? "Play with sound" : "Replay clip"}
      >
        <video
          ref={videoRef}
          src={WEB_CALL_GUILT_CLIP_URL}
          poster={posterUrl}
          className="h-full w-full object-cover"
          playsInline
          disablePictureInPicture
          autoPlay
          preload="auto"
        />
        {needsTap ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/35">
            <span className="rounded-full bg-white/90 px-5 py-3 text-sm font-semibold text-neutral-900">
              Tap for sound
            </span>
          </span>
        ) : null}
      </div>
      <div className="w-full min-w-0 shrink-0 bg-gradient-to-t from-black via-black/85 to-transparent px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
        <p className="w-full text-center text-[18px] font-semibold leading-snug text-white">
          Wait — they were just
          <br />
          about to pick up
        </p>
        <p className="mt-1 text-center text-[14px] text-white/80">
          Stay and take the {amountLabel} call.
        </p>
        <button
          type="button"
          onClick={onStay}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-full text-[16px] font-semibold text-white transition-opacity duration-150 active:opacity-60"
          style={{ background: CTA_GRADIENT }}
        >
          {stayLabel}
        </button>
      </div>
    </div>
  );
}
