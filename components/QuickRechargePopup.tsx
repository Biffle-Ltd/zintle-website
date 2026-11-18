import React, { useEffect, useMemo } from "react";
import { ZINTLE_BALANCE_COIN_SRC, ZINTLE_CHEVRONS_RIGHT_SRC } from "../utils/coinStoreAssets";
import type { CoinStorePack, SubscriptionPlan } from "./CoinStoreMobile";
import type { QuickRechargeCallContext } from "../utils/quickRecharge";
import type { CoinPurchaseSurface } from "../utils/pixelEvents";
import {
  comparePackPrice,
  packCardFigures,
  splitCoinStoreOffers,
} from "../utils/coinStoreOffer";
import type { VisibleFreeTrial } from "../utils/freeTrialOffer";
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
  return Number.isInteger(n) ? String(n) : String(Math.round(n));
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
  const plain = tone === "plain";

  return (
    <PressableCard
      onClick={onBuy}
      disabled={disabled}
      busyLabel={busyLabel}
      className={`flex min-h-[52px] w-full items-center justify-between text-left ${
        starter
          ? "rounded-[16px] bg-[rgba(94,216,106,0.12)] px-3 pb-3 pt-2"
          : tone === "highlight"
            ? "rounded-[16px] bg-[rgba(255,112,0,0.11)] px-3 pb-3 pt-2"
            : "rounded-[10px] bg-[rgba(10,37,72,0.3)] px-3 pb-3 pt-2"
      }`}
    >
      <span className={`flex min-w-0 flex-col ${plain ? "gap-1" : "gap-2"}`}>
        {figures.percent != null && (
          <span
            className={`inline-flex w-fit rounded-[3px] px-1.5 py-[5px] text-[10px] font-medium leading-[1.15] ${
              starter
                ? "bg-[#00201A] text-[#5ED86A]"
                : "bg-[#191700] text-[#E6A433]"
            }`}
          >
            {figures.percent}% bonus
          </span>
        )}
        <span
          className={`flex min-w-0 items-center ${plain ? "gap-[5px]" : "gap-[7px]"}`}
        >
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
            <span className="whitespace-nowrap text-[16px] font-semibold leading-[1.15] text-white">
              {formatCoinAmount(figures.coins)}
            </span>
          </span>
          {figures.free > 0 && (
            <span
              className={`truncate font-normal leading-[1.15] text-[#E6A433] ${
                plain ? "text-[10px]" : "text-[10.2px]"
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
    const coins = (packs as CoinStorePack[]).filter(
      (pack) => !seenWeekly.has(pack.id),
    );
    const split = splitCoinStoreOffers(coins);
    const oneTime = [...split.oneTime].sort(comparePackPrice);
    const preview = oneTimeLimit == null ? oneTime : oneTime.slice(0, oneTimeLimit);
    const ordered = [
      ...(split.starter ? [split.starter] : []),
      ...(split.mostPurchased ? [split.mostPurchased] : []),
      ...oneTime,
    ];
    const indexOf = (id: number) => ordered.findIndex((pack) => pack.id === id);
    return {
      starter: split.starter,
      mostPurchased: split.mostPurchased,
      preview,
      indexOf,
      empty: ordered.length === 0,
    };
  }, [packs, oneTimeLimit, weeklyPacks]);
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

  return (
    <div
      className={
        page
          ? "flex h-dvh w-full touch-manipulation flex-col overflow-hidden bg-[#011735] px-4 pt-[max(0.75rem,env(safe-area-inset-top))] min-[390px]:px-6"
          : "flex max-h-full min-h-0 w-full touch-manipulation flex-col items-center gap-6 overflow-hidden rounded-[26px] bg-[#011735] p-4"
      }
      style={{ fontFamily: SHEET_FONT }}
      role={page ? "main" : "dialog"}
      aria-label="Quick recharge"
    >
      {!page && (
        <div className="h-[3px] w-[41px] shrink-0 rounded-full bg-[#E9E7E9] opacity-40" />
      )}

      <div
        className={
          page
            ? "flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto overscroll-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : "flex min-h-0 w-full flex-col gap-4 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        }
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="min-w-0 text-[20px] font-medium leading-6 text-[#E9E7E9]">
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

        {sheet.empty ? (
          <div className="rounded-[16px] bg-[rgba(10,37,72,0.3)] px-6 py-10 text-center">
            <p className="text-sm text-white/70">
              There are no coin packs available right now. Please try again
              later.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
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
              ? "bg-[#011735] pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
              : "bg-[#011735] pt-2"
          }`}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-full h-16 bg-gradient-to-t from-[#011735] to-transparent"
          />
          <button
            type="button"
            onClick={onMorePlans}
            disabled={paymentInProgress}
            className="inline-flex min-h-11 w-full touch-manipulation items-center justify-center gap-[11px] text-[14px] font-semibold text-white transition-transform active:scale-95 disabled:opacity-40"
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
