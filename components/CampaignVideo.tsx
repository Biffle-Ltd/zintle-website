import React, { useCallback, useEffect, useRef, useState } from "react";
import type { MediaPlayerClass } from "dashjs";
import { isDashManifestUrl } from "../utils/isDashManifestUrl";

type Props = {
  src: string;
  className?: string;
  playsInline?: boolean;
  muted?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  preload?: "none" | "metadata" | "auto";
};

const PLAY_PAUSE_CONTROL_HIDE_MS = 2000;

/**
 * Progressive URLs (e.g. .mp4, .webm) use the native video element.
 * DASH manifests (.mpd) use dash.js (MSE); see https://github.com/Dash-Industry-Forum/dash.js
 */
export function CampaignVideo({
  src,
  className,
  playsInline = true,
  muted: mutedProp = false,
  loop = true,
  autoPlay = true,
  preload = "metadata",
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const dashPlayerRef = useRef<MediaPlayerClass | null>(null);
  const hasUnmutedViaGesture = useRef(false);
  const hidePlayPauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const useDash = isDashManifestUrl(src);

  const [isMuted, setIsMuted] = useState(mutedProp);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [showPlayPauseControl, setShowPlayPauseControl] = useState(false);

  const applyMute = useCallback((next: boolean) => {
    const el = videoRef.current;
    if (el) el.muted = next;
    try {
      dashPlayerRef.current?.setMute(next);
    } catch {
      /* ignore */
    }
    setIsMuted(next);
    if (!next) hasUnmutedViaGesture.current = true;
  }, []);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => {});
    else el.pause();
  }, []);

  const revealPlayPauseControl = useCallback(() => {
    setShowPlayPauseControl(true);
    if (hidePlayPauseTimerRef.current) {
      clearTimeout(hidePlayPauseTimerRef.current);
    }
    hidePlayPauseTimerRef.current = setTimeout(() => {
      setShowPlayPauseControl(false);
      hidePlayPauseTimerRef.current = null;
    }, PLAY_PAUSE_CONTROL_HIDE_MS);
  }, []);

  const handleVideoSurfaceClick = useCallback(() => {
    if (!hasUnmutedViaGesture.current && isMuted) {
      applyMute(false);
      return;
    }
    togglePlay();
    revealPlayPauseControl();
  }, [applyMute, isMuted, togglePlay, revealPlayPauseControl]);

  const playPauseControlVisible = !isPlaying || showPlayPauseControl;

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    applyMute(!isMuted);
  };

  useEffect(() => {
    hasUnmutedViaGesture.current = false;
    setIsMuted(mutedProp);
    setShowPlayPauseControl(false);
    if (hidePlayPauseTimerRef.current) {
      clearTimeout(hidePlayPauseTimerRef.current);
      hidePlayPauseTimerRef.current = null;
    }
  }, [src, mutedProp]);

  useEffect(() => {
    return () => {
      if (hidePlayPauseTimerRef.current) {
        clearTimeout(hidePlayPauseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = isMuted;
    try {
      dashPlayerRef.current?.setMute(isMuted);
    } catch {
      /* ignore */
    }
  }, [isMuted]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !src.trim()) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);

    const teardownDash = () => {
      if (dashPlayerRef.current) {
        try {
          dashPlayerRef.current.destroy();
        } catch {
          /* ignore */
        }
        dashPlayerRef.current = null;
      }
    };

    const clearNativeSrc = () => {
      el.removeAttribute("src");
      el.load();
    };

    const kickPlay = () => {
      void el.play().catch(() => {});
    };

    const attachPlayWhenReady = () => {
      if (!autoPlay) return () => {};
      if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        kickPlay();
        return () => {};
      }
      el.addEventListener("canplay", kickPlay, { once: true });
      return () => el.removeEventListener("canplay", kickPlay);
    };

    if (isDashManifestUrl(src)) {
      teardownDash();
      clearNativeSrc();

      let cancelled = false;
      let dispose: (() => void) | undefined;
      let detachPlayWhenReady: (() => void) | undefined;

      void (async () => {
        const { MediaPlayer } = await import("dashjs");
        if (cancelled || videoRef.current !== el) return;

        el.muted = mutedProp;
        const player = MediaPlayer().create();
        dashPlayerRef.current = player;
        player.initialize(el, src, autoPlay);
        player.setMute(mutedProp);

        const onEnded = () => {
          if (!loop) return;
          try {
            player.seek(0);
            void el.play().catch(() => {});
          } catch {
            /* ignore */
          }
        };
        if (loop) el.addEventListener("ended", onEnded);

        if (autoPlay) {
          queueMicrotask(kickPlay);
          detachPlayWhenReady = attachPlayWhenReady();
        }

        dispose = () => {
          detachPlayWhenReady?.();
          if (loop) el.removeEventListener("ended", onEnded);
          try {
            player.destroy();
          } catch {
            /* ignore */
          }
          dashPlayerRef.current = null;
        };

        if (cancelled) dispose();
      })();

      return () => {
        cancelled = true;
        dispose?.();
        teardownDash();
        clearNativeSrc();
        el.removeEventListener("play", onPlay);
        el.removeEventListener("pause", onPause);
      };
    }

    teardownDash();
    el.src = src;
    el.preload = preload;
    el.muted = mutedProp;
    const detachNative = attachPlayWhenReady();

    return () => {
      detachNative();
      clearNativeSrc();
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
    };
  }, [src, autoPlay, loop, preload, mutedProp]);

  return (
    <div
      className="relative h-full w-full cursor-pointer"
      onClick={handleVideoSurfaceClick}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleVideoSurfaceClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={isPlaying ? "Pause video" : "Play video"}
    >
      <video
        ref={videoRef}
        className={className}
        playsInline={playsInline}
        muted={isMuted}
        loop={useDash ? false : loop}
        autoPlay={useDash ? false : autoPlay}
        controls={false}
        preload={preload}
        {...(useDash ? {} : { src })}
      />
      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          playPauseControlVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm sm:h-[4.5rem] sm:w-[4.5rem]">
          <i
            className={`fa-solid ${isPlaying ? "fa-pause" : "fa-play"} text-2xl ${isPlaying ? "" : "ml-1"}`}
            aria-hidden
          />
        </div>
      </div>
      <button
        type="button"
        onClick={toggleMute}
        className="absolute bottom-2.5 right-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        <i
          className={`fa-solid ${isMuted ? "fa-volume-xmark" : "fa-volume-high"} text-sm`}
          aria-hidden
        />
      </button>
    </div>
  );
}
