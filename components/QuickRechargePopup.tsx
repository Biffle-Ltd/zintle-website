import React, { useEffect, useMemo } from "react";
import { ZINTLE_BALANCE_COIN_SRC, ZINTLE_CHEVRONS_RIGHT_SRC } from "../utils/coinStoreAssets";
import { TrialBanner, type CoinStorePack, type SubscriptionPlan } from "./CoinStoreMobile";
import type { QuickRechargeCallContext } from "../utils/quickRecharge";
import type { CoinPurchaseSurface } from "../utils/pixelEvents";
import {
  comparePackPrice,
  packCardFigures,
  splitCoinStoreOffers,
} from "../utils/coinStoreOffer";
import { freeTrialToStorePack, type VisibleFreeTrial } from "../utils/freeTrialOffer";
import { PressableCard } from "./PressableCard";

export type QuickRechargePack = {
  id: number;
  coins: number;
  price: number;
  tag?: string;
  highlight?: boolean;
  name?: string;
  bonus_coins?: number;
  bonus?: number;
  base_coins?: number;
  total_coins?: number;
  bonus_percent?: number;
  /** Subscription rows should not invent a coin-pack bonus. */
  showOffer?: boolean;
};

const SHEET_FONT =
  '"Instrument Sans", ui-sans-serif, system-ui, sans-serif';

function formatRupee(amount: number): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "₹0";
  return Number.isInteger(n) ? `₹${n}` : `₹${n.toFixed(2)}`;
}

function formatCoinAmount(coins: number): string {
  const n = Number(coins);
  if (!Number.isFinite(n)) return "0";
  if (Number.isInteger(n)) return String(n);
  const cents = Math.round(n * 100) / 100;
  return Number.isInteger(cents) ? String(cents) : String(cents);
}

function formatBalance(balance: number): string {
  if (!Number.isFinite(balance)) return "0";
  return Number.isInteger(balance) ? String(balance) : String(Math.round(balance));
}

type PackTone = "starter" | "highlight" | "plain";

function PackRow({
  pack,
  tone,
  disabled,
  busyLabel = null,
  onBuy,
}: {
  pack: QuickRechargePack;
  tone: PackTone;
  disabled: boolean;
  busyLabel?: string | null;
  onBuy: () => void;
}) {
  const figures =
    pack.showOffer === false
      ? { coins: pack.coins, free: 0, percent: null }
      : packCardFigures(pack);
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
        {figures.percent != null && (
          <span
            className={`inline-flex h-[21px] w-fit items-center rounded-[3px] px-1.5 text-[10px] font-medium leading-[1.15] ${
              starter
                ? "bg-[#00201A] text-[#5ED86A]"
                : "bg-[#191700] text-[#E6A433]"
            }`}
          >
            {figures.percent}% bonus
          </span>
        )}
        <span className={`flex min-w-0 items-center ${featured ? "gap-[7px]" : "gap-[5px]"}`}>
          <span className="flex shrink-0 items-center gap-0.5">
            <img
              src={ZINTLE_BALANCE_COIN_SRC}
              alt=""
              width={96}
              height={96}
              decoding="async"
              fetchPriority="high"
              draggable={false}
              className="h-6 w-6 shrink-0"
            />
            <span className="whitespace-nowrap text-[16px] font-semibold leading-5 text-white">
              {formatCoinAmount(figures.coins)}
            </span>
          </span>
          {figures.free > 0 && (
            <span
              className={`truncate font-normal leading-[1.15] text-[#E6A433] ${
                featured ? "text-[10.2px]" : "text-[10px]"
              }`}
            >
              +{formatCoinAmount(figures.free)} Free coins
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

type QuickRechargePopupProps = {
  packs: QuickRechargePack[];
  selectedPackageId: number | null;
  onPackSelect: (pkg: QuickRechargePack, index: number) => void;
  onContinue: (pkg?: QuickRechargePack) => void;
  isMember: boolean;
  featuredWeeklyPlan: SubscriptionPlan | null;
  basicWeeklyPlan: SubscriptionPlan | null;
  freeTrial?: VisibleFreeTrial | null;
  timerPack: CoinStorePack | null;
  callContext?: QuickRechargeCallContext | null;
  surface?: CoinPurchaseSurface | null;
  /** Kept so existing callers still compile. The sheet title is fixed. */
  headerPack?: { coins: number; price: number } | null;
  /** Account balance from get-wallet-balance. Display only. */
  coinBalance?: number | null;
  paymentInProgress?: boolean;
  /** The card waiting on UPI or checkout. That card stays lit. */
  pendingPurchase?: { id: number } | null;
  /** Opens the full coin store. */
  onMorePlans?: () => void;
  /** One-time rows under Most Purchased. Null shows every remaining pack. */
  oneTimeLimit?: number | null;
  /** Weekly plans, cheapest first. Shown after Most Purchased. */
  weeklyPacks?: QuickRechargePack[];
  /**
   * `page` fills the webview. The native coin-store sheet already draws the
   * handle and the rounded frame. `sheet` is the in-call card.
   */
  layout?: "page" | "sheet";
};

const SHEET_ONE_TIME_PREVIEW = 2;

export const QuickRechargePopup = ({
  packs,
  onPackSelect,
  onContinue,
  onMorePlans,
  oneTimeLimit = SHEET_ONE_TIME_PREVIEW,
  weeklyPacks = [],
  layout = "sheet",
  callContext = null,
  coinBalance = null,
  paymentInProgress = false,
  pendingPurchase = null,
  freeTrial = null,
}: QuickRechargePopupProps) => {
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

  const sheet = useMemo(() => {
    const seenWeekly = new Set<number>();
    const weeklies = weeklyPacks.filter((pack) => {
      if (seenWeekly.has(pack.id)) return false;
      seenWeekly.add(pack.id);
      return true;
    });
    // Split coins only. A weekly mixed into `packs` is often the cheapest row,
    // and its name can match "starter" or "recommended", so it would take
    // those headings and show up a second time below.
    const trialId = freeTrial?.planId ?? null;
    const coins = (packs as CoinStorePack[]).filter(
      (pack) => !seenWeekly.has(pack.id) && pack.id !== trialId,
    );
    const split = splitCoinStoreOffers(coins);
    const oneTime = [...split.oneTime].sort(comparePackPrice);
    const preview = oneTimeLimit == null ? oneTime : oneTime.slice(0, oneTimeLimit);
    const ordered = [
      ...(split.starter ? [split.starter] : []),
      ...(split.mostPurchased ? [split.mostPurchased] : []),
      ...oneTime,
    ];
    // The banner is the first card, so coin positions start at 1.
    const trialOffset = trialId == null ? 0 : 1;
    const indexOf = (id: number) => {
      if (trialId != null && id === trialId) return 0;
      const found = ordered.findIndex((pack) => pack.id === id);
      return found < 0 ? found : found + trialOffset;
    };
    return {
      starter: split.starter,
      mostPurchased: split.mostPurchased,
      preview,
      indexOf,
      empty: ordered.length === 0,
    };
  }, [packs, oneTimeLimit, weeklyPacks, freeTrial]);
  const balance = coinBalance ?? callContext?.walletBalance ?? null;

  const buy = (pack: QuickRechargePack, index: number) => {
    if (paymentInProgress) return;
    onPackSelect(pack, index);
    onContinue(pack);
  };
  const busyLabelFor = (id: number) =>
    pendingPurchase?.id === id ? "Loading" : null;
  const rowDisabled = (id: number) =>
    paymentInProgress && pendingPurchase?.id !== id;

  const page = layout === "page";
  const balanceRow = (
    <div className="flex w-full shrink-0 items-center justify-between gap-3">
      <h2 className="min-w-0 text-[20px] font-semibold leading-6 text-[#E9E7E9]">
        Quick Recharge
      </h2>
      {balance != null && (
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/80 bg-transparent py-1 pl-1 pr-2.5"
          aria-label={`${formatBalance(balance)} coins`}
        >
          <img
            src={ZINTLE_BALANCE_COIN_SRC}
            alt=""
            width={96}
            height={96}
            decoding="async"
            fetchPriority="high"
            draggable={false}
            className="h-6 w-6 shrink-0"
          />
          <span className="text-[16px] font-semibold leading-5 text-[#E9E7E9]">
            {formatBalance(balance)}
          </span>
        </span>
      )}
    </div>
  );

  return (
    <div
      className={
        page
          ? "flex h-dvh w-full touch-manipulation flex-col overflow-hidden bg-[#011735] px-4 pt-[max(0.75rem,env(safe-area-inset-top))] min-[390px]:px-6"
          : "flex max-h-full min-h-0 w-full touch-manipulation flex-col items-center overflow-hidden rounded-[26px] bg-[#011735] p-4"
      }
      style={{ fontFamily: SHEET_FONT }}
      role={page ? "main" : "dialog"}
      aria-label="Quick recharge"
    >
      {!page && (
        <div className="mb-4 h-[3px] w-[41px] shrink-0 rounded-full bg-[#E9E7E9] opacity-40" />
      )}

      {page && balanceRow}

      <div
        className={
          page
            ? "mt-[21px] flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-contain pb-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : "flex min-h-0 w-full flex-col gap-4 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        }
      >
        {!page && balanceRow}

        {sheet.empty && !freeTrial ? (
          <div className="rounded-[16px] bg-[rgba(10,37,72,0.3)] px-6 py-10 text-center">
            <p className="text-sm text-white/70">
              There are no coin packs available right now. Please try again
              later.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {freeTrial && (
              <TrialBanner
                trial={freeTrial}
                disabled={rowDisabled(freeTrial.planId)}
                busyLabel={busyLabelFor(freeTrial.planId)}
                onBuy={() =>
                  buy(freeTrialToStorePack(freeTrial), sheet.indexOf(freeTrial.planId))
                }
              />
            )}
            {sheet.starter && (
              <section className="flex flex-col gap-2">
                <h3 className="text-[16px] font-medium leading-5 text-white">
                  Starter Pack
                </h3>
                <PackRow
                  pack={sheet.starter}
                  tone="starter"
                  disabled={rowDisabled(sheet.starter.id)}
                  busyLabel={busyLabelFor(sheet.starter.id)}
                  onBuy={() =>
                    buy(sheet.starter!, sheet.indexOf(sheet.starter!.id))
                  }
                />
              </section>
            )}

            {sheet.mostPurchased && (
              <section className="flex flex-col gap-2">
                <h3 className="text-[16px] font-medium leading-5 text-white">
                  Most Purchased
                </h3>
                <PackRow
                  pack={sheet.mostPurchased}
                  tone="highlight"
                  disabled={rowDisabled(sheet.mostPurchased.id)}
                  busyLabel={busyLabelFor(sheet.mostPurchased.id)}
                  onBuy={() =>
                    buy(
                      sheet.mostPurchased!,
                      sheet.indexOf(sheet.mostPurchased!.id),
                    )
                  }
                />
              </section>
            )}

            {sheet.preview.length > 0 && (
              <section className="flex flex-col gap-2">
                <div className="flex flex-col gap-2">
                  {sheet.preview.map((pack) => (
                    <PackRow
                      key={pack.id}
                      pack={pack}
                      tone="plain"
                      disabled={rowDisabled(pack.id)}
                      busyLabel={busyLabelFor(pack.id)}
                      onBuy={() => buy(pack, sheet.indexOf(pack.id))}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

      </div>
      {onMorePlans != null && (
        <div
          className={`relative z-10 w-full shrink-0 ${
            page
              ? "pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
              : "pt-3"
          }`}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[-1.5rem] bottom-0 h-28 bg-gradient-to-t from-black via-black/70 to-transparent"
          />
          <button
            type="button"
            onClick={onMorePlans}
            disabled={paymentInProgress}
            className="relative z-10 inline-flex min-h-11 w-full touch-manipulation items-center justify-center gap-[11px] text-[14px] font-semibold text-white transition-transform active:scale-95 disabled:opacity-40"
          >
            See More Plans
            <img
              src={ZINTLE_CHEVRONS_RIGHT_SRC}
              alt=""
              width={24}
              height={24}
              draggable={false}
              className="h-6 w-6 shrink-0"
            />
          </button>
        </div>
      )}
    </div>
  );
};
