import React from "react";
import { BIFFLE_COIN_ICON_CLASS, BiffleCoinIcon } from "./BiffleCoinIcon";
import { COIN_ICON_CLASS, ZintleCoinIcon } from "./ZintleCoinIcon";
import {
  freeTrialThenLabel,
  freeTrialToStorePack,
  type VisibleFreeTrial,
} from "../utils/freeTrialOffer";
import type { CoinStorePack } from "./CoinStoreMobile";

type FreeTrialOfferCardProps = {
  trial: VisibleFreeTrial;
  brand: "biffle" | "zintle";
  selected: boolean;
  disabled?: boolean;
  onSelect: (pack: CoinStorePack) => void;
};

function formatRupee(amount: number, spaced: boolean): string {
  const body = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return spaced ? `₹ ${body}` : `₹${body}`;
}

export function FreeTrialOfferCard({
  trial,
  brand,
  selected,
  disabled = false,
  onSelect,
}: FreeTrialOfferCardProps) {
  const isBiffle = brand === "biffle";
  const price = formatRupee(trial.trialAmount, isBiffle);
  const coins = trial.trialCoins;
  const frame = isBiffle
    ? selected
      ? "bg-gradient-to-r from-white via-[#FBCFE8] to-white shadow-[0_12px_28px_rgba(219,39,119,0.35)] ring-2 ring-green-500"
      : "bg-gradient-to-r from-[#F9A8D4] via-white to-[#FB7185] shadow-[0_8px_24px_rgba(219,39,119,0.28)]"
    : selected
      ? "bg-gradient-to-r from-[#FDE68A] via-white to-[#FBBF24] shadow-[0_12px_32px_rgba(251,191,36,0.48)] ring-2 ring-white/90 ring-offset-2 ring-offset-[#000D26]"
      : "bg-gradient-to-r from-[#FCD34D] via-[#FB7185] to-[#FDE68A] shadow-[0_8px_22px_rgba(244,63,94,0.32)]";
  const fill = isBiffle
    ? "bg-gradient-to-br from-[#BE185D] via-[#DB2777] to-[#F97316]"
    : "bg-gradient-to-br from-[#7F1D1D] via-[#F43F5E] to-[#FBBF24]";
  const badge = isBiffle
    ? "bg-white text-[#BE185D]"
    : "bg-[#FDE68A] text-[#7F1D1D]";

  return (
    <button
      type="button"
      data-testid="free-trial-offer"
      disabled={disabled}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (disabled) return;
        onSelect(freeTrialToStorePack(trial));
      }}
      className={`relative w-full rounded-[24px] p-[2.5px] text-left transition-transform ${
        disabled ? "cursor-not-allowed opacity-60" : "active:scale-[0.98]"
      } ${frame}`}
    >
      <div className={`relative overflow-hidden rounded-[22px] px-4 py-3.5 ${fill}`}>
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_28%,rgba(255,255,255,0.28)_46%,transparent_62%)]"
          aria-hidden
        />
        <div className="relative z-[1] flex items-center justify-between gap-3">
          <p className="text-[15px] font-extrabold tracking-wide text-white">
            Free trial
          </p>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-sm ${badge}`}
          >
            Best offer
          </span>
        </div>
        <div className="relative z-[1] mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/25 bg-black/20 px-4 py-3">
          <div className="flex items-center gap-2 text-[28px] font-extrabold leading-none text-white">
            {coins != null && coins > 0 && (
              <>
                {isBiffle ? (
                  <BiffleCoinIcon className={BIFFLE_COIN_ICON_CLASS} />
                ) : (
                  <ZintleCoinIcon className={COIN_ICON_CLASS} />
                )}
                <span>{coins}</span>
              </>
            )}
          </div>
          <span
            className={`shrink-0 rounded-xl bg-white px-3.5 py-2 text-xl font-extrabold tabular-nums shadow-[0_4px_12px_rgba(0,0,0,0.18)] ${
              isBiffle ? "text-[#BE185D]" : "text-[#9F1239]"
            }`}
          >
            {price}
          </span>
        </div>
        <p className="relative z-[1] mt-2.5 text-left text-[12px] font-semibold leading-snug text-white">
          {freeTrialThenLabel(trial)}
        </p>
      </div>
    </button>
  );
}
