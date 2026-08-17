import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getJwtFromStorage } from "../utils/authStorage";
import {
  DEFAULT_ORGANISATION_ID,
  getOrganisationIdFromSearch,
} from "../utils/organisationIdFromUrl";
import type { AfterCheckoutPollResult } from "../utils/coinCheckoutOptions";
import {
  type CoinPackForAnalytics,
  parseCoinPixelContext,
  sendWelcomeBackOfferViewed,
  type WelcomeBackCoinPackForAnalytics,
} from "../utils/pixelEvents";
import {
  computeComparePrice,
  fetchWelcomeBackOffer,
  formatWelcomeBackPrice,
  isClearPaymentStatus,
  parseCoinPackFromUrl,
  type WelcomeBackCoinPack,
} from "../utils/welcomeBackOffer";

const CTA_GRADIENT = "linear-gradient(90deg, #EF68FF 0%, #7E1AFC 100%)";

function toCoinPackForAnalytics(pack: WelcomeBackCoinPack): CoinPackForAnalytics {
  return {
    id: pack.id,
    name: pack.name,
    coins: pack.coin_value,
    price: pack.amount,
    bonus_coins: pack.bonus_coins ?? 0,
  };
}

function toWelcomeBackPackAnalytics(
  pack: WelcomeBackCoinPack,
): WelcomeBackCoinPackForAnalytics {
  return {
    id: pack.id,
    name: pack.name,
    amount: pack.amount,
    coin_value: pack.coin_value,
  };
}

function WelcomeBackPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-0 w-full flex-1 overflow-y-auto overscroll-y-contain bg-white sm:flex sm:min-h-dvh sm:justify-center sm:bg-[#F3F4F6]">
      <div className="flex min-h-full w-full max-w-md flex-col bg-white sm:max-w-lg sm:min-h-dvh sm:shadow-lg sm:ring-1 sm:ring-black/5">
        {children}
      </div>
    </div>
  );
}

type PageState = "loading" | "eligible" | "ineligible" | "error";

type WelcomeBackOfferProps = {
  organisationId: string;
  createOrderAndInitiatePayment: (
    coinPackId: number | string,
    token?: string | null,
    options?: {
      trackCoinPixels?: boolean;
      pixelContext?: ReturnType<typeof parseCoinPixelContext>;
      coinPack?: CoinPackForAnalytics;
      onCheckoutClosed?: () => void;
      suppressPaymentStatusPopup?: boolean;
      onAfterCheckoutPoll?: (
        result: AfterCheckoutPollResult,
      ) => void | Promise<void>;
    },
    organisationId?: string,
  ) => Promise<{ checkoutLaunched: boolean }>;
  onPaymentStatus: (status: string) => void;
};

function IneligibleView({ onGoToCoinStore }: { onGoToCoinStore: () => void }) {
  return (
    <WelcomeBackPageShell>
      <div className="flex flex-col items-center justify-center px-6 py-10 sm:flex-1">
        <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#F3E8FF]">
          <i
            className="fa-solid fa-gift text-3xl text-[#9333EA]"
            aria-hidden
          />
        </div>
        <h1 className="text-[22px] font-bold text-[#1A1A2E]">
          Offer already claimed
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[#6B7280]">
          You&apos;ve already purchased the welcome back offer once and cannot
          purchase it again. Head to the coin store to purchase more coin packs.
        </p>
        <button
          type="button"
          onClick={onGoToCoinStore}
          className="mt-8 w-full rounded-2xl py-4 text-[16px] font-bold text-white shadow-lg"
          style={{ background: CTA_GRADIENT }}
        >
          Go to Coin Store
        </button>
        </div>
      </div>
    </WelcomeBackPageShell>
  );
}

function OfferView({
  coinPack,
  purchasing,
  onPurchase,
}: {
  coinPack: WelcomeBackCoinPack;
  purchasing: boolean;
  onPurchase: () => void;
}) {
  const currencySymbol = coinPack.currency_symbol ?? "₹";
  const offerPrice = Math.round(coinPack.amount);
  const comparePrice = computeComparePrice(coinPack.amount);

  return (
    <WelcomeBackPageShell>
      <div className="flex min-h-full flex-col">
        <div className="w-full shrink-0 pt-2 sm:pt-0 [@media(min-height:720px)]:pt-6">
          <img
            src="/welcome-back-offer/hero.png"
            alt="Welcome back"
            className="mx-auto block h-auto w-full max-h-[min(42dvh,360px)] object-contain object-top [@media(min-height:720px)]:max-h-[min(48dvh,420px)]"
          />
          <div className="px-6 pt-1 text-center [@media(min-height:720px)]:pt-2">
            <p className="text-[14px] font-medium text-[#4A4A5A] [@media(min-height:720px)]:text-[15px]">
              Not ready to commit?
            </p>
            <p className="mt-0.5 text-[20px] font-bold leading-tight text-[#1A1A2E] [@media(min-height:720px)]:text-[22px]">
              Keep going for just{" "}
              {formatWelcomeBackPrice(coinPack.amount, currencySymbol)}
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 [@media(min-height:720px)]:pt-6">
          <div className="mx-auto flex items-center gap-3 rounded-2xl border border-[#E8B4E8] bg-[#F8F0FC] px-5 py-2.5">
            <span className="text-[26px] font-bold text-[#1A1A2E] [@media(min-height:720px)]:text-[28px]">
              {formatWelcomeBackPrice(coinPack.amount, currencySymbol)}
            </span>
            <span className="text-[15px] text-[#9CA3AF] line-through [@media(min-height:720px)]:text-[16px]">
              {formatWelcomeBackPrice(comparePrice, currencySymbol)}
            </span>
            <span className="rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[11px] font-semibold text-[#16A34A]">
              One time
            </span>
          </div>

          <p className="mt-3 text-center text-[12px] text-[#9CA3AF]">
            <span className="text-[#9333EA]">•</span> One-time payment • No
            subscription or auto-debit
          </p>

          <div className="mt-auto pt-4 [@media(min-height:720px)]:pt-8">
            <button
              type="button"
              onClick={onPurchase}
              disabled={purchasing}
              className="w-full rounded-2xl py-3.5 text-[17px] font-bold text-white shadow-lg transition-opacity disabled:opacity-60"
              style={{ background: CTA_GRADIENT }}
            >
              {purchasing ? (
                <span className="inline-flex items-center gap-2">
                  <i className="fa-solid fa-spinner fa-spin" aria-hidden />
                  Processing…
                </span>
              ) : (
                `Get the Pack of ${offerPrice}`
              )}
            </button>

            <div className="mt-2 flex items-start gap-2.5 rounded-xl bg-[#FFF8E1] px-3.5 py-3">
              <img
                src="/welcome-back-offer/card-icon.svg"
                alt=""
                className="mt-0.5 h-4 w-5 shrink-0"
                aria-hidden
              />
              <p className="text-[11px] leading-snug text-[#4A4A5A]">
                One-time payment via UPI or card. No mandate, no recurring
                charge.
              </p>
            </div>
          </div>
        </div>
      </div>
    </WelcomeBackPageShell>
  );
}

export function WelcomeBackOffer({
  organisationId,
  createOrderAndInitiatePayment,
  onPaymentStatus,
}: WelcomeBackOfferProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [coinPack, setCoinPack] = useState<WelcomeBackCoinPack | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const paymentInProgressRef = useRef(false);
  const welcomeBackViewedSentRef = useRef(false);

  const pixelContext = useMemo(
    () => parseCoinPixelContext(location.search, location.pathname),
    [location.search, location.pathname],
  );

  const resolvedOrgId = useMemo(
    () => getOrganisationIdFromSearch(location.search, location.pathname),
    [location.search, location.pathname],
  );
  const orgId = organisationId || resolvedOrgId;

  const token = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("id") || getJwtFromStorage(orgId);
  }, [location.search, orgId]);

  const loadOffer = useCallback(
    async (signal?: AbortSignal) => {
      setErrorMessage(null);
      try {
        const response = await fetchWelcomeBackOffer(token, orgId, signal);
        if (!response.success) {
          throw new Error("Failed to load offer");
        }
        if (!response.data.is_eligible) {
          setPageState("ineligible");
          setCoinPack(null);
          return;
        }
        const apiPack = response.data.coin_pack;
        if (!apiPack) {
          setPageState("error");
          setErrorMessage("Offer details are unavailable. Please try again.");
          setCoinPack(null);
          return;
        }
        setCoinPack(apiPack);
        setPageState("eligible");
      } catch {
        if (signal?.aborted) return;
        setPageState("error");
        setErrorMessage(
          "Could not load the welcome back offer. Please try again.",
        );
        setCoinPack(null);
      }
    },
    [token, orgId],
  );

  useEffect(() => {
    const urlPack = parseCoinPackFromUrl(location.search);
    if (urlPack) {
      setCoinPack(urlPack);
      setPageState("eligible");
      return;
    }

    const controller = new AbortController();
    void loadOffer(controller.signal);
    return () => controller.abort();
  }, [location.search, loadOffer]);

  useEffect(() => {
    if (
      pageState === "loading" ||
      welcomeBackViewedSentRef.current ||
      !pixelContext
    ) {
      return;
    }

    welcomeBackViewedSentRef.current = true;

    const coin_pack =
      pageState === "eligible" && coinPack
        ? toWelcomeBackPackAnalytics(coinPack)
        : null;

    if (pageState === "error") {
      sendWelcomeBackOfferViewed(pixelContext, { load_error: true, coin_pack: null });
      return;
    }

    sendWelcomeBackOfferViewed(pixelContext, {
      is_eligible: pageState === "eligible",
      coin_pack,
    });
  }, [pageState, coinPack, pixelContext]);

  const handleGoToCoinStore = useCallback(() => {
    const q = new URLSearchParams();
    if (token) q.set("id", token);
    if (orgId && orgId !== DEFAULT_ORGANISATION_ID) {
      q.set("organisation_id", orgId);
    }
    const suffix = q.toString() ? `?${q.toString()}` : "";
    navigate(`/coins${suffix}`);
  }, [navigate, token, orgId]);

  const handleAfterCheckoutPoll = useCallback(
    async (result: { status: string | undefined; timedOut: boolean }) => {
      const { status, timedOut } = result;
      setPurchasing(false);
      paymentInProgressRef.current = false;

      // Clear SUCCESS / FAILED → payment popup only.
      if (isClearPaymentStatus(status)) {
        onPaymentStatus(status!);
        return;
      }

      // Grey area (PENDING, CANCELLED, UNKNOWN, poll timeout, etc.) → re-fetch offer.
      const greyStatus = status || (timedOut ? "PENDING" : "UNKNOWN");

      try {
        const response = await fetchWelcomeBackOffer(token, orgId);
        if (!response.data.is_eligible) {
          onPaymentStatus(greyStatus);
          setPageState("ineligible");
          setCoinPack(null);
          return;
        }
        onPaymentStatus(greyStatus);
      } catch {
        onPaymentStatus(greyStatus);
      }
    },
    [token, orgId, onPaymentStatus],
  );

  const handlePurchase = useCallback(async () => {
    if (!coinPack?.id || paymentInProgressRef.current) return;
    paymentInProgressRef.current = true;
    setPurchasing(true);

    try {
      const result = await createOrderAndInitiatePayment(
        coinPack.id,
        token,
        {
          trackCoinPixels: true,
          pixelContext,
          coinPack: toCoinPackForAnalytics(coinPack),
          onCheckoutClosed: () => {
            /* purchasing cleared in onAfterCheckoutPoll */
          },
          suppressPaymentStatusPopup: true,
          onAfterCheckoutPoll: handleAfterCheckoutPoll,
        },
        orgId,
      );
      if (!result.checkoutLaunched) {
        paymentInProgressRef.current = false;
        setPurchasing(false);
      }
    } catch (e) {
      console.error("Welcome back purchase failed", e);
      paymentInProgressRef.current = false;
      setPurchasing(false);
    }
  }, [
    coinPack,
    token,
    orgId,
    pixelContext,
    createOrderAndInitiatePayment,
    handleAfterCheckoutPoll,
  ]);

  if (pageState === "loading") {
    return (
      <WelcomeBackPageShell>
        <div className="flex items-center justify-center py-20 sm:flex-1 sm:py-0">
          <div className="flex items-center gap-2 text-[#6B7280]">
            <i className="fa-solid fa-spinner fa-spin" aria-hidden />
            <span className="text-sm">Loading offer…</span>
          </div>
        </div>
      </WelcomeBackPageShell>
    );
  }

  if (pageState === "ineligible") {
    return <IneligibleView onGoToCoinStore={handleGoToCoinStore} />;
  }

  if (pageState === "error") {
    return (
      <WelcomeBackPageShell>
        <div className="flex flex-col items-center justify-center px-6 py-10 sm:flex-1">
          <div className="flex w-full max-w-sm flex-col items-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FEE2E2]">
              <i
                className="fa-solid fa-circle-exclamation text-3xl text-[#DC2626]"
                aria-hidden
              />
            </div>
            <h1 className="text-[22px] font-bold text-[#1A1A2E]">
              Couldn&apos;t load offer
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-[#6B7280]">
              {errorMessage ??
                "Something went wrong while loading the welcome back offer. Please try again."}
            </p>
            <button
              type="button"
              onClick={() => {
                setPageState("loading");
                void loadOffer();
              }}
              className="mt-8 w-full rounded-2xl py-4 text-[16px] font-bold text-white shadow-lg"
              style={{ background: CTA_GRADIENT }}
            >
              Try again
            </button>
          </div>
        </div>
      </WelcomeBackPageShell>
    );
  }

  if (!coinPack) {
    return null;
  }

  return (
    <OfferView
      coinPack={coinPack}
      purchasing={purchasing}
      onPurchase={() => void handlePurchase()}
    />
  );
}
