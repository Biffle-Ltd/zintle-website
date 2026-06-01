import React, { useEffect, useRef } from "react";
import type { MediaPlayerClass } from "dashjs";
import { isDashManifestUrl } from "../utils/isDashManifestUrl";

type Props = {
  src: string;
  className?: string;
  playsInline?: boolean;
  muted?: boolean;
  loop?: boolean;
  autoPlay?: boolean;
  controls?: boolean;
  preload?: "none" | "metadata" | "auto";
};

/**
 * Progressive URLs (e.g. .mp4, .webm) use the native video element.
 * DASH manifests (.mpd) use dash.js (MSE); see https://github.com/Dash-Industry-Forum/dash.js
 */
export function CampaignVideo({
  src,
  className,
  playsInline = true,
  muted = false,
  loop = true,
  autoPlay = true,
  controls = true,
  preload = "metadata",
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const dashPlayerRef = useRef<MediaPlayerClass | null>(null);
  const useDash = isDashManifestUrl(src);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !src.trim()) return;

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

        el.muted = muted;
        const player = MediaPlayer().create();
        dashPlayerRef.current = player;
        player.initialize(el, src, autoPlay);
        player.setMute(muted);

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
      };
    }

    teardownDash();
    el.src = src;
    el.preload = preload;
    el.muted = muted;
    const detachNative = attachPlayWhenReady();

    return () => {
      detachNative();
      clearNativeSrc();
    };
  }, [src, autoPlay, loop, preload, muted]);

  return (
    <video
      ref={videoRef}
      className={className}
      playsInline={playsInline}
      muted={muted}
      loop={useDash ? false : loop}
      autoPlay={useDash ? false : autoPlay}
      controls={controls}
      preload={preload}
      {...(useDash ? {} : { src })}
    />
  );
}
