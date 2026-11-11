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
  onSelect,
}: FreeTrialOfferCardProps) {
  const isBiffle = brand === "biffle";
  const price = formatRupee(trial.trialAmount, isBiffle);
  const coins = trial.trialCoins;
  // Solid border, not a left-to-right gradient. The old gradient only
  // painted white through the middle of the top and bottom, and the
  // selection ring sat outside the card where the store's overflow clips it.
  const frame = isBiffle
    ? selected
      ? "border-[#DB2777] bg-[#DB2777] shadow-[0_10px_24px_rgba(219,39,119,0.32)]"
      : "border-[#F9A8D4] bg-[#F9A8D4] shadow-[0_8px_20px_rgba(219,39,119,0.22)]"
    : selected
      ? "border-white bg-white shadow-[0_10px_28px_rgba(251,191,36,0.42)]"
      : "border-[#FDE68A] bg-[#FDE68A] shadow-[0_8px_20px_rgba(244,63,94,0.28)]";
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
      onClick={() => onSelect(freeTrialToStorePack(trial))}
      className={`relative w-full overflow-hidden rounded-[24px] border-[3px] border-solid text-left transition-transform active:scale-[0.98] ${frame}`}
    >
      <div className={`relative overflow-hidden rounded-[21px] px-4 py-3.5 ${fill}`}>
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
