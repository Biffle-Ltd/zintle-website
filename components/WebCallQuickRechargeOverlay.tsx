import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import type { CoinStorePack } from "./CoinStoreMobile";
import { QuickRechargePopup } from "./QuickRechargePopup";
import { QuickRechargePopupBiffle } from "./QuickRechargePopupBiffle";
import { isBiffleOrganisationId } from "../utils/organisationIdFromUrl";
import { fetchCoinPackDetails } from "../utils/coinPacksApi";
import type { AfterCheckoutPollResult } from "../utils/coinCheckoutOptions";
import {
  recommendLowestPackForOneMinute,
  type QuickRechargeCallContext,
} from "../utils/quickRecharge";
import {
  parseCoinPixelContext,
  sendCoinCtaClicked,
  sendCoinPackSelected,
} from "../utils/pixelEvents";
import { toCoinPackForAnalytics } from "../utils/coinStoreVisiblePacks";
import {
  coinCheckoutOpeningLabel,
  getPaymentGatewayFromUrl,
} from "../utils/paymentGateway";
import { retainLockUntilCheckoutSettles } from "../utils/paymentCheckoutIframeLoad";

export function WebCallQuickRechargeOverlay({
  organisationId,
  authToken,
  walletBalance,
  callPrice,
  createOrderAndInitiatePayment,
  onRecharged,
  onClose,
}: {
  organisationId: string;
  authToken: string;
  walletBalance: number;
  callPrice: number;
  createOrderAndInitiatePayment: (
    coinPackId: number | string,
    token?: string | null,
    options?: {
      suppressPaymentStatusPopup?: boolean;
      onCheckoutClosed?: () => void;
      onAfterCheckoutPoll?: (
        result: AfterCheckoutPollResult,
      ) => void | Promise<void>;
    },
    organisationId?: string,
  ) => Promise<{ checkoutLaunched: boolean }>;
  onRecharged: () => void;
  onClose: () => void;
}) {
  const isBiffle = isBiffleOrganisationId(organisationId);
  const location = useLocation();
  const [catalog, setCatalog] = useState<CoinStorePack[]>([]);
  const [showAllPacks, setShowAllPacks] = useState(false);
  const [packs, setPacks] = useState<CoinStorePack[]>([]);
  const [selected, setSelected] = useState<CoinStorePack | null>(null);
  const selectedRef = useRef<CoinStorePack | null>(null);
  const [headerPack, setHeaderPack] = useState<{
    coins: number;
    price: number;
  } | null>(null);
  const [paying, setPaying] = useState(false);
  const [pendingPackId, setPendingPackId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const payingRef = useRef(false);

  const callContext: QuickRechargeCallContext = useMemo(
    () => ({
      walletBalance,
      callPrice,
      callType: "audio",
    }),
    [walletBalance, callPrice],
  );

  useEffect(() => {
    let cancelled = false;
    void fetchCoinPackDetails(organisationId, window.location.search)
      .then((all) => {
        if (cancelled) return;
        setCatalog(all);
        const micropacks = all.filter((p) => p.is_micropack);
        const grid = isBiffle
          ? micropacks.length > 0
            ? micropacks
            : all
          : (() => {
              const featured = all.find(
                (pack) =>
                  !pack.is_micropack && /recommend/i.test(pack.name ?? ""),
              );
              const quick = featured ? [...micropacks, featured] : micropacks;
              return quick.length > 0 ? quick : all;
            })();
        setPacks(grid);
        const recommended = recommendLowestPackForOneMinute(
          callContext,
          grid.map((p) => ({
            id: p.id,
            coins: p.coins,
            price: p.price,
            name: p.name,
            isWeekly: false,
          })),
        );
        const pick =
          grid.find((p) => p.id === recommended?.id) ?? grid[0] ?? null;
        if (pick) {
          selectedRef.current = pick;
          setSelected(pick);
          setHeaderPack({ coins: pick.coins, price: pick.price });
        }
      })
      .catch(() => {
        if (!cancelled) setPacks([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Load packs once when the sheet opens. Wallet ticks must not reset the pick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organisationId]);

  const stopPaying = () => {
    payingRef.current = false;
    setPaying(false);
    setPendingPackId(null);
  };

  const pay = async (pkg?: CoinStorePack) => {
    const target = pkg ?? selectedRef.current;
    if (!target || payingRef.current) return;
    payingRef.current = true;
    setPaying(true);
    setPendingPackId(target.id);
    const handoff = retainLockUntilCheckoutSettles(
      getPaymentGatewayFromUrl() === "PhonePe" ? "phonepe" : "easebuzz",
      stopPaying,
    );
    try {
      const result = await createOrderAndInitiatePayment(
        target.id,
        authToken,
        {
          suppressPaymentStatusPopup: true,
          onCheckoutClosed: handoff.onClosed,
          onAfterCheckoutPoll: ({ status }) => {
            handoff.onClosed();
            if ((status || "").toUpperCase() === "SUCCESS") onRecharged();
          },
        },
        organisationId,
      );
      if (!result.checkoutLaunched) handoff.onClosed();
      else handoff.armGiveUp();
    } catch {
      handoff.onClosed();
    }
  };

  const pixelContext = () => {
    const parsed = parseCoinPixelContext(location.search, location.pathname);
    if (parsed) return parsed;
    if (!authToken) return null;
    const params = new URLSearchParams(location.search);
    params.set("id", authToken);
    params.set("organisation_id", organisationId);
    return parseCoinPixelContext(params.toString(), "/coins");
  };

  const openHistory = () => {
    sendCoinCtaClicked(pixelContext(), { cta: "coin_balance" });
    // Leaving this route hangs up the live call. Native owns the history screen.
    try {
      window.ReactNativeWebView?.postMessage(
        JSON.stringify({ action: "open_coin_history" }),
      );
    } catch {
      // Native history screen is not available in the browser.
    }
  };

  const openMorePacks = () => {
    sendCoinCtaClicked(pixelContext(), { cta: "more_plans" });
    setShowAllPacks(true);
  };

  const choosePack = (pkg: CoinStorePack) => {
    selectedRef.current = pkg;
    setSelected(pkg);
  };

  const popupProps = {
    packs: showAllPacks ? catalog : packs,
    selectedPackageId: selected?.id ?? null,
    onPackSelect: (pkg: CoinStorePack, index: number) => {
      if (payingRef.current) return;
      choosePack(pkg);
      if (isBiffle) return;
      const ctx = pixelContext();
      sendCoinPackSelected(ctx, toCoinPackForAnalytics(pkg), index);
      sendCoinCtaClicked(ctx, {
        cta: "pack",
        pack: toCoinPackForAnalytics(pkg, undefined, { catalogOffer: true }),
      });
    },
    onContinue: (pkg?: CoinStorePack) => {
      const clicked =
        pkg != null && typeof pkg.id === "number" && typeof pkg.price === "number"
          ? pkg
          : undefined;
      if (clicked) choosePack(clicked);
      void pay(clicked);
    },
    isMember: false,
    featuredWeeklyPlan: null,
    basicWeeklyPlan: null,
    timerPack: null,
    callContext,
    surface: "in_call_coin_popup" as const,
    headerPack,
    paymentInProgress: paying,
    pendingPurchase:
      pendingPackId != null
        ? { id: pendingPackId, label: coinCheckoutOpeningLabel() }
        : null,
  };

  if (!isBiffle) {
    return (
      <div className="absolute inset-0 z-20 flex items-end justify-center">
        <button
          type="button"
          className="absolute inset-0 bg-[rgba(255,255,255,0.08)] backdrop-blur-[10px]"
          aria-label="Close"
          onClick={onClose}
        />
        <div className="relative z-10 mb-[max(10px,env(safe-area-inset-bottom))] flex max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-16px)] w-[min(388px,calc(100%-16px))] min-h-0 flex-col">
          <button
            type="button"
            onClick={onClose}
            className="absolute -top-12 right-0 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-[#0A2548] text-white"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark text-xl" aria-hidden />
          </button>
          {loading ? (
            <div className="flex items-center justify-center rounded-[26px] bg-[#011735] py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            </div>
          ) : (
            <QuickRechargePopup
              {...popupProps}
              oneTimeLimit={showAllPacks ? null : 2}
              coinBalance={walletBalance}
              onMorePlans={showAllPacks ? undefined : openMorePacks}
              onOpenCoinHistory={openHistory}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[92dvh] min-h-0 w-full flex-col overflow-hidden rounded-t-3xl bg-white [&_h2]:pr-12">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          aria-label="Close"
        >
          <i className="fa-solid fa-xmark text-xl" aria-hidden />
        </button>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-700" />
          </div>
        ) : (
          <QuickRechargePopupBiffle
            packs={packs}
            selectedPackageId={selected?.id ?? null}
            onPackSelect={(pkg) => {
              if (payingRef.current) return;
              selectedRef.current = pkg;
              setSelected(pkg);
            }}
            onContinue={() => void pay(selectedRef.current ?? undefined)}
            isMember={false}
            featuredWeeklyPlan={null}
            basicWeeklyPlan={null}
            timerPack={null}
            callContext={callContext}
            surface="in_call_coin_popup"
            headerPack={headerPack}
            paymentInProgress={paying}
          />
        )}
      </div>
    </div>
  );
}
