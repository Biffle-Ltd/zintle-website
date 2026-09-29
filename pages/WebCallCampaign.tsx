import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { WebCallAutoCallTrigger } from "../components/WebCallAutoCallTrigger";
import { WebCallGuiltNudge } from "../components/WebCallGuiltNudge";
import { WebCallInstallNudge } from "../components/WebCallInstallNudge";
import { WebCallOfferScreen } from "../components/WebCallOfferScreen";
import {
  parseWebCampaignContext,
  persistWebCampaignContextFromSearch,
  saveWebCampaignLink,
  useWebCallFacebookAttribution,
} from "../utils/webCampaign";
import {
  fetchWebCallOffer,
  markWebCallLeftPreview,
  nextLoggedInWebCallStep,
  resolveWebCallToken,
  armBrowserBackTrap,
  listenBrowserBack,
  webCallInstallPath,
  webCallLeftPreview,
  webCallOfferPaid,
  webCallCallFinished,
  readWebCallInstallVariant,
  webCallPathForStep,
  webCallStepPath,
  maybeStripWebCallSecrets,
  WEB_CALL_OFFER_FALLBACK_RUPEES,
  markWebCallOfferPaid,
  waitForWebCallOfferClaimed,
  requireWebCallLogin,
  type WebCallOffer,
} from "../utils/webCall";
import type { AfterCheckoutPollResult } from "../utils/coinCheckoutOptions";
import { pickWebCallPreviewCreator } from "../utils/webCallPreviewCreators";

const BIFFLE_GRADIENT = "linear-gradient(90deg, #7c3aed, #ec4899)";

type PaywallExitSheet = "none" | "guilt" | "install";

function nextPaywallExitSheet(sheet: PaywallExitSheet): PaywallExitSheet {
  switch (sheet) {
    case "none":
      return "guilt";
    case "guilt":
      return "install";
    case "install":
      return "install";
    default: {
      const exhaustive: never = sheet;
      return exhaustive;
    }
  }
}

/** Dummy history entries to push during a tap so later backs can show these sheets. */
function paywallBackTrapDepth(sheet: PaywallExitSheet): number {
  switch (sheet) {
    case "none":
      return 2;
    case "guilt":
      return 1;
    case "install":
      return 1;
    default: {
      const exhaustive: never = sheet;
      return exhaustive;
    }
  }
}

function WebCallRouteWait({
  actionLabel,
  onAction,
}: {
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex h-dvh max-h-dvh flex-col items-center justify-center overflow-hidden overscroll-none bg-white px-6">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-700" />
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-8 text-sm font-semibold text-neutral-700 underline"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

/**
 * M-web whale landing. Fake incoming is logged-out only. After login:
 * gender → language → welcome offer if unclaimed → incoming/room after pay.
 * Returning users who already claimed (empty wallet, no pre-call store) see install.
 */
export function WebCallCampaign({
  organisationId,
  setShowLogin,
  createOrderAndInitiatePayment,
}: {
  organisationId: string;
  setShowLogin: (open: boolean) => void;
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
  ) => Promise<unknown>;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const previewOffer = searchParams.get("preview") === "offer";
  const stepParam = searchParams.get("step");
  const step =
    previewOffer || stepParam === "paywall"
      ? "paywall"
      : stepParam === "install"
        ? "install"
        : "incoming";
  const [exitSheet, setExitSheet] = useState<PaywallExitSheet>(() =>
    searchParams.get("nudge") === "1" ? "guilt" : "none",
  );
  const [routeError, setRouteError] = useState(false);
  const [offer, setOffer] = useState<WebCallOffer | null>(null);
  const [offerReady, setOfferReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [leftPreview, setLeftPreview] = useState(() => webCallLeftPreview());
  const preview = useMemo(() => pickWebCallPreviewCreator(), []);
  const token = resolveWebCallToken(organisationId, location.search);
  const hideFakeTrigger = Boolean(token) || leftPreview;

  const context = parseWebCampaignContext(location.search);
  useWebCallFacebookAttribution(organisationId, location.search, token);

  useEffect(() => {
    maybeStripWebCallSecrets(location.pathname, location.search, navigate);
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    if (step === "paywall" || step === "install" || previewOffer) return;
    const authToken = resolveWebCallToken(organisationId, location.search);
    if (!authToken) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) setRouteError(true);
    }, 12000);
    void nextLoggedInWebCallStep({
      organisationId,
      authToken,
      coinPackId: context.coinPackId,
      search: location.search,
    })
      .then((next) => {
        if (cancelled) return;
        navigate(webCallPathForStep(next, location.search), { replace: true });
      })
      .catch(() => {
        if (!cancelled) setRouteError(true);
      })
      .finally(() => {
        window.clearTimeout(timer);
      });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    step,
    previewOffer,
    organisationId,
    location.search,
    navigate,
    context.coinPackId,
  ]);

  useEffect(() => {
    if ((step !== "paywall" && step !== "install") || token) return;
    persistWebCampaignContextFromSearch(organisationId, location.search);
    requireWebCallLogin(location.pathname, location.search, setShowLogin);
  }, [
    step,
    token,
    organisationId,
    location.pathname,
    location.search,
    setShowLogin,
  ]);

  useEffect(() => {
    if (step !== "paywall" || !token || exitSheet !== "none") return;
    let cancelled = false;
    void nextLoggedInWebCallStep({
      organisationId,
      authToken: token,
      coinPackId: context.coinPackId,
      search: location.search,
    }).then((next) => {
      if (cancelled || next === "paywall") return;
      if (previewOffer && next !== "install") return;
      navigate(webCallPathForStep(next, location.search), { replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [
    step,
    previewOffer,
    token,
    exitSheet,
    organisationId,
    location.search,
    navigate,
    context.coinPackId,
  ]);

  useEffect(() => {
    if (step !== "incoming") return;
    if (hideFakeTrigger) return;
    const unlisten = listenBrowserBack(() => setExitSheet("guilt"));
    const onPointerDown = () => armBrowserBackTrap(1);
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      unlisten();
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [step, hideFakeTrigger]);

  const exitSheetRef = React.useRef(exitSheet);
  exitSheetRef.current = exitSheet;
  const payingRef = React.useRef(paying);
  payingRef.current = paying;

  useEffect(() => {
    if (step !== "paywall" || !token) return;
    const unlisten = listenBrowserBack(
      () => {
        if (payingRef.current) return;
        const next = nextPaywallExitSheet(exitSheetRef.current);
        exitSheetRef.current = next;
        setExitSheet(next);
      },
      { isPaused: () => payingRef.current },
    );
    const onPointerDown = () => {
      if (payingRef.current) return;
      armBrowserBackTrap(paywallBackTrapDepth(exitSheetRef.current));
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      unlisten();
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [step, token]);

  useEffect(() => {
    if (step !== "install" || !token) return;
    const unlisten = listenBrowserBack(() => {
      /* Stay on install — Chrome will leave once these tap-armed entries are gone. */
    });
    const onPointerDown = () => armBrowserBackTrap(1);
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      unlisten();
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [step, token]);

  useEffect(() => {
    if (step !== "paywall") return;
    const authToken = resolveWebCallToken(organisationId, location.search);
    if (!authToken) {
      return;
    }
    let cancelled = false;
    setOfferReady(false);
    const ctx = persistWebCampaignContextFromSearch(
      organisationId,
      location.search,
    );
    void saveWebCampaignLink({
      organisationId,
      authToken,
      context: ctx,
    });
    void fetchWebCallOffer({
      organisationId,
      authToken,
      coinPackId: ctx.coinPackId,
    })
      .then((data) => {
        if (!cancelled) setOffer(data);
      })
      .finally(() => {
        if (!cancelled) setOfferReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [step, organisationId, location.search, token]);

  useEffect(() => {
    if (step !== "paywall" || !token) return;
    if (!offer?.already_claimed) return;
    if (webCallOfferPaid()) return;
    navigate(webCallInstallPath(location.search), { replace: true });
  }, [offer, step, token, location.search, navigate]);

  const startLogin = () => {
    markWebCallLeftPreview();
    setLeftPreview(true);
    persistWebCampaignContextFromSearch(organisationId, location.search);
    requireWebCallLogin(location.pathname, location.search, setShowLogin);
  };

  const goToIncoming = () => {
    const authToken = resolveWebCallToken(organisationId, location.search);
    if (!authToken) {
      persistWebCampaignContextFromSearch(organisationId, location.search);
      requireWebCallLogin(location.pathname, location.search, setShowLogin);
      return;
    }
    navigate(webCallStepPath("incoming", location.search));
  };

  const goToInstall = () => {
    const authToken = resolveWebCallToken(organisationId, location.search);
    if (!authToken) {
      persistWebCampaignContextFromSearch(organisationId, location.search);
      requireWebCallLogin(location.pathname, location.search, setShowLogin);
      return;
    }
    if (step === "paywall") {
      armBrowserBackTrap(paywallBackTrapDepth("install"));
      setExitSheet("install");
      return;
    }
    navigate(webCallInstallPath(location.search));
  };

  const pay = async () => {
    const token = resolveWebCallToken(organisationId, location.search);
    const packId = offer?.coin_pack_id ?? context.coinPackId;
    if (!token || !packId) return;
    armBrowserBackTrap(paywallBackTrapDepth(exitSheetRef.current));
    setPaying(true);
    try {
      const result = await createOrderAndInitiatePayment(
        packId,
        token,
        {
          suppressPaymentStatusPopup: true,
          onCheckoutClosed: () => {
            setPaying(false);
          },
          onAfterCheckoutPoll: async ({ status }) => {
            if ((status || "").toUpperCase() === "SUCCESS") {
              markWebCallOfferPaid();
              await waitForWebCallOfferClaimed({
                organisationId,
                authToken: token,
                coinPackId: packId,
              });
              setPaying(false);
              goToIncoming();
              return;
            }
            setPaying(false);
          },
        },
        organisationId,
      );
      const launched =
        result &&
        typeof result === "object" &&
        "checkoutLaunched" in result &&
        Boolean((result as { checkoutLaunched?: boolean }).checkoutLaunched);
      if (!launched) {
        setPaying(false);
      }
    } catch {
      setPaying(false);
    }
  };

  const offerAmount =
    offer?.amount != null ? Number(offer.amount) : null;
  const amount =
    offerAmount != null && Number.isFinite(offerAmount)
      ? `₹${Math.round(offerAmount)}`
      : `₹${WEB_CALL_OFFER_FALLBACK_RUPEES}`;

  if (step === "incoming") {
    if (hideFakeTrigger) {
      return (
        <WebCallRouteWait
          actionLabel={
            token && !routeError ? undefined : "Log in to continue"
          }
          onAction={token && !routeError ? undefined : startLogin}
        />
      );
    }
    return (
      <>
        <WebCallAutoCallTrigger
          name={preview.name}
          photoUrl={preview.profilePicUrl}
          onAccept={startLogin}
        />
        {exitSheet === "guilt" ? (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 text-left">
              <p className="text-lg font-semibold text-neutral-900">
                Wait — they were just about to pick up
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                Stay and take the {amount} call.
              </p>
              <button
                type="button"
                onClick={() => {
                  setExitSheet("none");
                  startLogin();
                }}
                className="mt-4 w-full rounded-full py-3 text-sm font-semibold text-white"
                style={{ background: BIFFLE_GRADIENT }}
              >
                Accept
              </button>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  if (step === "install") {
    if (!token) {
      return (
        <WebCallRouteWait
          actionLabel="Log in to continue"
          onAction={() =>
            requireWebCallLogin(location.pathname, location.search, setShowLogin)
          }
        />
      );
    }
    return (
      <WebCallInstallNudge
        organisationId={organisationId}
        variant={
          webCallCallFinished() ? readWebCallInstallVariant() : "purchased"
        }
      />
    );
  }

  if (!token) {
    return (
      <WebCallRouteWait
        actionLabel="Log in to continue"
        onAction={() =>
          requireWebCallLogin(location.pathname, location.search, setShowLogin)
        }
      />
    );
  }

  return (
    <>
      <WebCallOfferScreen
        amount={
          offerAmount != null && Number.isFinite(offerAmount)
            ? offerAmount
            : WEB_CALL_OFFER_FALLBACK_RUPEES
        }
        loading={!offerReady}
        paying={paying}
        alreadyClaimed={Boolean(offer?.already_claimed)}
        packMissing={
          offer != null && !offer.coin_pack_id && !context.coinPackId
        }
        onPay={() => void pay()}
        onStartCall={goToInstall}
      />
      {exitSheet === "guilt" ? (
        <WebCallGuiltNudge
          amountLabel={amount}
          posterUrl={preview.profilePicUrl}
          stayLabel={offer?.already_claimed ? "Install the app" : "Recharge Now"}
          onStay={() => {
            if (offer?.already_claimed) {
              armBrowserBackTrap(paywallBackTrapDepth("install"));
              setExitSheet("install");
              return;
            }
            setExitSheet("none");
            void pay();
          }}
        />
      ) : null}
      {exitSheet === "install" ? (
        <div className="fixed inset-0 z-50">
          <WebCallInstallNudge
            organisationId={organisationId}
            variant="purchased"
          />
        </div>
      ) : null}
    </>
  );
}
