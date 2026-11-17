import React, { useEffect, useMemo, useState } from "react";
import { ZintleCoinIcon } from "./ZintleCoinIcon";
import { getCoinStoreTimerEndMs } from "../utils/coinStoreTimer";
import {
  comparePackPrice,
  packCardFigures,
  splitCoinStoreOffers,
} from "../utils/coinStoreOffer";
import { weeklyPlanToStorePack } from "../utils/coinStoreVisiblePacks";
import { freeTrialToStorePack, type VisibleFreeTrial } from "../utils/freeTrialOffer";

export const TIMER_COIN_PRODUCT_ID = "coin_100";
export const TIMER_COIN_FALLBACK_PRODUCT_ID = "coin_149";

const TIMER_COIN_PRODUCT_IDS = [
  TIMER_COIN_PRODUCT_ID,
  TIMER_COIN_FALLBACK_PRODUCT_ID,
] as const;

const STORE_FONT = '"Instrument Sans", ui-sans-serif, system-ui, sans-serif';

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
  /** Paid coins when the catalog separates them from `coins`. */
  base_coins?: number;
  /** Backend bonus percent. Displayed as sent. */
  bonus_percent?: number;
  product_id?: string;
  name?: string;
  icon_url?: string | null;
  is_micropack?: boolean;
  color?: string;
  tag?: string;
  highlight?: boolean;
};

export type SubscriptionPlan = {
  id: number;
  plan_name: string;
  plan_description?: string;
  price: number;
  plan_duration: number;
  coin_value?: number;
  subscription_id?: string;
};

function formatRupee(amount: number): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "₹0";
  return Number.isInteger(n) ? `₹${n}` : `₹${n.toFixed(2)}`;
}

function formatCoins(n: number): string {
  const v = Number(n);
  if (!Number.isFinite(v)) return "0";
  return Number.isInteger(v) ? String(v) : String(Math.round(v));
}

function formatBalance(balance: number): string {
  if (!Number.isFinite(balance)) return "0";
  return Number.isInteger(balance) ? String(balance) : String(Math.round(balance));
}

type CoinStoreMobileProps = {
  timerPack: CoinStorePack | null;
  exclusiveDeals: CoinStorePack[];
  topPlans: CoinStorePack[];
  selectedPackageId: number | null;
  onPackSelect: (pkg: CoinStorePack, index: number) => void;
  onRecharge: (pkg?: CoinStorePack) => void;
  isMember: boolean;
  featuredWeeklyPlan: SubscriptionPlan | null;
  basicWeeklyPlan: SubscriptionPlan | null;
  freeTrial?: VisibleFreeTrial | null;
  paymentInProgress?: boolean;
  /** Wallet balance. Rendered once, at the top left. */
  coinBalance?: number | null;
  /** Balance and Help both open coin history for now. */
  onOpenCoinHistory?: (source: "coin_balance" | "help") => void;
};

type PackTone = "starter" | "highlight" | "plain";

function HelpIcon() {
  return (
    <svg
      viewBox="0 0 18 18"
      className="h-[18px] w-[18px] shrink-0"
      fill="none"
      aria-hidden
    >
      <circle cx="9" cy="9" r="7.25" stroke="white" strokeWidth="1.5" />
      <path
        d="M7.1 7.05a1.9 1.9 0 1 1 2.55 1.78c-.45.18-.75.5-.75.97V10.2"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="9" cy="12.35" r="0.75" fill="white" />
    </svg>
  );
}

function useOfferClock(): { hours: string; minutes: string } {
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

  const total = Math.floor(remainingMs / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return { hours: pad(hours), minutes: pad(minutes) };
}

function PackRow({
  pack,
  tone,
  disabled,
  showOffer = true,
  onBuy,
}: {
  pack: CoinStorePack;
  tone: PackTone;
  disabled: boolean;
  showOffer?: boolean;
  onBuy: () => void;
}) {
  const figures = showOffer
    ? packCardFigures(pack)
    : { coins: pack.coins, free: 0, percent: null };
  const bonus = figures.free;
  const percent = figures.percent;
  const starter = tone === "starter";
  const plain = tone === "plain";

  return (
    <button
      type="button"
      onClick={onBuy}
      disabled={disabled}
      className={`flex min-h-[52px] w-full touch-manipulation items-center justify-between text-left transition-transform active:scale-[0.99] disabled:opacity-60 ${
        starter
          ? "rounded-[16px] bg-[rgba(94,216,106,0.12)] px-3 pb-3 pt-2"
          : tone === "highlight"
            ? "rounded-[16px] bg-[rgba(255,112,0,0.11)] px-3 pb-3 pt-2"
            : "rounded-[10px] bg-[rgba(10,37,72,0.3)] px-3 pb-3 pt-2"
      }`}
    >
      <span className={`flex min-w-0 flex-col ${plain ? "gap-1" : "gap-2"}`}>
        {percent != null && (
          <span
            className={`inline-flex w-fit rounded-[3px] px-1.5 py-[5px] text-[10px] font-medium leading-[1.15] ${
              starter
                ? "bg-[#00201A] text-[#5ED86A]"
                : "bg-[#191700] text-[#E6A433]"
            }`}
          >
            {percent}% bonus
          </span>
        )}
        <span
          className={`flex min-w-0 items-center ${plain ? "gap-[5px]" : "gap-[7px]"}`}
        >
          <span className="flex shrink-0 items-center gap-0.5">
            <ZintleCoinIcon size={24} className="h-6 w-6 shrink-0" />
            <span className="whitespace-nowrap text-[16px] font-semibold leading-5 text-white">
              {formatCoins(figures.coins)}
            </span>
          </span>
          {bonus > 0 && (
            <span
              className={`truncate font-normal leading-[1.15] text-[#E6A433] ${
                plain ? "text-[10px]" : "text-[10.2px]"
              }`}
            >
              +{formatCoins(bonus)} Free coins
            </span>
          )}
        </span>
      </span>
      <span
        className={`ml-3 inline-flex h-7 min-w-[63px] shrink-0 items-center justify-center whitespace-nowrap rounded-full px-4 text-[14px] font-semibold leading-[1.15] text-black ${
          starter ? "bg-[#5ED86A]" : "bg-[#FEFFFF]"
        }`}
      >
        {formatRupee(pack.price)}
      </span>
    </button>
  );
}

function TrialBanner({
  trial,
  disabled,
  onBuy,
}: {
  trial: VisibleFreeTrial;
  disabled: boolean;
  onBuy: () => void;
}) {
  const clock = useOfferClock();
  const coins = trial.trialCoins;
  const title =
    coins != null && coins > 0
      ? `Trial Pack - ${formatCoins(coins)} Coins for ${formatRupee(trial.trialAmount)}`
      : `Trial Pack for ${formatRupee(trial.trialAmount)}`;

  return (
    <button
      type="button"
      onClick={onBuy}
      disabled={disabled}
      className="relative min-h-[72px] w-full touch-manipulation overflow-hidden rounded-[16px] bg-[linear-gradient(92.74deg,#F4486E_2.28%,#FF7000_94.35%)] px-4 pb-2 pt-[7px] text-center text-white transition-transform active:scale-[0.99] disabled:opacity-60"
    >
      <ZintleCoinIcon
        size={78}
        className="pointer-events-none absolute -left-4 top-1 h-[78px] w-[74px] -rotate-[15deg] opacity-90"
      />
      <ZintleCoinIcon
        size={90}
        className="pointer-events-none absolute -right-3 -top-1 h-[96px] w-[90px] rotate-[20deg] opacity-90"
      />
      <span className="relative z-[1] mx-auto block max-w-[min(220px,62vw)] text-balance text-[16px] font-semibold leading-5">
        {title}
      </span>
      <span className="relative z-[1] mt-1 block text-[12px] font-normal leading-[15px]">
        A small token to get you started
      </span>
      <span className="relative z-[1] mt-2 inline-flex items-center gap-0.5 text-[10px] font-medium">
        <span className="inline-flex h-[18px] min-w-5 items-center justify-center rounded-[5px] bg-white px-[3px] font-semibold text-[#011735]">
          {clock.hours}
        </span>
        <span className="px-0.5 font-bold leading-none">:</span>
        <span className="inline-flex h-[18px] min-w-5 items-center justify-center rounded-[5px] bg-white px-[3px] font-semibold text-[#011735]">
          {clock.minutes}
        </span>
        <span className="pl-0.5">Hr</span>
      </span>
    </button>
  );
}

export function getCoinPackStoreIndex(
  packId: number,
  timerPack: CoinStorePack | null,
  exclusiveDeals: CoinStorePack[],
  topPlans: CoinStorePack[],
): number {
  let index = 0;
  if (timerPack) {
    if (timerPack.id === packId) return index;
    index += 1;
  }
  for (const pack of exclusiveDeals) {
    if (pack.id === packId) return index;
    index += 1;
  }
  for (const pack of topPlans) {
    if (pack.id === packId) return index;
    index += 1;
  }
  return 0;
}

export const CoinStoreMobile = ({
  timerPack,
  exclusiveDeals,
  topPlans,
  onPackSelect,
  onRecharge,
  isMember,
  featuredWeeklyPlan,
  basicWeeklyPlan,
  freeTrial = null,
  paymentInProgress = false,
  coinBalance = null,
  onOpenCoinHistory,
}: CoinStoreMobileProps) => {
  useEffect(() => {
    const id = "znw-instrument-sans";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);

  const offers = useMemo(() => {
    const packs: CoinStorePack[] = [];
    if (timerPack) packs.push(timerPack);
    const seen = new Set(packs.map((pack) => pack.id));
    for (const pack of [...exclusiveDeals, ...topPlans]) {
      if (seen.has(pack.id)) continue;
      seen.add(pack.id);
      packs.push(pack);
    }
    return splitCoinStoreOffers(packs);
  }, [timerPack, exclusiveDeals, topPlans]);

  const weeklyPlans = useMemo(() => {
    if (isMember) return [] as SubscriptionPlan[];
    return [featuredWeeklyPlan, basicWeeklyPlan].filter(
      (plan): plan is SubscriptionPlan => plan != null,
    );
  }, [isMember, featuredWeeklyPlan, basicWeeklyPlan]);

  const buy = (pack: CoinStorePack, index: number) => {
    if (paymentInProgress) return;
    onPackSelect(pack, index);
    onRecharge(pack);
  };

  const indexFor = (pack: CoinStorePack) =>
    getCoinPackStoreIndex(pack.id, timerPack, exclusiveDeals, topPlans);

  const hasRows =
    offers.starter != null ||
    offers.mostPurchased != null ||
    offers.oneTime.length > 0 ||
    weeklyPlans.length > 0 ||
    freeTrial != null;

  return (
    <div
      className="relative min-h-dvh overflow-x-hidden bg-black md:hidden"
      style={{ fontFamily: STORE_FONT }}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[95px] w-[287px] -translate-x-1/2 -translate-y-[73px] rounded-full bg-[#1A95FA] opacity-60 blur-[47px]"
        aria-hidden
      />

      <header className="relative flex items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] min-[390px]:px-6">
        {coinBalance != null ? (
          <button
            type="button"
            onClick={() => onOpenCoinHistory?.("coin_balance")}
            disabled={paymentInProgress}
            className="flex min-h-11 min-w-0 touch-manipulation items-center gap-[3px] disabled:opacity-40"
            aria-label="Coin history"
          >
            <ZintleCoinIcon size={32} className="h-8 w-8 shrink-0" />
            <span className="truncate text-[32px] font-semibold leading-[39px] text-[#E9E7E9]">
              {formatBalance(coinBalance)}
            </span>
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => onOpenCoinHistory?.("help")}
          disabled={paymentInProgress}
          className="inline-flex h-11 shrink-0 touch-manipulation items-center disabled:opacity-40"
          aria-label="Help"
        >
          <span className="inline-flex h-[26px] items-center gap-[5px] rounded-[21px] bg-[#0A2548] py-1 pl-1.5 pr-2 text-[14px] font-normal leading-[17px] text-[#E9E7E9]">
            <HelpIcon />
            Help
          </span>
        </button>
      </header>

      <main className="relative flex flex-col gap-6 overflow-x-hidden px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4 min-[390px]:px-6">
        {!hasRows && (
          <div className="rounded-[16px] bg-[rgba(10,37,72,0.3)] px-6 py-10 text-center">
            <p className="text-sm text-white/70">
              There are no coin packs available right now. Please try again
              later.
            </p>
          </div>
        )}

        {freeTrial && (
          <TrialBanner
            trial={freeTrial}
            disabled={paymentInProgress}
            onBuy={() => buy(freeTrialToStorePack(freeTrial), 0)}
          />
        )}

        {offers.starter && (
          <section className="flex flex-col gap-2">
            <h2 className="text-[16px] font-medium leading-5 text-white">
              Starter Pack
            </h2>
            <PackRow
              pack={offers.starter}
              tone="starter"
              disabled={paymentInProgress}
              onBuy={() => buy(offers.starter!, indexFor(offers.starter!))}
            />
          </section>
        )}

        {offers.mostPurchased && (
          <section className="flex flex-col gap-2">
            <h2 className="text-[16px] font-medium leading-5 text-white">
              Most Purchased
            </h2>
            <PackRow
              pack={offers.mostPurchased}
              tone="highlight"
              disabled={paymentInProgress}
              onBuy={() =>
                buy(offers.mostPurchased!, indexFor(offers.mostPurchased!))
              }
            />
          </section>
        )}

        {offers.oneTime.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-[16px] font-medium leading-5 text-white">
              One Time Purchase
            </h2>
            <div className="flex flex-col gap-2">
              {[...offers.oneTime].sort(comparePackPrice).map((pack) => (
                <PackRow
                  key={pack.id}
                  pack={pack}
                  tone="plain"
                  disabled={paymentInProgress}
                  onBuy={() => buy(pack, indexFor(pack))}
                />
              ))}
            </div>
          </section>
        )}

        {weeklyPlans.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-[16px] font-medium leading-5 text-white">
              Weekly Plan
            </h2>
            <div className="flex flex-col gap-2">
              {weeklyPlans.map((plan) => {
                const pack = weeklyPlanToStorePack(plan);
                return (
                  <PackRow
                    key={plan.id}
                    pack={pack}
                    tone="plain"
                    showOffer={false}
                    disabled={paymentInProgress}
                    onBuy={() => buy(pack, indexFor(pack))}
                  />
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
