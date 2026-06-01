import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CampaignPaymentFailedModal } from "../components/CampaignPaymentFailedModal";
import { CampaignPaymentSuccessModal } from "../components/CampaignPaymentSuccessModal";
import { CampaignPaymentWaitingModal } from "../components/CampaignPaymentWaitingModal";
import { CampaignPaymentMethodLogo } from "../components/PaymentMethodLogos";
type PaymentInstrumentType = "UPI_COLLECT" | "UPI_INTENT" | "UPI_QR";
type DeviceOS = "IOS" | "ANDROID";
import { HOST } from "../utils/host";
import { headerSafeToken } from "../utils/headerSafeToken";
import { triggerCampaignFbRedirect } from "../utils/campaignFbRedirect";
import { getOrganisationIdFromSearch } from "../utils/organisationIdFromUrl";
import { getJwtFromStorage } from "../utils/authStorage";
import { getLoginPhoneForOrganisation } from "../utils/loginContactStorage";
import {
  fetchMandateStatus,
  isMandateActive,
  isMandateFailure,
  isMandateInitiated,
  MANDATE_STATUS_POLL_INTERVAL_MS,
  type MandateStatusData,
} from "../utils/mandateStatus";
import {
  openMandateRedirectUrl,
  resolveMandateRedirectUrl,
  UPI_APP_PACKAGES,
} from "../utils/upiMandateLaunch";

// NOTE: Plan listing is disabled. Plan UI uses `plan_details` (URL JSON) when
// present, else GET /plans/{plan_id}/details/.
// type Plan = {
//   id: number;
//   plan_name: string;
//   subscription_id: string;
//   price: number;
//   plan_duration: number;
//   is_freetrial_allowed: boolean;
// };

type MandateInitResponse = {
  id: number;
  mandate_uuid: string;
  payment_gateway: string;
  pg_mandate_id: string;
  mandate_state: string;
  organisation_id: number;
  pg_info?: {
    success?: boolean;
    code?: string | null;
    message?: string;
    data?: {
      redirectType?: string;
      redirectUrl?: string | null;
      code?: string | null;
      [key: string]: any;
    };
    [key: string]: any;
  };
};

/** POST /mandate/initiate/ envelope (success and error). */
type MandateInitiateApiResponse = {
  success: boolean;
  data: MandateInitResponse | null;
  error_message?: string;
  error_code?: string;
  organisation_id?: string;
};

const PAY_SECURE_GREEN = "#34C759";
const CAMPAIGN_PAYMENT_FAILED_DEFAULT_MESSAGE =
  "Please try again or try changing the payment method. Any money deducted will be refunded in 5-7 days.";
const CAMPAIGN_PAYMENT_SUCCESS_DEFAULT_MESSAGE =
  "Your subscription is now active.";

type CampaignPaymentOutcome =
  | { type: "success"; message: string }
  | { type: "failed"; message: string };

function resolveCampaignOutcomeFromStatus(
  result: MandateStatusData,
): CampaignPaymentOutcome {
  const state = result.mandate_state;
  if (isMandateActive(state)) {
    return {
      type: "success",
      message: CAMPAIGN_PAYMENT_SUCCESS_DEFAULT_MESSAGE,
    };
  }
  return {
    type: "failed",
    message: isMandateFailure(state)
      ? CAMPAIGN_PAYMENT_FAILED_DEFAULT_MESSAGE
      : `Payment could not be completed (status: ${state}).`,
  };
}

const PAY_CARD_BG = "#1E1E21";

/** Plan object from GET /api/v1/monetization/plans/{id}/details/ */
export type MonetizationPlanDetails = {
  id?: number;
  plan_name?: string;
  plan_description?: string;
  plan_duration?: number;
  price?: string | number;
  is_freetrial_allowed?: boolean;
  free_plan_duration?: number;
  trial_token_amount?: number;
  token_amount?: number;
  extra_info?: Record<string, unknown>;
  is_active?: boolean;
  subscription_id?: string;
  organisation_id?: string;
  coin_value?: number;
};

function unwrapPlanDetailsJson(json: unknown): MonetizationPlanDetails | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const inner = o.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return inner as MonetizationPlanDetails;
  }
  if (
    "plan_duration" in o ||
    "price" in o ||
    typeof o.id === "number"
  ) {
    return o as MonetizationPlanDetails;
  }
  return null;
}

/** URI-encoded JSON in query `plan_details` (same pattern as `user` on /coins). */
function parsePlanDetailsFromUrlSearch(
  search: string,
): MonetizationPlanDetails | null {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const raw = params.get("plan_details");
  if (!raw || !String(raw).trim()) return null;
  try {
    const decoded = decodeURIComponent(raw.replace(/\+/g, " "));
    const parsed: unknown = JSON.parse(decoded);
    return unwrapPlanDetailsJson(parsed);
  } catch {
    return null;
  }
}

function parsePlanPriceNumber(price: string | number | undefined): number {
  if (typeof price === "number" && Number.isFinite(price)) return price;
  if (typeof price === "string" && price.trim() !== "") {
    const n = Number(price);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

/** e.g. ₹ 199.00 with en-IN grouping */
function formatPlanPriceInr(price: string | number | undefined): string {
  const n = parsePlanPriceNumber(price);
  return `₹ ${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatRupeeWhole(n: number): string {
  return `₹ ${Math.round(n).toLocaleString("en-IN")}`;
}

function getBillingUnit(
  planDuration: number | undefined,
): "month" | "week" | null {
  if (planDuration === 7) return "week";
  if (planDuration === 30 || planDuration === 31) return "month";
  return null;
}

function formatRecurringRight(plan: MonetizationPlanDetails): string {
  const unit = getBillingUnit(plan.plan_duration);
  const pricePart = formatPlanPriceInr(plan.price);
  if (unit === "month") return `${pricePart}/month`;
  if (unit === "week") return `${pricePart}/week`;
  return pricePart;
}

function addFreePlanEndDate(plan: MonetizationPlanDetails): Date {
  const raw = plan.free_plan_duration;
  const addDays =
    typeof raw === "number" && Number.isFinite(raw) && raw >= 0
      ? Math.floor(raw)
      : 0;
  const d = new Date();
  d.setDate(d.getDate() + addDays);
  return d;
}

/** e.g. "Starting 30 May, 2026" after free trial ends. */
function formatStartingOnDateLabel(plan: MonetizationPlanDetails): string {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(addFreePlanEndDate(plan));
  return `Starting ${formatted}`;
}

function getTrialTokenRupee(plan: MonetizationPlanDetails): number {
  const t = plan.trial_token_amount ?? plan.token_amount;
  if (typeof t === "number" && Number.isFinite(t)) return t;
  if (plan.is_freetrial_allowed) return 2;
  return 0;
}

function formatFutureBillingRight(plan: MonetizationPlanDetails): string {
  const price = formatPlanPriceInr(plan.price);
  const pd = plan.plan_duration;
  if (pd === 90) return `${price} / 3 Months`;
  const unit = getBillingUnit(pd);
  if (unit === "month") return `${price}/month`;
  if (unit === "week") return `${price}/week`;
  return formatRecurringRight(plan);
}

function autopayFooterText(plan: MonetizationPlanDetails): string {
  const pd = plan.plan_duration;
  if (pd === 90) return "Autopay every 3 Months, Cancel anytime.";
  const unit = getBillingUnit(pd);
  if (unit === "week") return "Autopay every week. Cancel anytime.";
  if (unit === "month") return "Autopay every month. Cancel anytime.";
  if (pd != null && pd > 0)
    return `Autopay every ${pd} days. Cancel anytime.`;
  return "Autopay. Cancel anytime.";
}

function parseUserFromSearch(search: string): {
  email: string;
  phone: string;
} {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const raw = params.get("user");
  if (!raw?.trim()) return { email: "", phone: "" };
  try {
    const decoded = decodeURIComponent(raw.replace(/\+/g, " "));
    const user = JSON.parse(decoded) as Record<string, unknown>;
    return {
      email: user?.email != null ? String(user.email).trim() : "",
      phone:
        user?.phone_number != null
          ? String(user.phone_number).replace(/\D/g, "")
          : "",
    };
  } catch {
    return { email: "", phone: "" };
  }
}

function resolveUserContact(
  search: string,
  organisationId: string,
): { email: string; phone: string } {
  const fromUrl = parseUserFromSearch(search);
  const storedPhone = getLoginPhoneForOrganisation(organisationId);
  return {
    email: fromUrl.email,
    phone: fromUrl.phone || storedPhone,
  };
}

function hasPaySecureContact(contact: { email: string; phone: string }): boolean {
  return Boolean(contact.email.trim() || contact.phone.trim());
}

function formatContactPhoneDisplay(phoneDigits: string): string {
  const digits = phoneDigits.replace(/\D/g, "");
  if (digits.length === 10) return `+91-${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return digits ? `+${digits}` : "";
}

function PaySecureTimelineCard({ plan }: { plan: MonetizationPlanDetails }) {
  const hasFreeTrial = plan.is_freetrial_allowed === true;
  const recurringPrice = formatFutureBillingRight(plan);
  const trialPrice = formatRupeeWhole(getTrialTokenRupee(plan));
  const todayPrice = hasFreeTrial ? trialPrice : recurringPrice;

  const greenRow = (label: string, price: string) => (
    <div className="flex min-w-0 flex-1 items-start justify-between gap-3 pb-1">
      <span
        className="text-sm font-medium"
        style={{ color: PAY_SECURE_GREEN }}
      >
        {label}
      </span>
      <span
        className="shrink-0 text-sm font-semibold tabular-nums"
        style={{ color: PAY_SECURE_GREEN }}
      >
        {price}
      </span>
    </div>
  );

  return (
    <div
      className="overflow-hidden rounded-2xl shadow-lg shadow-black/40"
      style={{ backgroundColor: PAY_CARD_BG }}
    >
      <div className="px-4 pt-4 pb-3">
        <div className="flex gap-3">
          <div className="flex w-5 shrink-0 flex-col items-center">
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: PAY_SECURE_GREEN }}
            />
            <div
              className={`min-h-[28px] w-0.5 flex-1 ${
                hasFreeTrial ? "" : "bg-white/20"
              }`}
              style={
                hasFreeTrial
                  ? { backgroundColor: PAY_SECURE_GREEN }
                  : undefined
              }
            />
          </div>
          {greenRow("Starting Today", todayPrice)}
        </div>

        {hasFreeTrial && (
          <div className="flex gap-3">
            <div className="flex w-5 shrink-0 flex-col items-center">
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: PAY_SECURE_GREEN }}
              />
              <div className="min-h-[28px] w-0.5 flex-1 bg-white/20" />
            </div>
            {greenRow("Get Refunded Today", trialPrice)}
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex w-5 shrink-0 flex-col items-center pt-0.5">
            <div className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-white/50 bg-transparent" />
          </div>
          <div className="flex min-w-0 flex-1 items-start justify-between gap-3 text-sm text-white/55">
            <span>{formatStartingOnDateLabel(plan)}</span>
            <span className="shrink-0 text-right tabular-nums">
              {recurringPrice}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2.5 border-t border-white/[0.08] bg-black/25 px-4 py-3">
        <i
          className="fa-solid fa-arrows-rotate mt-0.5 shrink-0 text-white"
          aria-hidden
        />
        <p className="text-sm leading-snug text-white">
          {autopayFooterText(plan)}
        </p>
      </div>
    </div>
  );
}

function PaySecureHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${PAY_SECURE_GREEN}22` }}
        >
          <i
            className="fa-solid fa-shield-halved text-sm"
            style={{ color: PAY_SECURE_GREEN }}
            aria-hidden
          />
        </span>
        <h2 className="text-base font-semibold tracking-tight text-white">
          Pay Securely
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10"
        aria-label="Close"
      >
        <i className="fa-solid fa-xmark text-lg" aria-hidden />
      </button>
    </div>
  );
}

function PaySecureNotifyBanner() {
  return (
    <div
      className="mt-3 flex items-start gap-2 text-sm leading-snug"
      style={{ color: PAY_SECURE_GREEN }}
    >
      <i className="fa-solid fa-circle-check mt-0.5 shrink-0" aria-hidden />
      <p>We will notify you 24hrs before auto debit happens.</p>
    </div>
  );
}

function PaySecureActivationBox() {
  return (
    <div
      className="mt-3 rounded-2xl px-4 py-3 text-left text-sm leading-snug text-white"
      style={{ backgroundColor: PAY_CARD_BG }}
    >
      Subscription will be activated on
    </div>
  );
}

function PaySecureContactRow({
  email,
  phone,
}: {
  email: string;
  phone: string;
}) {
  const phoneDisplay = formatContactPhoneDisplay(phone);
  const display = email.trim() || phoneDisplay;
  if (!display) return null;
  const showPhone = !email.trim() && Boolean(phoneDisplay);

  return (
    <div className="mt-3 flex items-center gap-2.5 text-sm text-white/85">
      <i
        className={`shrink-0 text-white/60 ${
          showPhone ? "fa-solid fa-phone" : "fa-regular fa-envelope"
        }`}
        aria-hidden
      />
      <span className="min-w-0 truncate">{display}</span>
    </div>
  );
}

export type CampaignPaymentMethod =
  | "phonepe"
  | "paytm"
  | "gpay"
  | "other_upi";
  // | "qr" — hidden for now

type MandateInitOptions = {
  targetAppOverride?: string;
  campaignMethod?: CampaignPaymentMethod;
};

function CampaignPaymentSectionHeader({ label }: { label: string }) {
  return (
    <div
      className="rounded-xl px-3.5 py-2"
      style={{ backgroundColor: PAY_CARD_BG }}
    >
      <span className="text-xs font-semibold text-white">{label}</span>
    </div>
  );
}

function CampaignPaymentOptionRow({
  icon,
  label,
  badge,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 py-1 text-left disabled:opacity-50"
    >
      {icon}
      <span className="min-w-0 flex-1 text-sm font-medium text-white">
        {label}
      </span>
      {badge ? (
        <span
          className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{
            backgroundColor: `${PAY_SECURE_GREEN}22`,
            color: PAY_SECURE_GREEN,
          }}
        >
          <i className="fa-solid fa-bolt text-[9px]" aria-hidden />
          {badge}
        </span>
      ) : null}
      <i
        className="fa-solid fa-chevron-right shrink-0 text-sm text-white/35"
        aria-hidden
      />
    </button>
  );
}

function CampaignPaymentMethods({
  disabled,
  onSelect,
}: {
  disabled?: boolean;
  onSelect?: (method: CampaignPaymentMethod) => void;
}) {
  return (
    <div className="mt-4 space-y-2 pb-4">
      <CampaignPaymentSectionHeader label="UPI" />
      <div className="space-y-0.5 px-1">
        <CampaignPaymentOptionRow
          icon={<CampaignPaymentMethodLogo variant="phonepe" />}
          label="PhonePe"
          badge="Quickest"
          disabled={disabled}
          onClick={() => onSelect?.("phonepe")}
        />
        <CampaignPaymentOptionRow
          icon={<CampaignPaymentMethodLogo variant="paytm" />}
          label="PayTM"
          disabled={disabled}
          onClick={() => onSelect?.("paytm")}
        />
        <CampaignPaymentOptionRow
          icon={<CampaignPaymentMethodLogo variant="gpay" />}
          label="GPay"
          disabled={disabled}
          onClick={() => onSelect?.("gpay")}
        />
        <CampaignPaymentOptionRow
          icon={<CampaignPaymentMethodLogo variant="upi" />}
          label="Other UPI Apps"
          disabled={disabled}
          onClick={() => onSelect?.("other_upi")}
        />
      </div>

      {/* QR Code — hidden for now
      <CampaignPaymentSectionHeader label="QR Code" />
      <div className="px-1">
        <CampaignPaymentOptionRow
          icon={<CampaignPaymentMethodLogo variant="qr" />}
          label="Scan QR code to pay"
          disabled={disabled}
          onClick={() => onSelect?.("qr")}
        />
      </div>
      */}
    </div>
  );
}

/** Notify React Native WebView before handing off to UPI / payment app. */
const postMandateToReactNative = (
  mandateData: MandateInitResponse,
) => {
  const w = window as Window & {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  };
  if (!w.ReactNativeWebView?.postMessage) return;
  try {
    w.ReactNativeWebView.postMessage(
      JSON.stringify({
        mandateId: String(mandateData.id),
        status: mandateData.mandate_state,
      }),
    );
  } catch {
    // ignore stringify / bridge errors
  }
};

function parseIsCampaignParam(raw: string | null): boolean {
  if (raw == null || String(raw).trim() === "") return false;
  const v = String(raw).trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export const Subscriptions = ({
  setShowLogin,
}: {
  setShowLogin: (v: boolean) => void;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const tokenFromQuery = searchParams.get("id");
  const planIdFromQuery = searchParams.get("plan_id");
  const isCampaign = parseIsCampaignParam(searchParams.get("is_campaign"));
  const fbclidFromUrl = searchParams.get("fbclid")?.trim() ?? "";
  const targetAppFromQuery =
    searchParams.get("target_app") || "com.phonepe.app";
  const organisationId = getOrganisationIdFromSearch(
    location.search,
    location.pathname,
  );

  // Use token from query params if available, otherwise fall back to localStorage
  const token =
    tokenFromQuery || getJwtFromStorage(organisationId);
  const isLoggedIn = !!token;

  const planId = planIdFromQuery ? Number(planIdFromQuery) : null;
  const targetApp = targetAppFromQuery;

  // // Plan listing state (currently unused as we no longer fetch plans)
  // const [plans, setPlans] = useState<Plan[]>([]);
  // const [nextId, setNextId] = useState<number | null>(null);
  // const [loadingPlans, setLoadingPlans] = useState(false);
  // const [plansError, setPlansError] = useState<string | null>(null);
  // const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  // const [planDetailsLoading, setPlanDetailsLoading] = useState(false);
  // const [planDetailsError, setPlanDetailsError] = useState<string | null>(null);

  const [paymentInstrumentType, setPaymentInstrumentType] =
    useState<PaymentInstrumentType>("UPI_COLLECT");
  const [deviceOS, setDeviceOS] = useState<DeviceOS>("ANDROID");
  const [usePhonePe, setUsePhonePe] = useState<boolean>(false);
  const [vpa, setVpa] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [phonePeVersionCode, setPhonePeVersionCode] = useState<string>("");
  const [isFreeTrial, setIsFreeTrial] = useState(false);

  const [mandateInitLoading, setMandateInitLoading] = useState(false);
  const [mandateInitError, setMandateInitError] = useState<string | null>(null);
  const [mandate, setMandate] = useState<MandateInitResponse | null>(null);

  const [activeSubscriptionModal, setActiveSubscriptionModal] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: "" });

  const [mandateValidationLoading, setMandateValidationLoading] =
    useState(false);
  const [mandateValidationError, setMandateValidationError] = useState<
    string | null
  >(null);
  const [mandateStatus, setMandateStatus] = useState<MandateStatusData | null>(
    null,
  );

  const [campaignPaymentWaiting, setCampaignPaymentWaiting] =
    useState<CampaignPaymentMethod | null>(null);
  const [campaignPaymentOutcome, setCampaignPaymentOutcome] =
    useState<CampaignPaymentOutcome | null>(null);

  // To avoid repeatedly triggering auto-initiation when plan_id is present
  const [autoInitiated, setAutoInitiated] = useState(false);

  const [planDetailsState, setPlanDetailsState] = useState<{
    loading: boolean;
    error: string | null;
    data: MonetizationPlanDetails | null;
  }>({ loading: false, error: null, data: null });

  useEffect(() => {
    if (!isLoggedIn || !planId) {
      setPlanDetailsState({ loading: false, error: null, data: null });
      return;
    }

    const fromUrl = parsePlanDetailsFromUrlSearch(location.search);
    if (fromUrl) {
      const urlId = fromUrl.id;
      const idMismatch =
        typeof urlId === "number" &&
        Number.isFinite(urlId) &&
        urlId !== planId;
      if (!idMismatch) {
        setPlanDetailsState({ loading: false, error: null, data: fromUrl });
        return;
      }
    }

    let cancelled = false;
    setPlanDetailsState((s) => ({ ...s, loading: true, error: null }));
    void (async () => {
      try {
        const authToken = headerSafeToken(token);
        const r = await fetch(
          `${HOST}/api/v1/monetization/plans/${planId}/details/`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
              "X-Organisation-ID": organisationId,
            },
          },
        );
        const json: unknown = await r.json().catch(() => ({}));
        if (cancelled) return;
        if (!r.ok) {
          const rec =
            json && typeof json === "object"
              ? (json as Record<string, unknown>)
              : null;
          let msg = `Failed to load plan (${r.status})`;
          if (rec) {
            const d = rec.detail;
            if (typeof d === "string") msg = d;
            else if (typeof rec.message === "string") msg = rec.message;
          }
          setPlanDetailsState({
            loading: false,
            error: msg,
            data: null,
          });
          return;
        }
        const plan = unwrapPlanDetailsJson(json);
        if (!plan) {
          setPlanDetailsState({
            loading: false,
            error: "Invalid plan response",
            data: null,
          });
          return;
        }
        setPlanDetailsState({ loading: false, error: null, data: plan });
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Failed to load plan";
          setPlanDetailsState({ loading: false, error: msg, data: null });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, planId, token, organisationId, location.search]);


  const handleInitiateMandate = async (options?: MandateInitOptions) => {
    if (!planId) return;
    const appTarget = options?.targetAppOverride ?? targetApp;
    if (!appTarget) return;
    setMandateInitLoading(true);
    setMandateInitError(null);
    setMandate(null);
    setMandateStatus(null);
    if (isCampaign) {
      setCampaignPaymentWaiting(null);
      setCampaignPaymentOutcome(null);
    }
    try {
      const body: Record<string, unknown> = {
        plan_id: planId,
        payment_instrument_type: "UPI_INTENT",
        device_os: "ANDROID",
        target_app: appTarget,
      };

      // if (paymentInstrumentType === "UPI_COLLECT") {
      //   body.vpa = vpa;
      // }

      // if (paymentInstrumentType === "UPI_INTENT") {
      //   body.target_app = targetApp;
      //   if (usePhonePe) {
      //     body.use_phonepe = true;
      //     body.mobile_number = mobileNumber;
      //     if (phonePeVersionCode) {
      //       body.phonepe_version_code = Number(phonePeVersionCode);
      //     }
      //   }
      // }

      // if (deviceOS === "ANDROID" && usePhonePe && phonePeVersionCode) {
      //   body.phonepe_version_code = Number(phonePeVersionCode);
      // }

      const authToken = headerSafeToken(token);
      const r = await fetch(
        `${HOST}/api/v1/monetization/subscriptions/mandate/initiate/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            "X-Organisation-ID": organisationId,
          },
          body: JSON.stringify(body),
        },
      );
      const data = (await r.json()) as MandateInitiateApiResponse;

      if (
        r.status === 400 &&
        data.success === false &&
        data.error_code === "active_subscription_exists"
      ) {
        setActiveSubscriptionModal({
          open: true,
          message:
            data.error_message ??
            "You already have an active subscription.",
        });
        return;
      }

      if (!r.ok || !data.success || !data.data) {
        throw new Error(
          data.error_message ?? "Failed to initiate mandate",
        );
      }
      const mandateData = data.data;
      setMandate(mandateData);
      const redirectUrl = resolveMandateRedirectUrl(mandateData);
      if (redirectUrl && typeof window !== "undefined") {
        postMandateToReactNative(mandateData);
        const method = options?.campaignMethod;
        if (isCampaign && method) {
          setCampaignPaymentWaiting(method);
          if (
            method === "phonepe" ||
            method === "paytm" ||
            method === "gpay"
          ) {
            openMandateRedirectUrl(redirectUrl, UPI_APP_PACKAGES[method]);
          } else {
            openMandateRedirectUrl(redirectUrl);
          }
          return;
        }
        window.location.href = redirectUrl;
      }
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Failed to initiate mandate";
      setMandateInitError(msg);
    } finally {
      setMandateInitLoading(false);
    }
  };

  const handleCampaignPaymentSelect = (method: CampaignPaymentMethod) => {
    if (!isCampaign) return;
    const targetAppOverride =
      method === "phonepe"
        ? UPI_APP_PACKAGES.phonepe
        : method === "paytm"
          ? UPI_APP_PACKAGES.paytm
          : method === "gpay"
            ? UPI_APP_PACKAGES.gpay
            : targetApp;
    void handleInitiateMandate({ targetAppOverride, campaignMethod: method });
  };

  const handleCampaignPaymentWaitCancel = () => {
    if (!isCampaign) return;
    setCampaignPaymentWaiting(null);
    setCampaignPaymentOutcome({
      type: "failed",
      message: CAMPAIGN_PAYMENT_FAILED_DEFAULT_MESSAGE,
    });
  };

  const handleCampaignPaymentSuccessDone = () => {
    setCampaignPaymentOutcome(null);
    if (!isCampaign) return;
    triggerCampaignFbRedirect({
      organisationId,
      fbclid: fbclidFromUrl,
      navigate,
    });
  };

  // Automatically start mandate initiation when plan_id (and token) are available
  useEffect(() => {
    if (isCampaign) return;
    if (
      planId &&
      isLoggedIn &&
      !autoInitiated &&
      !mandate &&
      !mandateInitLoading
    ) {
      setAutoInitiated(true);
      // Fire and forget; errors will surface in UI via state
      void handleInitiateMandate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, isLoggedIn, isCampaign]);

  const handleValidateMandate = async () => {
    if (!mandate?.id) {
      setMandateValidationError(
        "No mandate to validate. Please initiate first.",
      );
      return;
    }

    setMandateValidationLoading(true);
    setMandateValidationError(null);
    try {
      const result = await fetchMandateStatus({
        host: HOST,
        mandateId: mandate.id,
        authToken: headerSafeToken(token),
        organisationId,
      });
      setMandateStatus(result);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Failed to validate mandate";
      setMandateValidationError(msg);
    } finally {
      setMandateValidationLoading(false);
    }
  };

  // Poll mandate status every 10s while the waiting modal is open (first call after 10s).
  useEffect(() => {
    if (!isCampaign || !campaignPaymentWaiting || !mandate?.id) return;

    let cancelled = false;
    let intervalId: number | undefined;

    const poll = async () => {
      try {
        const result = await fetchMandateStatus({
          host: HOST,
          mandateId: mandate.id,
          authToken: headerSafeToken(token),
          organisationId,
        });
        if (cancelled) return;

        setMandateStatus(result);
        setMandate((prev) =>
          prev ? { ...prev, mandate_state: result.mandate_state } : prev,
        );

        if (isMandateInitiated(result.mandate_state)) return;

        setCampaignPaymentWaiting(null);
        setCampaignPaymentOutcome(resolveCampaignOutcomeFromStatus(result));
      } catch {
        // Keep polling on transient errors while the user may still be paying.
      }
    };

    const initialDelayId = window.setTimeout(() => {
      void poll();
      intervalId = window.setInterval(
        () => void poll(),
        MANDATE_STATUS_POLL_INTERVAL_MS,
      );
    }, MANDATE_STATUS_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(initialDelayId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [isCampaign, campaignPaymentWaiting, mandate?.id, token, organisationId]);

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const closeActiveSubscriptionModal = () =>
    setActiveSubscriptionModal({ open: false, message: "" });

  const userContact = resolveUserContact(location.search, organisationId);

  const handlePaySecureClose = () => {
    if (isCampaign) {
      const q = new URLSearchParams();
      q.set("organisation_id", organisationId);
      if (fbclidFromUrl) q.set("fbclid", fbclidFromUrl);
      navigate(`/campaign?${q.toString()}`);
      return;
    }
    navigate(-1);
  };

  const paySecureShellClass = isCampaign
    ? "min-h-dvh max-h-dvh overflow-y-auto overscroll-contain bg-black"
    : "container mx-auto px-4 py-24";

  const paySecureInnerClass = isCampaign
    ? "mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))]"
    : "mx-auto mb-10 max-w-md";

  const campaignWaitAmountLabel = planDetailsState.data
    ? formatRupeeWhole(getTrialTokenRupee(planDetailsState.data))
    : "₹ 0";

  return (
    <div className={paySecureShellClass}>
      {campaignPaymentWaiting && isCampaign && (
        <CampaignPaymentWaitingModal
          method={campaignPaymentWaiting}
          amountLabel={campaignWaitAmountLabel}
          onCancel={handleCampaignPaymentWaitCancel}
        />
      )}
      {campaignPaymentOutcome?.type === "success" && isCampaign && (
        <CampaignPaymentSuccessModal
          message={campaignPaymentOutcome.message}
          onDone={handleCampaignPaymentSuccessDone}
        />
      )}
      {campaignPaymentOutcome?.type === "failed" && isCampaign && (
        <CampaignPaymentFailedModal
          message={campaignPaymentOutcome.message}
          onTryAgain={() => setCampaignPaymentOutcome(null)}
        />
      )}
      {activeSubscriptionModal.open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="active-subscription-modal-title"
          onClick={closeActiveSubscriptionModal}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#151b2e] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="active-subscription-modal-title"
              className="text-lg font-semibold text-white"
            >
              Active Subscription
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              {activeSubscriptionModal.message}
            </p>
            <button
              type="button"
              onClick={closeActiveSubscriptionModal}
              className="mt-6 w-full rounded-xl bg-brand-primary py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              OK
            </button>
          </div>
        </div>
      )}
      {/* {isLoggedIn && (
        <>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Subscription
          </h1>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="overflow-hidden rounded-xl border border-white/10 mb-5">
              <div className="bg-neutral-950 px-4 py-2.5 flex items-center gap-1.5">
                <span className="text-white font-bold text-sm tracking-tight">
                  UPI
                </span>
                <i
                  className="fa-solid fa-bolt text-sky-400 text-sm"
                  aria-hidden
                />
                <span className="text-sky-300 font-bold text-sm">Fastest</span>
              </div>
              <div className="bg-sky-50 px-4 py-2.5">
                <p className="text-sky-600 text-sm leading-snug">
                  87.5% of our users prefer paying via UPI
                </p>
              </div>
            </div>
          </div>
        </>
      )} */}
      {/* <p className="text-brand-muted mb-10 max-w-2xl">
        Configure payment options and start your recurring subscription securely
        for the selected plan.
      </p> */}
      {isLoggedIn && (
        <div className={paySecureInnerClass}>
          <PaySecureHeader onClose={handlePaySecureClose} />

          {!planId && (
            <p className="text-center text-sm text-brand-muted">
              Add a valid{" "}
              <span className="font-medium text-white">plan_id</span> query
              parameter to see your payment schedule.
            </p>
          )}

          {planId && planDetailsState.loading && (
            <div
              className="animate-pulse rounded-2xl p-6"
              style={{ backgroundColor: PAY_CARD_BG }}
            >
              <div className="mb-4 h-4 w-3/4 rounded bg-white/10" />
              <div className="mb-4 h-4 w-1/2 rounded bg-white/10" />
              <div className="h-4 w-2/3 rounded bg-white/10" />
            </div>
          )}

          {planId && planDetailsState.error && !planDetailsState.loading && (
            <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
              {planDetailsState.error}
            </p>
          )}

          {planId && planDetailsState.data && !planDetailsState.loading && (
            <>
              <PaySecureTimelineCard plan={planDetailsState.data} />
              <PaySecureNotifyBanner />
              {hasPaySecureContact(userContact) && <PaySecureActivationBox />}
              <PaySecureContactRow
                email={userContact.email}
                phone={userContact.phone}
              />
              {isCampaign && (
                <>
                  {mandateInitError && (
                    <p className="mt-3 text-center text-xs text-red-400" role="alert">
                      {mandateInitError}
                    </p>
                  )}
                  <CampaignPaymentMethods
                    disabled={mandateInitLoading}
                    onSelect={handleCampaignPaymentSelect}
                  />
                </>
              )}
            </>
          )}
        </div>
      )}

      {!isLoggedIn && (
        <div className="mb-8 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/40 text-sm flex items-center justify-between gap-4">
          <div className="text-yellow-100">
            You are not logged in. Log in with your phone number to purchase a
            subscription.
          </div>
          <button
            onClick={handleLoginClick}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-4 py-2 rounded-lg text-sm"
          >
            Log In
          </button>
        </div>
      )}

      {/* Left column (plan list) intentionally left empty since plans are not fetched */}
      {/* <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold text-white mb-2">
            Plan Information
          </h2>
          <div className="text-sm text-brand-muted space-y-1">
            <p>
              <span className="font-semibold text-white">Plan ID:</span>{" "}
              {planId ?? "Not provided"}
            </p>
            <p>
              Plan metadata (name, price, duration) is managed by the app and is
              not fetched on this page.
            </p>
          </div>
        </div> */}

      {/* <div className="lg:col-span-2 space-y-6">
          <div className="hidden lg:block glass-card rounded-3xl p-6 md:p-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Plan Details & Payment
            </h2>
            {!planId && (
              <p className="text-brand-muted text-sm">INVALID URL.</p>
            )}

            {planId && (
              <>
                <div className="mb-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Subscription Plan
                      </h3>
                      <p className="text-xs text-brand-muted">
                        Plan ID: {planId}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-brand-muted mb-1">
                        Payment Method
                      </label>
                      <select
                        value={paymentInstrumentType}
                        onChange={(e) =>
                          setPaymentInstrumentType(
                            e.target.value as PaymentInstrumentType,
                          )
                        }
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"
                      >
                        <option value="UPI_COLLECT">UPI Collect (VPA)</option>
                        <option value="UPI_INTENT">
                          UPI Intent (e.g. PhonePe)
                        </option>
                        <option value="UPI_QR">UPI QR</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-brand-muted mb-1">
                        Device OS
                      </label>
                      <select
                        value={deviceOS}
                        onChange={(e) =>
                          setDeviceOS(e.target.value as DeviceOS)
                        }
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"
                      >
                        <option value="ANDROID">Android</option>
                        <option value="IOS">iOS</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="free-trial"
                        type="checkbox"
                        className="accent-brand-primary"
                        checked={isFreeTrial}
                        onChange={(e) => setIsFreeTrial(e.target.checked)}
                      />
                      <label
                        htmlFor="free-trial"
                        className="text-xs text-brand-muted"
                      >
                        Use free trial (if available)
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {paymentInstrumentType === "UPI_COLLECT" && (
                      <div>
                        <label className="block text-xs text-brand-muted mb-1">
                          UPI ID (VPA)
                        </label>
                        <input
                          type="text"
                          value={vpa}
                          onChange={(e) => setVpa(e.target.value.trim())}
                          placeholder="yourname@upi"
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-brand-muted"
                        />
                      </div>
                    )}

                    {paymentInstrumentType === "UPI_INTENT" && (
                      <>
                        <div className="flex items-center gap-2">
                          <input
                            id="use-phonepe"
                            type="checkbox"
                            className="accent-brand-primary"
                            checked={usePhonePe}
                            onChange={(e) => setUsePhonePe(e.target.checked)}
                          />
                          <label
                            htmlFor="use-phonepe"
                            className="text-xs text-brand-muted"
                          >
                            Use PhonePe
                          </label>
                        </div>
                        <div>
                          <label className="block text-xs text-brand-muted mb-1">
                            Target App (from URL)
                          </label>
                          <input
                            type="text"
                            value={targetApp}
                            readOnly
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"
                          />
                        </div>
                        {usePhonePe && (
                          <>
                            <div>
                              <label className="block text-xs text-brand-muted mb-1">
                                Mobile Number
                              </label>
                              <input
                                type="tel"
                                value={mobileNumber}
                                onChange={(e) =>
                                  setMobileNumber(
                                    e.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, 10),
                                  )
                                }
                                placeholder="10-digit mobile number"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-brand-muted"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-brand-muted mb-1">
                                PhonePe Version Code
                              </label>
                              <input
                                type="number"
                                value={phonePeVersionCode}
                                onChange={(e) =>
                                  setPhonePeVersionCode(e.target.value)
                                }
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"
                              />
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {paymentInstrumentType === "UPI_QR" && (
                      <p className="text-xs text-brand-muted">
                        UPI QR will generate a QR code in the PhonePe flow after
                        mandate initiation (handled by the payment gateway).
                      </p>
                    )}
                  </div>
                </div>

                {mandateInitError && (
                  <div className="mb-4 text-xs text-red-400">
                    {mandateInitError}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={handleInitiateMandate}
                    disabled={mandateInitLoading || !isLoggedIn}
                    className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl text-sm shadow-lg shadow-brand-primary/30"
                  >
                    {mandateInitLoading
                      ? "Starting Subscription..."
                      : "Start Subscription"}
                  </button>

                  {mandate && (
                    <button
                      type="button"
                      onClick={handleValidateMandate}
                      disabled={mandateValidationLoading}
                      className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-xl text-sm border border-white/15"
                    >
                      {mandateValidationLoading
                        ? "Checking Status..."
                        : "Check Status"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {mandate && (
            <div className="glass-card rounded-3xl p-6 md:p-8">
              <h3 className="text-lg font-semibold text-white mb-3">
                Mandate Details
              </h3>
              <div className="text-xs text-brand-muted space-y-1">
                <p>
                  <span className="font-semibold text-white">Mandate ID:</span>{" "}
                  {mandate.id}
                </p>
                <p>
                  <span className="font-semibold text-white">
                    Payment Gateway:
                  </span>{" "}
                  {mandate.payment_gateway}
                </p>
                <p>
                  <span className="font-semibold text-white">State:</span>{" "}
                  {mandate.mandate_state}
                </p>
                <p className="break-all">
                  <span className="font-semibold text-white">
                    Intent URL:
                  </span>{" "}
                  {mandate ? resolveMandateRedirectUrl(mandate) || "N/A" : "N/A"}
                </p>
                <p>
                  <span className="font-semibold text-white">
                    Target App
                  </span>{" "}
                  {targetApp ||
                    "N/A"}
                </p>

              </div>
            </div>
          )}

          {(mandateStatus || mandateValidationError) && (
            <div className="glass-card rounded-3xl p-6 md:p-8">
              <h3 className="text-lg font-semibold text-white mb-3">
                Subscription Status
              </h3>
              {mandateValidationError && (
                <p className="text-xs text-red-400 mb-2">
                  {mandateValidationError}
                </p>
              )}
              {mandateStatus && (
                <div className="text-xs text-brand-muted space-y-1">
                  <p>
                    <span className="font-semibold text-white">
                      Mandate ID:
                    </span>{" "}
                    {mandateStatus.id}
                  </p>
                  <p>
                    <span className="font-semibold text-white">State:</span>{" "}
                    {mandateStatus.mandate_state}
                  </p>
                  {mandateStatus.pg_info?.state && (
                    <p>
                      <span className="font-semibold text-white">
                        PG state:
                      </span>{" "}
                      {mandateStatus.pg_info.state}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div> */}
    </div>
  );
};
