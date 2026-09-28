import React from "react";
import { isBiffleOrganisationId } from "../utils/organisationIdFromUrl";

export const INSTALL_NUDGE_COPY =
  "Explore 1000+ more creators across 5+ languages, install the app and get the first call free.";

const BIFFLE_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=ai.biffle";
const ZINTLE_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=ai.zintle";

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
    <div className="flex flex-col items-center text-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      {variant === "unconnected" && (
        <p className="mt-3 text-sm opacity-80">
          Install the app and get your first call free.
        </p>
      )}
      <p className="mt-3 text-sm opacity-80">{INSTALL_NUDGE_COPY}</p>
      <a
        href={playStoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-10 w-full rounded-full py-3 font-semibold text-white"
        style={{ background: "linear-gradient(90deg, #7c3aed, #ec4899)" }}
      >
        Install the app
      </a>
    </div>
  );
}
