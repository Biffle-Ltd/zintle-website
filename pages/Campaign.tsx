import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { MonetizationPlanDetails } from "./Subscriptions";
import { HOST } from "../utils/host";
import { headerSafeToken } from "../utils/headerSafeToken";
import { ZINTLE_POST_LOGIN_REDIRECT_KEY } from "../utils/postLoginRedirect";
import {
  CampaignCtaDisclaimer,
  CampaignPrimaryCta,
} from "../components/CampaignCta";
import { CampaignVideo } from "../components/CampaignVideo";
import { isBiffleOrganisationId } from "../utils/organisationIdFromUrl";
import { handleCampaignUnauthorized } from "../utils/campaignAuth";
import { getJwtFromStorage } from "../utils/authStorage";
import {
  enrichCampaignPixelContext,
  parseCampaignPixelContext,
  sendCampaignFreeTrialViewed,
} from "../utils/campaignPixelEvents";

const PAGE_BG = "#162a44";
const ACCENT_ORANGE = "#f58220";
const ACCENT_PINK = "#e94e65";

/** Purple → pink (Biffle PRO / CTA). */
const BIFFLE_GRADIENT_H = "linear-gradient(90deg, #7c3aed, #ec4899)";
/** Vertical gradient for headline rupee amount. */
const BIFFLE_GRADIENT_V = "linear-gradient(180deg, #6d28d9, #db2777)";

type FreePlanApiPlan = {
  id: number;
  plan_name?: string;
  plan_description?: string;
  plan_duration?: number;
  price?: string | number;
  is_freetrial_allowed?: boolean;
  free_plan_duration?: number;
  trial_token_amount?: number;
  token_amount?: number;
  extra_info?: { video_url?: string; [key: string]: unknown };
  is_active?: boolean;
  subscription_id?: string;
  organisation_id?: string;
};

type FreePlanInfoResponse = {
  success?: boolean;
  data?: {
    count?: number;
    plans?: FreePlanApiPlan[];
    active_free_plan?: string;
  };
};

function apiPlanToDetails(p: FreePlanApiPlan): MonetizationPlanDetails {
  return {
    id: p.id,
    plan_name: p.plan_name,
    plan_description: p.plan_description,
    plan_duration: p.plan_duration,
    price: p.price,
    is_freetrial_allowed: p.is_freetrial_allowed,
    free_plan_duration: p.free_plan_duration,
    trial_token_amount: p.trial_token_amount,
    token_amount: p.token_amount,
    extra_info: p.extra_info as Record<string, unknown> | undefined,
    is_active: p.is_active,
    subscription_id: p.subscription_id,
    organisation_id: p.organisation_id,
  };
}

function parsePlanPriceNumber(price: string | number | undefined): number {
  if (typeof price === "number" && Number.isFinite(price)) return price;
  if (typeof price === "string" && price.trim() !== "") {
    const n = Number(price);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

function formatPlanPriceInr(price: string | number | undefined): string {
  const n = parsePlanPriceNumber(price);
  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getBillingUnit(
  planDuration: number | undefined,
): "month" | "week" | null {
  if (planDuration === 7) return "week";
  if (planDuration === 30 || planDuration === 31) return "month";
  return null;
}

function getTrialTokenRupee(plan: MonetizationPlanDetails): number {
  const t = plan.trial_token_amount ?? plan.token_amount;
  if (typeof t === "number" && Number.isFinite(t)) return t;
  if (plan.is_freetrial_allowed) return 2;
  return 0;
}

function trialDaysLabel(days: number | undefined): string {
  const d =
    typeof days === "number" && Number.isFinite(days) && days >= 0
      ? Math.floor(days)
      : 0;
  if (d === 1) return "1 day";
  return `${d} days`;
}

export function Campaign({
  organisationId,
  setShowLogin,
}: {
  organisationId: string;
  setShowLogin: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const fbclidFromUrl = searchParams.get("fbclid")?.trim() ?? "";
  const freeTrialViewedSentRef = useRef(false);

  const [activePlan, setActivePlan] = useState<MonetizationPlanDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const rawJwt = getJwtFromStorage(organisationId);
        const jwt = headerSafeToken(rawJwt);
        const r = await fetch(
          `${HOST}/api/v1/monetization/plans/free-plan/info/?source=campaign`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
              "X-Organisation-ID": organisationId,
            },
          },
        );
        const json = (await r.json()) as FreePlanInfoResponse;
        if (cancelled) return;
        if (
          handleCampaignUnauthorized(r.status, organisationId, () =>
            setShowLogin(true),
          )
        ) {
          return;
        }
        if (!r.ok || json.success === false) {
          setActivePlan(null);
          setFetchError("Could not load plan details. Try again later.");
          return;
        }
        const data = json.data;
        const activeKey = data?.active_free_plan?.trim();
        const plans = data?.plans ?? [];
        const picked =
          activeKey != null && activeKey !== ""
            ? plans.find((p) => p.subscription_id === activeKey)
            : null;
        if (!picked) {
          setActivePlan(null);
          setFetchError("No active free plan is configured for this org.");
          return;
        }
        setActivePlan(apiPlanToDetails(picked));
      } catch {
        if (!cancelled) {
          setActivePlan(null);
          setFetchError("Could not load plan details. Try again later.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organisationId]);

  const handleCampaignMediaReady = useCallback(() => {
    if (!activePlan?.id || freeTrialViewedSentRef.current) return;
    freeTrialViewedSentRef.current = true;
    const base = parseCampaignPixelContext(location.search, location.pathname, {
      organisationId,
      plan_id: activePlan.id,
    });
    const ctx = enrichCampaignPixelContext(base, organisationId);
    sendCampaignFreeTrialViewed(ctx, {
      plan_id: activePlan.id,
      plan_name: activePlan.plan_name,
      price: activePlan.price,
      free_plan_duration: activePlan.free_plan_duration,
      trial_token_amount: activePlan.trial_token_amount,
    });
  }, [activePlan, location.pathname, location.search, organisationId]);

  const checkoutPath = useMemo(() => {
    if (!activePlan?.id) return null;
    const params = new URLSearchParams();
    params.set("plan_id", String(activePlan.id));
    params.set("organisation_id", organisationId);
    params.set("is_campaign", "true");
    const wrapped = { data: activePlan };
    params.set("plan_details", encodeURIComponent(JSON.stringify(wrapped)));
    if (fbclidFromUrl) params.set("fbclid", fbclidFromUrl);
    return `/subscriptions?${params.toString()}`;
  }, [activePlan, organisationId, fbclidFromUrl]);

  const canCheckout = checkoutPath != null && !fetchError && !loading;
  const isLoggedIn = !!getJwtFromStorage(organisationId);

  const videoUrl =
    activePlan?.extra_info &&
    typeof activePlan.extra_info.video_url === "string"
      ? activePlan.extra_info.video_url
      : null;

  const trialRupee = activePlan ? getTrialTokenRupee(activePlan) : 0;
  const freeDays = activePlan?.free_plan_duration;
  const billingUnit = activePlan
    ? getBillingUnit(activePlan.plan_duration)
    : null;
  const recurringRight =
    activePlan && billingUnit === "month"
      ? `${formatPlanPriceInr(activePlan.price)} / month`
      : activePlan && billingUnit === "week"
        ? `${formatPlanPriceInr(activePlan.price)} / week`
        : activePlan
          ? formatPlanPriceInr(activePlan.price)
          : "";

  const handleStartFreeTrial = () => {
    if (!checkoutPath) return;
    if (!isLoggedIn) {
      sessionStorage.setItem(ZINTLE_POST_LOGIN_REDIRECT_KEY, checkoutPath);
      setShowLogin(true);
      return;
    }
    navigate(checkoutPath);
  };

  const isBiffle = isBiffleOrganisationId(organisationId);

  const shellClass = `h-dvh max-h-dvh overflow-hidden flex flex-col font-sans antialiased ${
    isBiffle ? "text-gray-800" : "text-white"
  }`;
  const shellStyle: React.CSSProperties = isBiffle
    ? { backgroundColor: "#ffffff" }
    : { backgroundColor: PAGE_BG };

  const innerShellClass = isBiffle
    ? "flex-1 min-h-0 flex flex-col bg-white overflow-hidden"
    : "flex-1 min-h-0 flex flex-col overflow-hidden";

  const footerClass = isBiffle
    ? "shrink-0 z-40 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-gray-100 bg-white flex flex-col items-center gap-2"
    : "shrink-0 z-40 px-5 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-white/10 backdrop-blur-md flex flex-col items-center gap-2";

  const footerStyle: React.CSSProperties | undefined = isBiffle
    ? undefined
    : { backgroundColor: `${PAGE_BG}f2` };

  const logoBlock = (
    <div className="flex flex-col items-center shrink-0 mb-2">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {isBiffle ? (
          <>
            <span
              className="text-2xl font-extrabold tracking-tight text-gray-900 not-italic"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              Biffle
            </span>
            <span
              className="text-xs font-bold uppercase tracking-wide text-white px-2.5 py-1 rounded-md"
              style={{ background: BIFFLE_GRADIENT_H }}
            >
              PRO
            </span>
          </>
        ) : (
          <>
            <span
              className="text-2xl font-extrabold tracking-tight text-white italic"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              ZINTLE
            </span>
            <span
              className="text-xs font-bold uppercase tracking-wide text-white px-2.5 py-1 rounded-md"
              style={{
                background: `linear-gradient(90deg, ${ACCENT_ORANGE}, ${ACCENT_PINK})`,
              }}
            >
              PRO
            </span>
          </>
        )}
      </div>
    </div>
  );

  const priceBlock = activePlan ? (
    <div className="flex justify-center items-baseline gap-1 shrink-0 mb-2">
      <span
        className={`text-2xl font-semibold tabular-nums leading-none ${
          isBiffle ? "text-violet-600" : ""
        }`}
        style={isBiffle ? undefined : { color: ACCENT_PINK }}
      >
        ₹
      </span>
      {isBiffle ? (
        <span
          className="text-[3.25rem] sm:text-6xl font-bold tabular-nums leading-none tracking-tight bg-clip-text text-transparent"
          style={{
            backgroundImage: BIFFLE_GRADIENT_V,
          }}
        >
          {Math.round(trialRupee)}
        </span>
      ) : (
        <span
          className="text-[3.25rem] sm:text-6xl font-bold tabular-nums leading-none tracking-tight"
          style={{ color: ACCENT_PINK }}
        >
          {Math.round(trialRupee)}
        </span>
      )}
    </div>
  ) : null;

  const listBlock = activePlan ? (
    <ul className="space-y-2 shrink-0 mb-2">
      <li className="flex gap-2.5">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            isBiffle
              ? "bg-gray-100 text-gray-600 border border-gray-200/80"
              : "border-2 border-white text-white"
          }`}
        >
          1
        </span>
        {isBiffle ? (
          <p className="text-[13px] leading-snug pt-0.5 text-gray-600">
            <span>Access unlimited for </span>
            <span className="font-semibold text-gray-900">
              {trialDaysLabel(freeDays)} at ₹{Math.round(trialRupee)} only
            </span>
          </p>
        ) : (
          <p className="text-[13px] leading-snug pt-0.5">
            <span className="text-white">Access unlimited for </span>
            <span style={{ color: ACCENT_ORANGE }}>
              {trialDaysLabel(freeDays)} at ₹{Math.round(trialRupee)} only
            </span>
          </p>
        )}
      </li>
      <li className="flex gap-2.5">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            isBiffle
              ? "bg-gray-100 text-gray-600 border border-gray-200/80"
              : "border-2 border-white text-white"
          }`}
        >
          2
        </span>
        {isBiffle ? (
          <p className="text-[13px] leading-snug pt-0.5 text-gray-600">
            <span className="font-semibold text-gray-900">
              {recurringRight}
            </span>
            <span> autopay after {trialDaysLabel(freeDays)}</span>
          </p>
        ) : (
          <p className="text-[13px] leading-snug pt-0.5">
            <span style={{ color: ACCENT_ORANGE }}>{recurringRight}</span>
            <span className="text-white">
              {" "}
              autopay after {trialDaysLabel(freeDays)}
            </span>
          </p>
        )}
      </li>
      <li className="flex gap-2.5">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            isBiffle
              ? "bg-gray-100 text-gray-600 border border-gray-200/80"
              : "border-2 border-white text-white"
          }`}
        >
          3
        </span>
        <p
          className={`text-[13px] leading-snug pt-0.5 line-clamp-2 ${
            isBiffle ? "text-gray-600" : "text-white"
          }`}
        >
          {activePlan.plan_description?.trim() ||
            "Enjoy unlimited or cancel anytime"}
        </p>
      </li>
    </ul>
  ) : null;

  const videoShellClass = isBiffle
    ? "h-full max-h-full aspect-[9/16] w-auto max-w-full rounded-2xl overflow-hidden shadow-lg shadow-black/15 ring-1 ring-gray-200/90 bg-gray-100"
    : "h-full max-h-full aspect-[9/16] w-auto max-w-full rounded-2xl overflow-hidden shadow-xl shadow-black/40 ring-1 ring-white/10 bg-black/20";

  const videoBlock =
    activePlan || loading ? (
      <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center py-1">
        {loading ? (
          <div
            className={`h-full max-h-full aspect-[9/16] w-auto max-w-full rounded-2xl animate-pulse ${isBiffle ? "bg-gray-100" : "bg-white/10"}`}
          />
        ) : activePlan ? (
          <div className={videoShellClass}>
            {videoUrl ? (
              <CampaignVideo
                src={videoUrl}
                className="h-full w-full object-cover object-top block"
                playsInline
                muted
                loop
                autoPlay
                preload="auto"
                onMediaReady={handleCampaignMediaReady}
              />
            ) : (
              <img
                src="/campaign-pro-hero.png"
                alt=""
                className="h-full w-full object-cover object-top block"
                loading="lazy"
                onLoad={handleCampaignMediaReady}
              />
            )}
          </div>
        ) : null}
      </div>
    ) : null;

  const hintClass = isBiffle
    ? "text-center text-xs text-gray-500 px-2 line-clamp-2"
    : "text-center text-xs text-white/60 px-2 line-clamp-2";

  const hintStrongClass = isBiffle
    ? "text-gray-800 font-medium"
    : "text-white/90 font-medium";

  return (
    <div className={shellClass} style={shellStyle}>
      <main className="flex-1 min-h-0 w-full max-w-lg mx-auto flex flex-col overflow-hidden px-4 pt-3">
        <div className={innerShellClass}>
          <div
            className="flex-1 min-h-0 flex flex-col overflow-hidden"
          >
            {logoBlock}

            {loading ? (
              <div className="animate-pulse flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
                <div className="flex justify-center gap-2 shrink-0">
                  <div
                    className={`h-10 w-20 rounded-lg ${isBiffle ? "bg-gray-100" : "bg-white/10"}`}
                  />
                  <div
                    className={`h-10 w-16 rounded-lg ${isBiffle ? "bg-gray-100" : "bg-white/10"}`}
                  />
                </div>
                <div className="space-y-2 shrink-0">
                  <div
                    className={`h-3 w-full rounded ${isBiffle ? "bg-gray-100" : "bg-white/10"}`}
                  />
                  <div
                    className={`h-3 w-full rounded ${isBiffle ? "bg-gray-100" : "bg-white/10"}`}
                  />
                  <div
                    className={`h-3 w-5/6 rounded ${isBiffle ? "bg-gray-100" : "bg-white/10"}`}
                  />
                </div>
                {videoBlock}
              </div>
            ) : fetchError ? (
              <p
                className={`text-center text-sm px-2 shrink-0 line-clamp-4 ${
                  isBiffle ? "text-red-600" : "text-red-300/90"
                }`}
              >
                {fetchError}
              </p>
            ) : activePlan ? (
              <>
                {priceBlock}
                {listBlock}
                {videoBlock}
              </>
            ) : null}
          </div>

          <div className={footerClass} style={footerStyle}>
            {!canCheckout && !loading && (
              <p className={hintClass}>
                Add <span className={hintStrongClass}>target_app</span> to the
                URL to start checkout after login.
              </p>
            )}
            <div className="w-full flex flex-col items-stretch gap-2">
              <CampaignPrimaryCta
                isBiffle={isBiffle}
                disabled={!canCheckout}
                onClick={handleStartFreeTrial}
              >
                Start Free Trial
              </CampaignPrimaryCta>
              {canCheckout && <CampaignCtaDisclaimer isBiffle={isBiffle} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
