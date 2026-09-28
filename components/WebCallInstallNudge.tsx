import React from "react";
import { isBiffleOrganisationId } from "../utils/organisationIdFromUrl";

export const INSTALL_NUDGE_COPY =
  "across 5+ languages, install app and get first call free.";

const BIFFLE_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=ai.biffle";
const ZINTLE_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=ai.zintle";

const SCREEN_GRADIENT =
  "linear-gradient(180deg, #B44CFF 0%, #C45BFF 32%, #D478FF 62%, #E8A8FF 100%)";
const CTA_GRADIENT = "linear-gradient(90deg, #ED67FF 2.08%, #821DFC 100%)";
const COUNT_GRADIENT =
  "linear-gradient(90deg, #FFC4B0 0%, #FFE6F2 38%, #FFFFFF 52%, #E4D2FF 100%)";

const STATS = [
  {
    src: "/web-call/install-icon-languages.png",
    alt: "Languages",
    lines: ["5+", "languages"],
  },
  {
    src: "/web-call/install-icon-creators.png",
    alt: "Creators",
    lines: ["1000+", "Creators"],
  },
  {
    src: "/web-call/install-icon-call.png",
    alt: "First call",
    lines: ["1st Call", "Free"],
  },
] as const;

function Sparkle({
  className,
  size,
}: {
  className?: string;
  size: number;
}) {
  return (
    <svg
      aria-hidden
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M12 0.8C12.4 6.4 17.6 11.6 23.2 12C17.6 12.4 12.4 17.6 12 23.2C11.6 17.6 6.4 12.4 0.8 12C6.4 11.6 11.6 6.4 12 0.8Z"
        fill="white"
        fillOpacity="0.92"
      />
    </svg>
  );
}

export function WebCallInstallNudge({
  organisationId,
  variant,
}: {
  organisationId: string;
  variant: "pending" | "ended" | "unconnected" | "purchased";
}) {
  const title =
    variant === "purchased"
      ? "Install the app to start calling"
      : variant === "pending"
        ? "Payment pending"
        : variant === "ended"
          ? "Call ended"
          : "Call didn't connect";

  const playStoreUrl = isBiffleOrganisationId(organisationId)
    ? BIFFLE_PLAY_STORE_URL
    : ZINTLE_PLAY_STORE_URL;

  return (
    <div className="relative flex h-dvh min-h-dvh flex-col overflow-hidden font-figtree text-white">
      <h1 className="sr-only">{title}</h1>
      <div
        className="absolute inset-0"
        style={{ background: SCREEN_GRADIENT }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.85) 0.85px, transparent 1.25px)",
          backgroundSize: "7px 7px",
        }}
      />

      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full min-w-0 max-w-md flex-col overflow-x-hidden">
        <div className="relative mx-auto mt-[max(0.35rem,env(safe-area-inset-top))] min-h-0 w-full flex-1 overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[6%] h-[92%] w-[88%] -translate-x-1/2 rounded-[50%] opacity-80"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(255,220,255,0.5) 0%, rgba(196,91,255,0) 70%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-[4%] top-[10%] h-[78%] w-[92%] rotate-[-16deg] rounded-[50%] border border-white/35"
          />
          <Sparkle
            size={22}
            className="absolute left-[11%] top-[6%] drop-shadow-[0_0_8px_rgba(255,255,255,0.75)]"
          />
          <Sparkle
            size={16}
            className="absolute right-[14%] top-[4%] drop-shadow-[0_0_8px_rgba(255,255,255,0.75)]"
          />
          <Sparkle
            size={14}
            className="absolute right-[7%] top-[42%] drop-shadow-[0_0_8px_rgba(255,255,255,0.75)]"
          />
          <img
            src="/web-call/install-hero.png"
            alt=""
            width={242}
            height={328}
            className="absolute inset-x-0 bottom-0 z-1 mx-auto h-[108%] w-auto origin-bottom object-contain object-bottom"
            style={{
              WebkitMaskImage:
                "linear-gradient(to bottom, #000 68%, transparent 100%)",
              maskImage:
                "linear-gradient(to bottom, #000 68%, transparent 100%)",
            }}
          />
          <Sparkle
            size={18}
            className="absolute bottom-[22%] left-[9%] z-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.75)]"
          />
          <Sparkle
            size={22}
            className="absolute bottom-[10%] right-[10%] z-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.75)]"
          />
        </div>

        <div className="relative z-10 -mt-20 flex shrink-0 flex-col items-center px-6 text-center">
          <p className="text-[clamp(28px,9vw,36px)] font-extrabold leading-none tracking-tight">
            Explore
          </p>
          <p
            className="bg-clip-text text-[clamp(52px,17vw,68px)] font-extrabold leading-[0.92] tracking-tight text-transparent"
            style={{ backgroundImage: COUNT_GRADIENT }}
          >
            1000+
          </p>
          <p className="text-[clamp(26px,8vw,32px)] font-extrabold leading-none tracking-tight">
            more creators
          </p>

          <p className="mt-4 w-full max-w-72 rounded-full bg-white/18 px-5 py-3 text-[14px] font-medium leading-snug text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)] backdrop-blur-[2px]">
            {INSTALL_NUDGE_COPY}
          </p>

          <div className="mt-6 flex w-full max-w-80 items-start justify-between gap-2 px-1">
            {STATS.map((stat) => (
              <div
                key={stat.alt}
                className="flex min-w-0 flex-1 flex-col items-center gap-2.5"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/75 bg-white/10">
                  <img
                    src={stat.src}
                    alt=""
                    className="h-7 w-7 object-contain brightness-0 invert"
                  />
                </div>
                <p className="text-[12px] font-semibold leading-tight text-white">
                  {stat.lines[0]}
                  <br />
                  {stat.lines[1]}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto w-full shrink-0 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
          <a
            href={playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 w-full items-center justify-center rounded-full text-[16px] font-semibold text-white shadow-[0_12px_28px_rgba(126,34,206,0.38)]"
            style={{ background: CTA_GRADIENT }}
          >
            Install App Now
          </a>
        </div>
      </div>
    </div>
  );
}
