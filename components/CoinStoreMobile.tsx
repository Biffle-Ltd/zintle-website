import React, { useEffect, useMemo, useState } from "react";
import {
  comparePackPrice,
  packCardFigures,
  splitCoinStoreOffers,
} from "../utils/coinStoreOffer";
import { uniqueWeeklyPlans, weeklyPlanToStorePack } from "../utils/coinStoreVisiblePacks";
import { freeTrialToStorePack, type VisibleFreeTrial } from "../utils/freeTrialOffer";
import {
  ZINTLE_BALANCE_COIN_SRC,
  ZINTLE_TRIAL_BANNER_SRC,
} from "../utils/coinStoreAssets";
import { PressableCard } from "./PressableCard";

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
  /** Coins the buyer receives. Shown as the card's main number. */
  total_coins?: number;
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
  if (Number.isInteger(v)) return String(v);
  const cents = Math.round(v * 100) / 100;
  return Number.isInteger(cents) ? String(cents) : String(cents);
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
  /** Wallet balance, centered. The native header already shows the title. */
  coinBalance?: number | null;
  /** Balance and Help both open coin history for now. */
  onOpenCoinHistory?: (source: "coin_balance" | "help") => void;
  /** The card that is waiting on UPI or checkout. Others stay dimmed. */
  pendingPurchase?: { id: number } | null;
};

type PackTone = "starter" | "highlight" | "plain";

function msUntilNextMidnight(now: number): number {
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  return Math.max(0, end.getTime() - now);
}

/** Time left in the local day. The label only changes each minute. */
function useDayCountdown(): { hours: string; minutes: string } {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let timer = 0;
    const tick = () => {
      window.clearTimeout(timer);
      const next = Date.now();
      setNow(next);
      const msIntoMinute = next % 60_000;
      timer = window.setTimeout(tick, Math.max(250, 60_000 - msIntoMinute));
    };
    tick();
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const total = Math.floor(msUntilNextMidnight(now) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    hours: pad(Math.floor(total / 3600)),
    minutes: pad(Math.floor((total % 3600) / 60)),
  };
}

function BalanceChevron() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="h-5 w-5 shrink-0"
    >
      <path
        d="M7.5 5L12.5 10L7.5 15"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HelpMark() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden
      className="h-[18px] w-[18px] shrink-0"
    >
      <path
        d="M9 12V12.0075M9 9.74982C9.33731 9.75084 9.66512 9.63813 9.93049 9.4299C10.1959 9.22166 10.3833 8.93007 10.4625 8.60219C10.5418 8.27432 10.5082 7.9293 10.3672 7.62287C10.2262 7.31643 9.98605 7.06646 9.6855 6.91332C9.38713 6.76048 9.04583 6.71309 8.71711 6.77886C8.38839 6.84463 8.09159 7.0197 7.875 7.27557M9.60158 1.62383L13.7828 3.41558C14.1428 3.57008 14.4301 3.85733 14.5853 4.21808L16.3763 8.39858C16.5413 8.78258 16.5413 9.21758 16.3763 9.60158L14.5846 13.7828C14.4301 14.1428 14.1428 14.4301 13.7821 14.5853L9.60158 16.3763C9.21758 16.5413 8.78258 16.5413 8.39858 16.3763L4.21733 14.5846C3.85666 14.4301 3.56929 14.1427 3.41483 13.7821L1.62383 9.60158C1.54237 9.4115 1.50037 9.20687 1.50037 9.00008C1.50037 8.79328 1.54237 8.58865 1.62383 8.39858L3.41558 4.21733C3.57008 3.85733 3.85733 3.57008 4.21808 3.41483L8.39858 1.62383C8.58865 1.54237 8.79328 1.50037 9.00008 1.50037C9.20687 1.50037 9.4115 1.54237 9.60158 1.62383Z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FigmaCoin({ className }: { className?: string }) {
  return (
    <img
      src={ZINTLE_BALANCE_COIN_SRC}
      alt=""
      width={96}
      height={96}
      decoding="async"
      fetchPriority="high"
      draggable={false}
      className={className}
    />
  );
}

function PackRow({
  pack,
  tone,
  disabled,
  busyLabel = null,
  showOffer = true,
  onBuy,
}: {
  pack: CoinStorePack;
  tone: PackTone;
  disabled: boolean;
  busyLabel?: string | null;
  showOffer?: boolean;
  onBuy: () => void;
}) {
  const figures = showOffer
    ? packCardFigures(pack)
    : { coins: pack.coins, free: 0, percent: null };
  const bonus = figures.free;
  const percent = figures.percent;
  const starter = tone === "starter";
  const featured = starter || tone === "highlight";

  return (
    <PressableCard
      onClick={onBuy}
      disabled={disabled}
      busyLabel={busyLabel}
      className={`flex w-full items-center justify-between px-3 pb-3 pt-2 text-left ${
        featured
          ? "h-[73px] rounded-[16px]"
          : "h-[69px] rounded-[10px]"
      } ${
        starter
          ? "bg-[rgba(94,216,106,0.12)]"
          : tone === "highlight"
            ? "bg-[rgba(255,112,0,0.11)]"
            : "bg-[rgba(10,37,72,0.3)]"
      }`}
    >
      <span className={`flex min-w-0 flex-col ${featured ? "gap-2" : "gap-1"}`}>
        {percent != null && (
          <span
            className={`inline-flex h-[21px] w-fit items-center rounded-[3px] px-1.5 text-[10px] font-medium leading-[1.15] ${
              starter
                ? "bg-[#00201A] text-[#5ED86A]"
                : "bg-[#191700] text-[#E6A433]"
            }`}
          >
            {percent}% bonus
          </span>
        )}
        <span className={`flex min-w-0 items-center ${featured ? "gap-[7px]" : "gap-[5px]"}`}>
          <span className="flex shrink-0 items-center gap-0.5">
            <FigmaCoin className="h-6 w-6 shrink-0" />
            <span className="whitespace-nowrap text-[16px] font-semibold leading-5 text-white">
              {formatCoins(figures.coins)}
            </span>
          </span>
          {bonus > 0 && (
            <span
              className={`truncate font-normal leading-[1.15] text-[#E6A433] ${
                featured ? "text-[10.2px]" : "text-[10px]"
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
    </PressableCard>
  );
}

export function TrialBanner({
  trial,
  disabled,
  busyLabel = null,
  onBuy,
}: {
  trial: VisibleFreeTrial;
  disabled: boolean;
  busyLabel?: string | null;
  onBuy: () => void;
}) {
  const clock = useDayCountdown();
  const coins = trial.trialCoins;
  const title =
    coins != null && coins > 0
      ? `Trail Pack - ${formatCoins(coins)} Coins for ${formatRupee(trial.trialAmount)}`
      : `Trail Pack for ${formatRupee(trial.trialAmount)}`;

  return (
    <PressableCard
      onClick={onBuy}
      disabled={disabled}
      busyLabel={busyLabel}
      className="flex aspect-[686/162] w-full flex-col items-center justify-center rounded-[16px] bg-[linear-gradient(101.45deg,#F4486E_2.28%,#FF7000_94.35%)] px-6 py-1.5 text-center text-white"
    >
      <img
        src={ZINTLE_TRIAL_BANNER_SRC}
        alt=""
        width={686}
        height={162}
        decoding="async"
        fetchPriority="high"
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full rounded-[16px] object-cover"
      />
      <span className="relative z-[1] mx-auto block text-balance text-[16px] font-semibold leading-5">
        {title}
      </span>
      <span className="relative z-[1] mt-1 block text-[12px] font-normal leading-[15px]">
        A small token to get you started
      </span>
      <span className="relative z-[1] mt-1.5 inline-flex items-center rounded-full bg-[#1A1208]/55 px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide text-white">
        {clock.hours} H : {clock.minutes} M
      </span>
    </PressableCard>
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
  pendingPurchase = null,
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

  const weeklyPlans = useMemo(
    () => uniqueWeeklyPlans(isMember, featuredWeeklyPlan, basicWeeklyPlan),
    [isMember, featuredWeeklyPlan, basicWeeklyPlan],
  );

  const offers = useMemo(() => {
    const hiddenIds = new Set(weeklyPlans.map((plan) => plan.id));
    if (freeTrial) hiddenIds.add(freeTrial.planId);
    const packs: CoinStorePack[] = [];
    if (timerPack && !hiddenIds.has(timerPack.id)) packs.push(timerPack);
    const seen = new Set(packs.map((pack) => pack.id));
    for (const pack of [...exclusiveDeals, ...topPlans]) {
      if (seen.has(pack.id) || hiddenIds.has(pack.id)) continue;
      seen.add(pack.id);
      packs.push(pack);
    }
    return splitCoinStoreOffers(packs);
  }, [timerPack, exclusiveDeals, topPlans, weeklyPlans, freeTrial]);

  const busyLabelFor = (id: number) =>
    pendingPurchase?.id === id ? "Loading" : null;
  const rowDisabled = (id: number) =>
    paymentInProgress && pendingPurchase?.id !== id;

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
      className="relative min-h-dvh overflow-x-hidden bg-[#011735] md:hidden"
      style={{ fontFamily: STORE_FONT }}
    >
      <header className="relative flex min-h-11 items-center justify-center px-6 pt-2">
        {coinBalance != null ? (
          <button
            type="button"
            onClick={() => onOpenCoinHistory?.("coin_balance")}
            disabled={paymentInProgress}
            className="inline-flex min-h-11 max-w-[calc(100%-12rem)] touch-manipulation items-center gap-1.5 disabled:opacity-40"
            aria-label={`${formatBalance(coinBalance)} coins`}
          >
            <FigmaCoin className="h-9 w-9 shrink-0" />
            <span className="truncate text-[28px] font-semibold leading-none text-white">
              {formatBalance(coinBalance)}
            </span>
            <BalanceChevron />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onOpenCoinHistory?.("help")}
          disabled={paymentInProgress}
          className="absolute right-6 top-1/2 inline-flex min-h-11 -translate-y-1/2 touch-manipulation items-center disabled:opacity-40"
        >
          <span className="inline-flex items-center gap-[5px] rounded-[21px] bg-[#0A2548] py-1 pl-1.5 pr-2 text-[14px] font-normal text-[#E9E7E9]">
            <HelpMark />
            Help
          </span>
        </button>
      </header>

      <main className="relative flex flex-col gap-4 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-3">
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
            disabled={rowDisabled(freeTrial.planId)}
            busyLabel={busyLabelFor(freeTrial.planId)}
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
              disabled={rowDisabled(offers.starter.id)}
              busyLabel={busyLabelFor(offers.starter.id)}
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
              disabled={rowDisabled(offers.mostPurchased.id)}
              busyLabel={busyLabelFor(offers.mostPurchased.id)}
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
                  disabled={rowDisabled(pack.id)}
                  busyLabel={busyLabelFor(pack.id)}
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
                    disabled={rowDisabled(pack.id)}
                    busyLabel={busyLabelFor(pack.id)}
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
