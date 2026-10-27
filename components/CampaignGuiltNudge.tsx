import React from "react";
import { CampaignPrimaryCta } from "./CampaignCta";

export function CampaignGuiltNudge({
  isBiffle,
  onStay,
  disabled = false,
}: {
  isBiffle: boolean;
  onStay: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center">
      <div
        className={`w-full max-w-md rounded-3xl px-6 py-7 shadow-2xl ${
          isBiffle ? "bg-white text-neutral-900" : "bg-[#162a44] text-white"
        }`}
      >
        <p className="text-center text-[22px] font-bold leading-snug">
          You&apos;re just one step away
        </p>
        <p
          className={`mt-2 text-center text-sm leading-snug ${
            isBiffle ? "text-neutral-600" : "text-white/75"
          }`}
        >
          Your free trial is ready. Start it before you go.
        </p>
        <div className="mt-6">
          <CampaignPrimaryCta
            isBiffle={isBiffle}
            disabled={disabled}
            onClick={onStay}
          >
            Start Free Trial
          </CampaignPrimaryCta>
        </div>
      </div>
    </div>
  );
}
