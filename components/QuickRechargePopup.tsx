import React, { useEffect, useMemo, useState } from "react";
import { COIN_ICON_CLASS, ZintleCoinIcon } from "./ZintleCoinIcon";
import type { CoinStorePack, SubscriptionPlan } from "./CoinStoreMobile";
import {
  formatCountdown,
  getCoinStoreTimerEndMs,
} from "../utils/coinStoreTimer";

export type QuickRechargePack = {
  id: number;
  coins: number;
  price: number;
  tag?: string;
  highlight?: boolean;
};

function formatRupee(amount: number): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "₹0";
  return Number.isInteger(n) ? `₹${n}` : `₹${n.toFixed(2)}`;
}

function formatCoinAmount(coins: number): string {
  const n = Number(coins);
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? String(n) : String(Math.round(n));
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
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ZintleLimitedOfferCard({
  pack,
  selected,
  onSelect,
}: {
  pack: QuickRechargePack;
  selected: boolean;
  onSelect: () => void;
}) {
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
      className={`relative w-full rounded-[20px] border-2 text-left transition-transform active:scale-[0.99] ${
        selected ? "border-white" : "border-transparent"
      }`}
    >
      <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-r from-[#FF5A3C] via-[#FF4D5E] to-[#FF7A52] px-4 pb-4 pt-4">
        <div
          className="pointer-events-none absolute right-3 top-3 flex items-start gap-0.5 opacity-40"
          aria-hidden
        >
          <BannerSparkleIcon className="h-8 w-8 shrink-0" />
          <BannerSparkleIcon className="h-6 w-6 shrink-0 -mt-0.5" />
        </div>

        <div className="relative z-[1] pr-12">
          <p className="text-[13px] font-semibold tracking-wide text-white">
            Limited offer
          </p>
          <div className="mt-2.5 inline-flex items-center gap-2.5 rounded-full bg-white px-4 py-2 shadow-sm">
            <i
              className="fa-solid fa-stopwatch text-[15px] text-[#0B1121]"
              aria-hidden
            />
            <span className="text-[15px] font-bold tabular-nums text-[#0B1121]">
              {formatCountdown(remainingMs)}
            </span>
          </div>
        </div>

        <div className="relative z-[1] mt-4 flex items-center justify-between rounded-2xl bg-[#00000033] px-4 py-3.5">
          <div className="flex items-center gap-2.5 text-[28px] font-bold leading-none text-white">
            <ZintleCoinIcon className={COIN_ICON_CLASS} />
            <span>{formatCoinAmount(pack.coins)}</span>
          </div>
          <span className="shrink-0 pl-2 text-xl font-bold text-white">
            {formatRupee(pack.price)}
          </span>
        </div>
      </div>
    </button>
  );
}

function ZintleFeaturedWeeklyPlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: SubscriptionPlan;
  selected: boolean;
  onSelect: () => void;
}) {
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
      className={`relative w-full rounded-[20px] border-2 text-left transition-transform active:scale-[0.99] ${
        selected ? "border-white" : "border-transparent"
      }`}
    >
      <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-r from-[#FF5A3C] via-[#FF4D5E] to-[#FF7A52] px-4 pb-4 pt-4">
        <div
          className="pointer-events-none absolute right-3 top-3 flex items-start gap-0.5 opacity-40"
          aria-hidden
        >
          <BannerSparkleIcon className="h-8 w-8 shrink-0" />
          <BannerSparkleIcon className="h-6 w-6 shrink-0 -mt-0.5" />
        </div>

        <div className="relative z-[1] pr-12">
          <p className="text-[13px] font-semibold tracking-wide text-white">
            Weekly Plan
          </p>
          <div className="mt-2.5 inline-flex items-center gap-2.5 rounded-full bg-white px-4 py-2 shadow-sm">
            <i
              className="fa-solid fa-stopwatch text-[15px] text-[#0B1121]"
              aria-hidden
            />
            <span className="text-[15px] font-bold tabular-nums text-[#0B1121]">
              {formatCountdown(remainingMs)}
            </span>
          </div>
        </div>

        <div className="relative z-[1] mt-4 flex items-center justify-between rounded-2xl bg-[#00000033] px-4 py-3.5">
          <div className="flex items-center gap-2.5 text-[28px] font-bold leading-none text-white">
            <ZintleCoinIcon className={COIN_ICON_CLASS} />
            <span>{plan.coin_value ?? 0}</span>
          </div>
          <span className="shrink-0 pl-2 text-xl font-bold text-white">
            {formatRupee(plan.price)}
          </span>
        </div>
      </div>
    </button>
  );
}

function ZintleWeeklyPlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: SubscriptionPlan;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex w-full items-center justify-between rounded-2xl border-2 bg-[#1e293b] px-4 pb-4 pt-9 text-left transition-all active:scale-[0.99] ${
        selected ? "border-white" : "border-white/10"
      }`}
    >
      <span className="absolute left-0 top-0 rounded-br-lg rounded-tl-2xl bg-[#3B82F6] px-2.5 py-1 text-[10px] font-bold uppercase leading-none tracking-wide text-white">
        Weekly Plan
      </span>
      <div className="flex items-center gap-2 text-xl font-bold leading-none text-white">
        <ZintleCoinIcon className={COIN_ICON_CLASS} />
        <span>{plan.coin_value ?? 0}</span>
      </div>
      <span className="shrink-0 text-base font-semibold leading-none text-white">
        {formatRupee(plan.price)}
      </span>
    </button>
  );
}

function MicropackCard({
  pack,
  selected,
  onSelect,
}: {
  pack: QuickRechargePack;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`box-border flex w-full min-h-[7.5rem] flex-col items-center rounded-2xl border-2 bg-[#1e293b] px-3 pb-4 pt-6 text-center transition-all active:scale-[0.98] ${
        selected ? "border-white" : "border-white/10"
      }`}
    >
      <p className="mb-4 flex items-center justify-center gap-2 text-lg font-semibold leading-none text-white">
        <ZintleCoinIcon className={COIN_ICON_CLASS} />
        <span>{formatCoinAmount(pack.coins)}</span>
      </p>
      <span className="mt-auto w-full rounded-full bg-[#ef4444] px-3 py-2.5 text-sm font-semibold leading-normal text-white">
        {formatRupee(pack.price)}
      </span>
    </button>
  );
}

function resolveSelectedPrice(
  selectedPackageId: number | null,
  packs: QuickRechargePack[],
  featuredWeeklyPlan: SubscriptionPlan | null,
  basicWeeklyPlan: SubscriptionPlan | null,
  timerPack: QuickRechargePack | null,
): number | null {
  if (selectedPackageId == null) return null;
  if (featuredWeeklyPlan?.id === selectedPackageId) return featuredWeeklyPlan.price;
  if (basicWeeklyPlan?.id === selectedPackageId) return basicWeeklyPlan.price;
  if (timerPack?.id === selectedPackageId) return timerPack.price;
  const match = packs.find((p) => p.id === selectedPackageId);
  return match?.price ?? null;
}

type QuickRechargePopupProps = {
  packs: QuickRechargePack[];
  selectedPackageId: number | null;
  onPackSelect: (pkg: QuickRechargePack | SubscriptionPlan, index: number) => void;
  onContinue: () => void;
  isMember: boolean;
  featuredWeeklyPlan: SubscriptionPlan | null;
  basicWeeklyPlan: SubscriptionPlan | null;
  timerPack: CoinStorePack | null;
};

export const QuickRechargePopup = ({
  packs,
  selectedPackageId,
  onPackSelect,
  onContinue,
  isMember,
  featuredWeeklyPlan,
  basicWeeklyPlan,
  timerPack,
}: QuickRechargePopupProps) => {
  const filteredPacks = useMemo(() => {
    let result = packs;
    if (isMember && timerPack) {
      result = result.filter((p) => p.id !== timerPack.id);
    }
    if (!isMember && basicWeeklyPlan) {
      result = result.filter((p) => p.price !== basicWeeklyPlan.price);
    }
    return result;
  }, [packs, isMember, basicWeeklyPlan, timerPack]);

  const micropackGridStartIndex =
    (isMember && timerPack ? 1 : 0) +
    (!isMember && featuredWeeklyPlan ? 1 : 0) +
    (!isMember && basicWeeklyPlan ? 1 : 0);

  const selectedPrice = resolveSelectedPrice(
    selectedPackageId,
    packs,
    featuredWeeklyPlan,
    basicWeeklyPlan,
    timerPack,
  );

  const hasOptions =
    filteredPacks.length > 0 ||
    (!isMember && (featuredWeeklyPlan || basicWeeklyPlan)) ||
    (isMember && timerPack);

  return (
    <div
      className="w-full bg-[#001A3D] px-5 pb-8 pt-5 shadow-[0_-8px_40px_rgba(0,0,0,0.45)]"
      role="dialog"
      aria-label="Quick recharge"
    >
      <h2 className="mb-5 text-left text-base font-medium text-white">
        {hasOptions ? "Tap on the plan to recharge" : "No coin packs available"}
      </h2>

      <div className="-mx-0.5 max-h-[min(70vh,640px)] space-y-3 overflow-y-auto overscroll-contain px-0.5 pb-8 pt-0.5">
        {!isMember && featuredWeeklyPlan && (
          <ZintleFeaturedWeeklyPlanCard
            plan={featuredWeeklyPlan}
            selected={selectedPackageId === featuredWeeklyPlan.id}
            onSelect={() =>
              onPackSelect(
                {
                  id: featuredWeeklyPlan.id,
                  coins: featuredWeeklyPlan.coin_value ?? 0,
                  price: featuredWeeklyPlan.price,
                } as QuickRechargePack,
                0,
              )
            }
          />
        )}

        {isMember && timerPack && (
          <ZintleLimitedOfferCard
            pack={timerPack}
            selected={selectedPackageId === timerPack.id}
            onSelect={() => onPackSelect(timerPack, 0)}
          />
        )}

        {!isMember && basicWeeklyPlan && (
          <ZintleWeeklyPlanCard
            plan={basicWeeklyPlan}
            selected={selectedPackageId === basicWeeklyPlan.id}
            onSelect={() =>
              onPackSelect(
                {
                  id: basicWeeklyPlan.id,
                  coins: basicWeeklyPlan.coin_value ?? 0,
                  price: basicWeeklyPlan.price,
                } as QuickRechargePack,
                1,
              )
            }
          />
        )}

        {filteredPacks.length === 0 ? (
          !hasOptions && (
            <div className="flex flex-col items-center rounded-2xl bg-[#1e293b] px-6 py-10 text-center">
              <div className="mb-4 flex items-center justify-center text-3xl leading-none text-white/40">
                <ZintleCoinIcon className={COIN_ICON_CLASS} />
              </div>
              <p className="text-sm text-white/70">
                There are no coin packs available right now. Please try again
                later.
              </p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-2 gap-3 p-0.5">
            {filteredPacks.map((pack, index) => {
              const isLoneLastItem =
                filteredPacks.length % 2 === 1 &&
                index === filteredPacks.length - 1;

              return (
                <div
                  key={pack.id}
                  className={
                    isLoneLastItem ? "col-span-2 mx-auto w-[calc(50%-6px)]" : ""
                  }
                >
                  <MicropackCard
                    pack={pack}
                    selected={selectedPackageId === pack.id}
                    onSelect={() =>
                      onPackSelect(pack, micropackGridStartIndex + index)
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={selectedPackageId == null}
        className="w-full rounded-full bg-gradient-to-r from-[#FF4B7A] via-[#FF5E4D] to-[#FF8A3D] py-4 text-base font-bold text-white shadow-lg shadow-[#FF5E4D]/30 transition-opacity hover:opacity-95 disabled:opacity-40"
      >
        {selectedPrice != null
          ? `Continue Call for ${formatRupee(selectedPrice)}`
          : "Continue Call"}
      </button>
    </div>
  );
};
