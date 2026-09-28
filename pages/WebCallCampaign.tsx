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
  trapBrowserBack,
  webCallInstallPath,
  webCallLeftPreview,
  webCallOfferPaid,
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
  const [guilt, setGuilt] = useState(
    () => searchParams.get("nudge") === "1",
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
    if (step !== "paywall" || previewOffer || !token || guilt) return;
    let cancelled = false;
    void nextLoggedInWebCallStep({
      organisationId,
      authToken: token,
      coinPackId: context.coinPackId,
      search: location.search,
    }).then((next) => {
      if (cancelled || next === "paywall") return;
      navigate(webCallPathForStep(next, location.search), { replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [
    step,
    previewOffer,
    token,
    guilt,
    organisationId,
    location.search,
    navigate,
    context.coinPackId,
  ]);

  useEffect(() => {
    if (step !== "incoming") return;
    if (hideFakeTrigger) return;
    window.history.pushState({ webCallGuilt: true }, "");
    const onPop = () => setGuilt(true);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [step, hideFakeTrigger]);

  const guiltRef = React.useRef(guilt);
  guiltRef.current = guilt;
  const searchRef = React.useRef(location.search);
  searchRef.current = location.search;

  useEffect(() => {
    if (step !== "paywall") return;
    if (paying || !token) return;
    return trapBrowserBack(() => {
      if (guiltRef.current) {
        const dest = webCallInstallPath(searchRef.current);
        setGuilt(false);
        window.setTimeout(() => {
          navigate(dest, { replace: true });
        }, 0);
        return false;
      }
      guiltRef.current = true;
      setGuilt(true);
    });
  }, [step, paying, token, navigate]);

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
    if (step !== "paywall" || previewOffer || !token) return;
    if (!offer?.already_claimed) return;
    if (webCallOfferPaid()) return;
    navigate(webCallInstallPath(location.search), { replace: true });
  }, [offer, step, previewOffer, token, location.search, navigate]);

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
    navigate(webCallInstallPath(location.search));
  };

  const pay = async () => {
    const token = resolveWebCallToken(organisationId, location.search);
    const packId = offer?.coin_pack_id ?? context.coinPackId;
    if (!token || !packId) return;
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
        {guilt ? (
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
                  setGuilt(false);
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
        variant="purchased"
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
      {guilt ? (
        <WebCallGuiltNudge
          amountLabel={amount}
          posterUrl={preview.profilePicUrl}
          stayLabel={offer?.already_claimed ? "Install the app" : "Recharge Now"}
          onStay={() => {
            setGuilt(false);
            if (offer?.already_claimed) {
              goToInstall();
              return;
            }
            void pay();
          }}
        />
      ) : null}
    </>
  );
}
