import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const [packs, setPacks] = useState<CoinStorePack[]>([]);
  const [selected, setSelected] = useState<CoinStorePack | null>(null);
  const [headerPack, setHeaderPack] = useState<{
    coins: number;
    price: number;
  } | null>(null);
  const [paying, setPaying] = useState(false);
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
        const micropacks = all.filter((p) => p.is_micropack);
        const grid = micropacks.length > 0 ? micropacks : all;
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

  const pay = async () => {
    if (!selected || payingRef.current) return;
    payingRef.current = true;
    setPaying(true);
    try {
      const result = await createOrderAndInitiatePayment(
        selected.id,
        authToken,
        {
          suppressPaymentStatusPopup: true,
          onCheckoutClosed: () => {
            payingRef.current = false;
            setPaying(false);
          },
          onAfterCheckoutPoll: ({ status }) => {
            payingRef.current = false;
            setPaying(false);
            if ((status || "").toUpperCase() === "SUCCESS") onRecharged();
          },
        },
        organisationId,
      );
      if (!result.checkoutLaunched) {
        payingRef.current = false;
        setPaying(false);
      }
    } catch {
      payingRef.current = false;
      setPaying(false);
    }
  };

  const popupProps = {
    packs,
    selectedPackageId: selected?.id ?? null,
    onPackSelect: (pkg: CoinStorePack) => {
      setSelected(pkg);
    },
    onContinue: () => void pay(),
    isMember: false,
    featuredWeeklyPlan: null,
    basicWeeklyPlan: null,
    timerPack: null,
    callContext,
    surface: "in_call_coin_popup" as const,
    headerPack,
    paymentInProgress: paying,
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 overflow-hidden rounded-t-3xl bg-white [&_h2]:pr-12">
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
        ) : isBiffle ? (
          <QuickRechargePopupBiffle {...popupProps} />
        ) : (
          <QuickRechargePopup {...popupProps} />
        )}
      </div>
    </div>
  );
}
