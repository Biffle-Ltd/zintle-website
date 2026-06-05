import React, { Fragment, useEffect, useMemo, useState } from "react";
import { COIN_ICON_CLASS, ZintleCoinIcon } from "./ZintleCoinIcon";
import {
  formatCountdown,
  getCoinStoreTimerEndMs,
} from "../utils/coinStoreTimer";

export const TIMER_COIN_PRODUCT_ID = "coin_100";
export const TIMER_COIN_FALLBACK_PRODUCT_ID = "coin_149";

const TIMER_COIN_PRODUCT_IDS = [
  TIMER_COIN_PRODUCT_ID,
  TIMER_COIN_FALLBACK_PRODUCT_ID,
] as const;

export function resolveTimerPack(packs: CoinStorePack[]): CoinStorePack | null {
  for (const productId of TIMER_COIN_PRODUCT_IDS) {
    const pack = packs.find((p) => p.product_id === productId);
    if (pack) return pack;
  }
  return null;
}

export type CoinStorePack = {
  id: number;
  coins: number;
  price: number;
  bonus_coins?: number;
  bonus?: number;
  product_id?: string;
  name?: string;
  icon_url?: string | null;
  is_micropack?: boolean;
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

function bonusPercentLabel(pack: CoinStorePack): string | null {
  const bonus = bonusCoins(pack);
  const base = Number(pack.coins);
  if (bonus <= 0 || base <= 0) return null;
  const pct = Math.round((bonus / base) * 100);
  if (pct <= 0) return null;
  return `${pct}% Bonus`;
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

type CoinStoreMobileProps = {
  timerPack: CoinStorePack | null;
  exclusiveDeals: CoinStorePack[];
  topPlans: CoinStorePack[];
  selectedPackageId: number | null;
  onPackSelect: (pkg: CoinStorePack, index: number) => void;
  onRecharge: () => void;
};

function LimitedOfferCard({
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
      className={`relative w-full overflow-hidden rounded-[20px] text-left transition-transform active:scale-[0.99] ${
        selected
          ? "ring-2 ring-white/80 ring-offset-2 ring-offset-[#000D26]"
          : ""
      }`}
    >
      <div className="relative bg-gradient-to-r from-[#FF5A3C] via-[#FF4D5E] to-[#FF7A52] px-4 pb-4 pt-4">
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
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex items-center gap-2.5 text-[28px] font-bold leading-none text-white">
              <ZintleCoinIcon className={COIN_ICON_CLASS} />
              <span>{formatCoins(pack.coins)}</span>
            </div>
            {bonus > 0 && (
              <span className="shrink-0 rounded border border-white/70 px-2 py-0.5 text-[11px] font-medium leading-tight text-white">
                Bonus +{formatCoins(bonus)}
              </span>
            )}
          </div>
          <span className="shrink-0 pl-2 text-xl font-bold text-white">
            {formatRupee(pack.price)}
          </span>
        </div>
      </div>
    </button>
  );
}

function ExclusiveDealCard({
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
  const badge = bonusPercentLabel(pack);

  return (
    <button
      type="button"
      onClick={onSelect}
      data-pack-index={index}
      className={`relative w-full rounded-2xl bg-[#0f1f3d] px-4 py-4 text-left transition-all active:scale-[0.99] ${
        selected ? "ring-2 ring-[#3B82F6]/80" : "ring-1 ring-white/5"
      }`}
    >
      {badge && (
        <span className="absolute left-3 top-3 rounded-md bg-[#22C55E] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          {badge}
        </span>
      )}
      <div
        className={`flex items-center justify-between ${badge ? "pt-6" : ""}`}
      >
        <div className="flex items-center gap-2 text-xl font-bold leading-none text-white">
          <ZintleCoinIcon className={COIN_ICON_CLASS} />
          <span>{formatCoins(pack.coins)}</span>
          {bonus > 0 && (
            <span className="text-sm font-semibold leading-none text-[#4ADE80]">
              +{formatCoins(bonus)}
            </span>
          )}
        </div>
        <span className="text-base font-semibold text-white">
          {formatRupee(pack.price)}
        </span>
      </div>
    </button>
  );
}

function TopPlanCard({
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
      className={`flex w-full items-center justify-between rounded-2xl bg-[#0f1f3d] px-4 py-4 text-left transition-all active:scale-[0.99] ${
        selected ? "ring-2 ring-[#3B82F6]/80" : "ring-1 ring-white/5"
      }`}
    >
      <div className="flex items-center gap-2 text-xl font-bold leading-none text-white">
        <ZintleCoinIcon className={COIN_ICON_CLASS} />
        <span>{formatCoins(pack.coins)}</span>
        {bonus > 0 && (
          <span className="text-sm font-medium leading-none text-[#7DD3FC]">
            +{formatCoins(bonus)}
          </span>
        )}
      </div>
      <span className="text-base font-semibold text-white">
        {formatRupee(pack.price)}
      </span>
    </button>
  );
}

export const CoinStoreMobile = ({
  timerPack,
  exclusiveDeals,
  topPlans,
  selectedPackageId,
  onPackSelect,
  onRecharge,
}: CoinStoreMobileProps) => {
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

  const selectedInList = selectedPackageId != null;

  return (
    <div className="flex flex-col bg-[#000D26] md:hidden">
      <main className="space-y-6 px-4 pt-4 pb-32">
        {indexedPacks.some((r) => r.kind === "timer") && timerPack && (
          <LimitedOfferCard
            pack={timerPack}
            selected={selectedPackageId === timerPack.id}
            onSelect={() => {
              const row = indexedPacks.find((r) => r.pack.id === timerPack.id);
              onPackSelect(timerPack, row?.index ?? 0);
            }}
            index={0}
          />
        )}

        {exclusiveDeals.length > 0 && (
          <section>
            <h2 className="mb-3 text-base font-bold text-white">
              Exclusive Deals
            </h2>
            <div className="space-y-3">
              {exclusiveDeals.map((pack) => {
                const row = indexedPacks.find((r) => r.pack.id === pack.id);
                const idx = row?.index ?? 0;
                return (
                  <Fragment key={pack.id}>
                    <ExclusiveDealCard
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

        {topPlans.length > 0 && (
          <section>
            <h2 className="mb-3 text-base font-bold text-white">Top Plans</h2>
            <div className="space-y-3">
              {topPlans.map((pack) => {
                const row = indexedPacks.find((r) => r.pack.id === pack.id);
                const idx = row?.index ?? 0;
                return (
                  <Fragment key={pack.id}>
                    <TopPlanCard
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

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#000D26]/95 px-4 pt-4 pb-4 backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={onRecharge}
          disabled={!selectedInList}
          className="mb-5 w-full rounded-full bg-gradient-to-r from-[#FF4B7A] via-[#FF5E4D] to-[#FF8A3D] py-4 text-base font-bold text-white shadow-lg shadow-[#FF5E4D]/30 transition-opacity hover:opacity-95 disabled:opacity-40"
        >
          Recharge Now
        </button>
      </div>
    </div>
  );
};
