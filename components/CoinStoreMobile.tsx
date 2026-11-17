import React, { useEffect, useMemo, useState } from "react";
import {
  comparePackPrice,
  packCardFigures,
  splitCoinStoreOffers,
} from "../utils/coinStoreOffer";
import { uniqueWeeklyPlans, weeklyPlanToStorePack } from "../utils/coinStoreVisiblePacks";
import { freeTrialToStorePack, type VisibleFreeTrial } from "../utils/freeTrialOffer";
import { ZINTLE_BALANCE_COIN_SRC, ZINTLE_HELP_ICON_SRC } from "../utils/coinStoreAssets";

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
  /** Wallet balance. Top-left pill. The native header already shows the title. */
  coinBalance?: number | null;
  /** Balance and Help both open coin history for now. */
  onOpenCoinHistory?: (source: "coin_balance" | "help") => void;
};

type PackTone = "starter" | "highlight" | "plain";

function msUntilNextMidnight(now: number): number {
  const end = new Date(now);
  end.setHours(24, 0, 0, 0);
  return Math.max(0, end.getTime() - now);
}

/** Time left in the local day: 24:00 minus the current clock, ticking every second. */
function useDayCountdown(): { hours: string; minutes: string; seconds: string } {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const total = Math.floor(msUntilNextMidnight(now) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    hours: pad(Math.floor(total / 3600)),
    minutes: pad(Math.floor((total % 3600) / 60)),
    seconds: pad(total % 60),
  };
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
            <FigmaCoin className="h-6 w-6 shrink-0" />
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
  const clock = useDayCountdown();
  const coins = trial.trialCoins;
  const title =
    coins != null && coins > 0
      ? `Trail Pack - ${formatCoins(coins)} Coins for ${formatRupee(trial.trialAmount)}`
      : `Trail Pack for ${formatRupee(trial.trialAmount)}`;

  return (
    <button
      type="button"
      onClick={onBuy}
      disabled={disabled}
      className="relative min-h-[81px] w-full touch-manipulation overflow-hidden rounded-[16px] bg-[linear-gradient(101.45deg,#F4486E_2.28%,#FF7000_94.35%)] px-4 pb-2 pt-[7px] text-center text-white transition-transform active:scale-[0.99] disabled:opacity-60"
    >
      <FigmaCoin className="pointer-events-none absolute -left-10 top-2 h-8 w-8 -rotate-[15deg]" />
      <FigmaCoin className="pointer-events-none absolute -left-6 top-1/2 h-[78px] w-[74px] -translate-y-1/2 -rotate-[15deg]" />
      <FigmaCoin className="pointer-events-none absolute -right-4 top-0 h-[96px] w-[90px] rotate-[20deg]" />
      <span className="relative z-[1] mx-auto block max-w-[230px] text-balance text-[16px] font-semibold leading-5">
        {title}
      </span>
      <span className="relative z-[1] mt-1 block text-[12px] font-normal leading-[15px]">
        A small token to get you started
      </span>
      <span className="relative z-[1] mt-[9px] inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-medium">
        <TimeBox value={clock.hours} />
        <span>hrs</span>
        <TimeBox value={clock.minutes} />
        <span>mins</span>
        <TimeBox value={clock.seconds} />
        <span>sec</span>
      </span>
    </button>
  );
}

function TimeBox({ value }: { value: string }) {
  return (
    <span className="inline-flex h-[18px] min-w-5 items-center justify-center rounded-[5px] bg-white px-[3px] text-[10px] font-semibold leading-none text-[#011735]">
      {value}
    </span>
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

  const weeklyPlans = useMemo(
    () => uniqueWeeklyPlans(isMember, featuredWeeklyPlan, basicWeeklyPlan),
    [isMember, featuredWeeklyPlan, basicWeeklyPlan],
  );

  const offers = useMemo(() => {
    const weeklyIds = new Set(weeklyPlans.map((plan) => plan.id));
    const packs: CoinStorePack[] = [];
    if (timerPack && !weeklyIds.has(timerPack.id)) packs.push(timerPack);
    const seen = new Set(packs.map((pack) => pack.id));
    for (const pack of [...exclusiveDeals, ...topPlans]) {
      if (seen.has(pack.id) || weeklyIds.has(pack.id)) continue;
      seen.add(pack.id);
      packs.push(pack);
    }
    return splitCoinStoreOffers(packs);
  }, [timerPack, exclusiveDeals, topPlans, weeklyPlans]);

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
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[95px] w-[287px] -translate-x-1/2 -translate-y-[73px] rounded-full bg-[#1A95FA] opacity-60 blur-[47px]"
        aria-hidden
      />

      <header className="relative flex items-center justify-between gap-3 px-6 pt-2">
        {coinBalance != null ? (
          <button
            type="button"
            onClick={() => onOpenCoinHistory?.("coin_balance")}
            disabled={paymentInProgress}
            className="inline-flex min-h-11 min-w-0 touch-manipulation items-center disabled:opacity-40"
            aria-label={`${formatBalance(coinBalance)} coins`}
          >
            <span className="inline-flex min-w-0 items-center gap-1 rounded-full border border-white/80 py-0.5 pl-0.5 pr-3">
              <FigmaCoin className="h-8 w-8 shrink-0" />
              <span className="truncate text-[20px] font-semibold leading-none text-[#E9E7E9]">
                {formatBalance(coinBalance)}
              </span>
            </span>
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => onOpenCoinHistory?.("help")}
          disabled={paymentInProgress}
          className="inline-flex min-h-11 shrink-0 touch-manipulation items-center disabled:opacity-40"
        >
          <span className="inline-flex items-center gap-[5px] rounded-[21px] bg-[#0A2548] py-1 pl-1.5 pr-2 text-[14px] font-normal text-[#E9E7E9]">
            <img
              src={ZINTLE_HELP_ICON_SRC}
              alt=""
              width={18}
              height={18}
              draggable={false}
            />
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
      </main>
    </div>
  );
};
