import React, { useEffect, useMemo, useState } from "react";
import { campaignCtaGradientStyle } from "./CampaignCta";
import { BiffleFeaturedWeeklyPlanCard } from "./BiffleFeaturedWeeklyPlanCard";
import { BIFFLE_COIN_ICON_CLASS, BiffleCoinIcon } from "./BiffleCoinIcon";
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
  if (!Number.isFinite(n)) return "₹ 0";
  return Number.isInteger(n) ? `₹ ${n}` : `₹ ${n.toFixed(2)}`;
}

function formatCoins(n: number): string {
  const v = Number(n);
  if (!Number.isFinite(v)) return "0";
  return Number.isInteger(v) ? String(v) : String(Math.round(v));
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

function BiffleLimitedOfferCard({
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
      className={`relative w-full rounded-[22px] border-2 text-left shadow-[0_8px_24px_rgba(219,39,119,0.22)] transition-transform active:scale-[0.99] ${
        selected ? "border-green-500" : "border-transparent"
      }`}
    >
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#BE185D] via-[#DB2777] to-[#F97316] px-3.5 py-3">
        <p className="relative z-[1] text-sm font-medium leading-none tracking-wide text-white">
          Limited offer
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
            <span>{formatCoins(pack.coins)}</span>
          </div>
          <span className="shrink-0 rounded-lg bg-white/25 px-3 py-1.5 text-lg font-bold tabular-nums text-white">
            {formatRupee(pack.price)}
          </span>
        </div>

        <p className="relative z-[1] mt-2 text-left text-[11px] font-medium leading-snug text-white/80">
          Grab this offer before it expires!
        </p>
      </div>
    </button>
  );
}

function BiffleWeeklyPlanCard({
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
      className={`relative w-full rounded-2xl border-2 bg-gradient-to-br from-[#E8D5FF] via-[#DDD6FE] to-[#F3E8FF] px-4 py-4 text-left transition-transform active:scale-[0.99] ${
        selected ? "border-violet-500" : "border-transparent"
      }`}
    >
      <p className="text-xs font-bold italic uppercase tracking-wide text-[#5B21B6]">
        Weekly Plan
      </p>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-2xl font-bold leading-none text-[#5B21B6]">
          <BiffleCoinIcon className={BIFFLE_COIN_ICON_CLASS} />
          <span>{plan.coin_value ?? 0}</span>
        </div>
        <span className="rounded-xl bg-violet-200/60 px-4 py-2 text-base font-semibold text-[#5B21B6]">
          {formatRupee(plan.price)}
        </span>
      </div>
    </button>
  );
}

type MicropackCardProps = {
  pack: QuickRechargePack;
  selected: boolean;
  showBestValue: boolean;
  onSelect: () => void;
};

const MicropackCard: React.FC<MicropackCardProps> = ({
  pack,
  selected,
  showBestValue,
  onSelect,
}) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex w-full flex-col items-center overflow-hidden rounded-2xl bg-[#F3F4F6] px-3 pb-3 pt-5 text-center transition-all active:scale-[0.98] ${
        selected ? "border-2 border-[#FACC15]" : "border-2 border-gray-200"
      }`}
    >
      {showBestValue && (
        <span className="absolute left-0 top-0 rounded-br-lg rounded-tl-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-2 py-0.5 text-[12px] font-bold uppercase leading-none tracking-wide text-white">
          Best value
        </span>
      )}
      <p className="mb-4 flex items-center justify-center gap-2 text-xl font-bold leading-none text-[#1F2937]">
        <BiffleCoinIcon className={BIFFLE_COIN_ICON_CLASS} />
        <span>{formatCoins(pack.coins)}</span>
      </p>
      <span className="w-full rounded-xl bg-[#E5E7EB] py-2.5 text-sm font-semibold text-[#374151]">
        {formatRupee(pack.price)}
      </span>
    </button>
  );
};

function resolveSelectedPrice(
  selectedPackageId: number | null,
  packs: QuickRechargePack[],
  weeklyPlan8: SubscriptionPlan | null,
  weeklyPlan5: SubscriptionPlan | null,
  timerPack: QuickRechargePack | null,
): number | null {
  if (selectedPackageId == null) return null;
  if (weeklyPlan8?.id === selectedPackageId) return weeklyPlan8.price;
  if (weeklyPlan5?.id === selectedPackageId) return weeklyPlan5.price;
  if (timerPack?.id === selectedPackageId) return timerPack.price;
  const match = packs.find((p) => p.id === selectedPackageId);
  return match?.price ?? null;
}

type QuickRechargePopupBiffleProps = {
  packs: QuickRechargePack[];
  selectedPackageId: number | null;
  onPackSelect: (pkg: QuickRechargePack | SubscriptionPlan, index: number) => void;
  onContinue: () => void;
  isMember: boolean;
  weeklyPlan8: SubscriptionPlan | null;
  weeklyPlan5: SubscriptionPlan | null;
  timerPack: CoinStorePack | null;
};

export const QuickRechargePopupBiffle = ({
  packs,
  selectedPackageId,
  onPackSelect,
  onContinue,
  isMember,
  weeklyPlan8,
  weeklyPlan5,
  timerPack,
}: QuickRechargePopupBiffleProps) => {
  const filteredPacks = useMemo(() => {
    if (!isMember && weeklyPlan5) {
      return packs.filter((p) => p.price !== weeklyPlan5.price);
    }
    return packs;
  }, [packs, isMember, weeklyPlan5]);

  const bestValuePackId = useMemo(() => {
    const tagged = filteredPacks.find((p) =>
      p.tag?.toLowerCase().includes("best"),
    );
    if (tagged) return tagged.id;
    const highlighted = filteredPacks.find((p) => p.highlight);
    if (highlighted) return highlighted.id;
    if (filteredPacks.length >= 2) return filteredPacks[1].id;
    return null;
  }, [filteredPacks]);

  const topRow = filteredPacks.slice(0, 2);
  const bottomRow = filteredPacks.slice(2, 3);

  const selectedPrice = resolveSelectedPrice(
    selectedPackageId,
    packs,
    weeklyPlan8,
    weeklyPlan5,
    timerPack,
  );

  return (
    <div
      className="w-full bg-white pb-6 shadow-[0_-8px_40px_rgba(0,0,0,0.12)]"
      role="dialog"
      aria-label="Top up coins"
    >
      <div className="px-5 pt-5">
      <h2 className="mb-5 text-lg font-semibold text-[#111827]">Top up coins</h2>

      <div className="max-h-[min(70vh,640px)] space-y-3 overflow-y-auto px-0.5 pb-4">
        {!isMember && weeklyPlan8 && (
          <BiffleFeaturedWeeklyPlanCard
            plan={weeklyPlan8}
            selected={selectedPackageId === weeklyPlan8.id}
            onSelect={() =>
              onPackSelect(
                {
                  id: weeklyPlan8.id,
                  coins: weeklyPlan8.coin_value ?? 0,
                  price: weeklyPlan8.price,
                } as QuickRechargePack,
                0,
              )
            }
          />
        )}

        {isMember && timerPack && (
          <BiffleLimitedOfferCard
            pack={timerPack}
            selected={selectedPackageId === timerPack.id}
            onSelect={() => onPackSelect(timerPack, 0)}
          />
        )}

        {!isMember && weeklyPlan5 && (
          <BiffleWeeklyPlanCard
            plan={weeklyPlan5}
            selected={selectedPackageId === weeklyPlan5.id}
            onSelect={() =>
              onPackSelect(
                {
                  id: weeklyPlan5.id,
                  coins: weeklyPlan5.coin_value ?? 0,
                  price: weeklyPlan5.price,
                } as QuickRechargePack,
                1,
              )
            }
          />
        )}

        {filteredPacks.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            No coin packs available right now.
          </p>
        ) : (
          <>
            {topRow.length > 0 && (
              <div className="grid grid-cols-2 gap-3 px-0.5">
                {topRow.map((pack, index) => (
                  <MicropackCard
                    key={pack.id}
                    pack={pack}
                    selected={selectedPackageId === pack.id}
                    showBestValue={pack.id === bestValuePackId}
                    onSelect={() => onPackSelect(pack, index + 2)}
                  />
                ))}
              </div>
            )}
            {bottomRow.map((pack) => (
              <div key={pack.id} className="flex justify-center px-0.5">
                <div className="w-[calc(50%-6px)]">
                  <MicropackCard
                    pack={pack}
                    selected={selectedPackageId === pack.id}
                    showBestValue={pack.id === bestValuePackId}
                    onSelect={() => onPackSelect(pack, 4)}
                  />
                </div>
              </div>
            ))}
            {filteredPacks.length > 3 && (
              <div className="grid grid-cols-2 gap-3 px-0.5">
                {filteredPacks.slice(3).map((pack, index) => (
                  <MicropackCard
                    key={pack.id}
                    pack={pack}
                    selected={selectedPackageId === pack.id}
                    showBestValue={pack.id === bestValuePackId}
                    onSelect={() => onPackSelect(pack, index + 5)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={selectedPackageId == null}
        className="w-full rounded-full py-4 text-base font-bold text-white shadow-lg shadow-violet-500/20 transition-opacity hover:opacity-95 disabled:opacity-40"
        style={campaignCtaGradientStyle(true)}
      >
        {selectedPrice != null
          ? `Continue Call for ${formatRupee(selectedPrice)}`
          : "Continue Call"}
      </button>
      </div>
    </div>
  );
};
