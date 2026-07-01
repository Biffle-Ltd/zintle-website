import React, { Fragment, useEffect, useMemo, useState } from "react";
import { campaignCtaGradientStyle } from "./CampaignCta";
import { BiffleFeaturedWeeklyPlanCard } from "./BiffleFeaturedWeeklyPlanCard";
import { BIFFLE_COIN_ICON_CLASS, BiffleCoinIcon } from "./BiffleCoinIcon";
import type { CoinStorePack, SubscriptionPlan } from "./CoinStoreMobile";
import {
  formatCountdown,
  getCoinStoreTimerEndMs,
} from "../utils/coinStoreTimer";

type CoinStoreMobileBiffleProps = {
  timerPack: CoinStorePack | null;
  exclusiveDeals: CoinStorePack[];
  topPlans: CoinStorePack[];
  selectedPackageId: number | null;
  onPackSelect: (pkg: CoinStorePack, index: number) => void;
  onRecharge: () => void;
  isMember: boolean;
  featuredWeeklyPlan: SubscriptionPlan | null;
  basicWeeklyPlan: SubscriptionPlan | null;
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

function bonusCoins(pack: CoinStorePack): number {
  const b = pack.bonus_coins ?? pack.bonus ?? 0;
  return Number.isFinite(Number(b)) ? Number(b) : 0;
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

function BiffleLimitedOfferCard({
  pack,
  selected,
  onSelect,
  index,
}: {
  pack: CoinStorePack;
  selected: boolean;
  onSelect: () => void;
  index: number;
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

  const bonus = bonusCoins(pack);

  return (
    <button
      type="button"
      onClick={onSelect}
      data-pack-index={index}
      className={`relative w-full rounded-[22px] border-2 text-left shadow-[0_8px_24px_rgba(219,39,119,0.22)] transition-transform active:scale-[0.99] ${
        selected ? "border-green-500" : "border-transparent"
      }`}
    >
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#BE185D] via-[#DB2777] to-[#F97316] px-3.5 py-3">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-orange-300/20 blur-xl"
          aria-hidden
        />

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
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex items-center gap-2 text-[26px] font-bold leading-none text-white">
              <BiffleCoinIcon className={BIFFLE_COIN_ICON_CLASS} />
              <span>{formatCoins(pack.coins)}</span>
            </div>
            {bonus > 0 && (
              <span className="shrink-0 rounded-md border border-white/60 bg-white/10 px-2 py-0.5 text-[10px] font-semibold leading-tight text-white">
                +{formatCoins(bonus)}
              </span>
            )}
          </div>
          <span className="shrink-0 text-xl font-bold tabular-nums text-white">
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

function BifflePricePill({ price }: { price: number }) {
  return (
    <span className="shrink-0 rounded-lg bg-gray-200/80 px-3 py-1.5 text-sm font-semibold text-gray-700">
      {formatRupee(price)}
    </span>
  );
}

function BiffleExclusiveDealCard({
  pack,
  selected,
  onSelect,
  index,
}: {
  pack: CoinStorePack;
  selected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const bonus = bonusCoins(pack);

  return (
    <button
      type="button"
      onClick={onSelect}
      data-pack-index={index}
      className={`flex w-full items-center justify-between rounded-2xl bg-[#FFF8F0] px-4 py-4 text-left transition-all active:scale-[0.99] ${
        selected ? "ring-2 ring-[#FACC15]" : "ring-1 ring-gray-200"
      }`}
    >
      <div className="flex items-center gap-2 text-xl font-bold leading-none text-[#1F2937]">
        <BiffleCoinIcon className={BIFFLE_COIN_ICON_CLASS} />
        <span>{formatCoins(pack.coins)}</span>
        {bonus > 0 && (
          <span className="text-sm font-semibold leading-none text-emerald-600">
            +{formatCoins(bonus)}
          </span>
        )}
      </div>
      <BifflePricePill price={pack.price} />
    </button>
  );
}

function BiffleTopPlanCard({
  pack,
  selected,
  onSelect,
  index,
}: {
  pack: CoinStorePack;
  selected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const bonus = bonusCoins(pack);

  return (
    <button
      type="button"
      onClick={onSelect}
      data-pack-index={index}
      className={`flex w-full items-center justify-between rounded-2xl bg-[#F3F4F6] px-4 py-4 text-left transition-all active:scale-[0.99] ${
        selected ? "ring-2 ring-[#FACC15]" : "ring-1 ring-gray-200"
      }`}
    >
      <div className="flex items-center gap-2 text-xl font-bold leading-none text-[#1F2937]">
        <BiffleCoinIcon className={BIFFLE_COIN_ICON_CLASS} />
        <span>{formatCoins(pack.coins)}</span>
        {bonus > 0 && (
          <span className="text-sm font-medium leading-none text-sky-600">
            +{formatCoins(bonus)}
          </span>
        )}
      </div>
      <BifflePricePill price={pack.price} />
    </button>
  );
}

function resolveSelectedPrice(
  selectedPackageId: number | null,
  timerPack: CoinStorePack | null,
  exclusiveDeals: CoinStorePack[],
  topPlans: CoinStorePack[],
  featuredWeeklyPlan: SubscriptionPlan | null,
  basicWeeklyPlan: SubscriptionPlan | null,
): number | null {
  if (selectedPackageId == null) return null;
  if (featuredWeeklyPlan?.id === selectedPackageId) return featuredWeeklyPlan.price;
  if (basicWeeklyPlan?.id === selectedPackageId) return basicWeeklyPlan.price;
  const allPacks = [
    ...(timerPack ? [timerPack] : []),
    ...exclusiveDeals,
    ...topPlans,
  ];
  const match = allPacks.find((p) => p.id === selectedPackageId);
  return match?.price ?? null;
}

export const CoinStoreMobileBiffle = ({
  timerPack,
  exclusiveDeals,
  topPlans,
  selectedPackageId,
  onPackSelect,
  onRecharge,
  isMember,
  featuredWeeklyPlan,
  basicWeeklyPlan,
}: CoinStoreMobileBiffleProps) => {
  const indexedPacks = useMemo(() => {
    const rows: {
      pack: CoinStorePack;
      index: number;
      kind: "timer" | "exclusive" | "top";
    }[] = [];
    let i = 0;
    if (timerPack) rows.push({ pack: timerPack, index: i++, kind: "timer" });
    exclusiveDeals.forEach((pack) =>
      rows.push({ pack, index: i++, kind: "exclusive" }),
    );
    topPlans.forEach((pack) => rows.push({ pack, index: i++, kind: "top" }));
    return rows;
  }, [timerPack, exclusiveDeals, topPlans]);

  const selectedPrice = resolveSelectedPrice(
    selectedPackageId,
    timerPack,
    exclusiveDeals,
    topPlans,
    featuredWeeklyPlan,
    basicWeeklyPlan,
  );
  const selectedInList = selectedPackageId != null;

  return (
    <div className="flex flex-col bg-[#F5F5F5] md:hidden">
      <main className="space-y-6 px-4 pt-4 pb-32">
        {isMember && indexedPacks.some((r) => r.kind === "timer") && timerPack && (
          <BiffleLimitedOfferCard
            pack={timerPack}
            selected={selectedPackageId === timerPack.id}
            onSelect={() => {
              const row = indexedPacks.find((r) => r.pack.id === timerPack.id);
              onPackSelect(timerPack, row?.index ?? 0);
            }}
            index={0}
          />
        )}

        {!isMember && (featuredWeeklyPlan || basicWeeklyPlan) && (
          <section className="space-y-3">
            {featuredWeeklyPlan && (
              <BiffleFeaturedWeeklyPlanCard
                plan={featuredWeeklyPlan}
                selected={selectedPackageId === featuredWeeklyPlan.id}
                onSelect={() =>
                  onPackSelect(
                    {
                      id: featuredWeeklyPlan.id,
                      coins: 0,
                      price: featuredWeeklyPlan.price,
                      name: featuredWeeklyPlan.plan_name,
                    },
                    0,
                  )
                }
              />
            )}
            {basicWeeklyPlan && (
              <BiffleWeeklyPlanCard
                plan={basicWeeklyPlan}
                selected={selectedPackageId === basicWeeklyPlan.id}
                onSelect={() =>
                  onPackSelect(
                    {
                      id: basicWeeklyPlan.id,
                      coins: 0,
                      price: basicWeeklyPlan.price,
                      name: basicWeeklyPlan.plan_name,
                    },
                    1,
                  )
                }
              />
            )}
          </section>
        )}

        {(() => {
          const filteredDeals =
            !isMember && basicWeeklyPlan
              ? exclusiveDeals.filter((p) => p.price !== basicWeeklyPlan.price)
              : exclusiveDeals;
          return (
            filteredDeals.length > 0 && (
              <section>
                <h2 className="mb-3 text-base font-bold text-[#1F2937]">
                  Exclusive Deals
                </h2>
                <div className="space-y-3">
                  {filteredDeals.map((pack) => {
                    const row = indexedPacks.find((r) => r.pack.id === pack.id);
                    const idx = row?.index ?? 0;
                    return (
                      <Fragment key={pack.id}>
                        <BiffleExclusiveDealCard
                          pack={pack}
                          selected={selectedPackageId === pack.id}
                          onSelect={() => onPackSelect(pack, idx)}
                          index={idx}
                        />
                      </Fragment>
                    );
                  })}
                </div>
              </section>
            )
          );
        })()}

        {topPlans.length > 0 && (
          <section>
            <h2 className="mb-3 text-base font-bold text-[#1F2937]">
              Top Plans
            </h2>
            <div className="space-y-3">
              {topPlans.map((pack) => {
                const row = indexedPacks.find((r) => r.pack.id === pack.id);
                const idx = row?.index ?? 0;
                return (
                  <Fragment key={pack.id}>
                    <BiffleTopPlanCard
                      pack={pack}
                      selected={selectedPackageId === pack.id}
                      onSelect={() => onPackSelect(pack, idx)}
                      index={idx}
                    />
                  </Fragment>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 px-4 pt-4 pb-4 backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={onRecharge}
          disabled={!selectedInList}
          className="mb-5 w-full rounded-full py-4 text-base font-bold text-white shadow-lg shadow-violet-500/20 transition-opacity hover:opacity-95 disabled:opacity-40"
          style={campaignCtaGradientStyle(true)}
        >
          {selectedPrice != null
            ? `Pay ${formatRupee(selectedPrice)}`
            : "Pay"}
        </button>
      </div>
    </div>
  );
};
