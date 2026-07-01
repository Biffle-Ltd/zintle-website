import React, { useEffect, useState } from "react";
import { BIFFLE_COIN_ICON_CLASS, BiffleCoinIcon } from "./BiffleCoinIcon";
import type { SubscriptionPlan } from "./CoinStoreMobile";
import {
  formatCountdown,
  getCoinStoreTimerEndMs,
} from "../utils/coinStoreTimer";

function formatRupee(amount: number): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "₹ 0";
  return Number.isInteger(n) ? `₹ ${n}` : `₹ ${n.toFixed(2)}`;
}

function BannerSparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M1 16H31M16 31V1M8.5 8.5L23.5 23.5M8.5 23.5L23.5 8.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BannerSparkleCluster() {
  return (
    <div
      className="pointer-events-none relative mr-5 h-9 w-14 shrink-0 text-white opacity-85"
      aria-hidden
    >
      <BannerSparkleIcon className="absolute right-0 top-1 h-8 w-8" />
      <BannerSparkleIcon className="absolute right-9 top-0 h-[18px] w-[18px]" />
    </div>
  );
}

type BiffleFeaturedWeeklyPlanCardProps = {
  plan: SubscriptionPlan;
  selected: boolean;
  onSelect: () => void;
};

export function BiffleFeaturedWeeklyPlanCard({
  plan,
  selected,
  onSelect,
}: BiffleFeaturedWeeklyPlanCardProps) {
  const [endMs] = useState(() => getCoinStoreTimerEndMs());
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, endMs - Date.now()),
  );

  useEffect(() => {
    const tick = () => setRemainingMs(Math.max(0, endMs - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endMs]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full rounded-[22px] border-2 text-left shadow-[0_8px_24px_rgba(219,39,119,0.22)] transition-transform active:scale-[0.99] ${
        selected ? "border-green-500" : "border-transparent"
      }`}
    >
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#BE185D] via-[#DB2777] to-[#F97316] px-3.5 py-3">
        <p className="relative z-[1] text-sm font-medium leading-none tracking-wide text-white">
          Weekly Plan
        </p>

        <div className="relative z-[1] my-2 flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-md bg-white px-3.5 py-1.5 shadow-sm">
            <i
              className="fa-solid fa-hourglass-half text-[14px] text-amber-700/90"
              aria-hidden
            />
            <span className="text-[14px] font-bold tabular-nums tracking-tight text-[#A21CAF]">
              {formatCountdown(remainingMs)}
            </span>
          </div>
          <BannerSparkleCluster />
        </div>

        <div className="relative z-[1] flex items-center justify-between rounded-2xl border border-white/20 bg-black/15 px-4 py-2.5 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 text-[26px] font-bold leading-none text-white">
            <BiffleCoinIcon className={BIFFLE_COIN_ICON_CLASS} />
            <span>{plan.coin_value ?? 0}</span>
          </div>
          <span className="shrink-0 rounded-lg bg-white/25 px-3 py-1.5 text-lg font-bold tabular-nums text-white">
            {formatRupee(plan.price)}
          </span>
        </div>

        <p className="relative z-[1] mt-2 text-left text-[11px] font-medium leading-snug text-white/80">
          Grab this offer before it expires!
        </p>
      </div>
    </button>
  );
}
