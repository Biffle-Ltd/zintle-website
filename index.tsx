import React, { useState, useEffect, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import FBRedirect from "./pages/FbRedirect";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { Safety } from "./pages/Safety";
import { Guidelines } from "./pages/Guidelines";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { Refund } from "./pages/Refund";
import { ChildSafety } from "./pages/ChildSafety";
import { Subscriptions } from "./pages/Subscriptions";
import { Campaign } from "./pages/Campaign";
import { PaymentStatus } from "./pages/PaymentStatus";
import { PaymentStatusPopup } from "./components/PaymentStatusPopup";
import { PhoneOtpLoginScreen } from "./components/PhoneOtpLoginScreen";
import { QuickRechargePopup } from "./components/QuickRechargePopup";
import {
  CoinStoreMobile,
  getCoinPackStoreIndex,
  resolveTimerPack,
  TIMER_COIN_PRODUCT_ID,
} from "./components/CoinStoreMobile";
import { COIN_ICON_CLASS, ZintleCoinIcon } from "./components/ZintleCoinIcon";
import {
  isQuickRechargeFromSearch,
  parseCoinPixelContext,
  sendCoinPackSelected,
  sendCoinPaymentFailed,
  sendCoinPaymentInitiated,
  sendCoinPaymentSuccess,
  sendCoinStoreViewed,
  sendQuickRechargePopupViewed,
  type CoinPackForAnalytics,
  type ParsedCoinPixelContext,
} from "./utils/pixelEvents";
import { headerSafeToken } from "./utils/headerSafeToken";
import {
  DEFAULT_ORGANISATION_ID,
  getOrganisationIdFromSearch,
  isBiffleOrganisationId,
} from "./utils/organisationIdFromUrl";
import {
  ZINTLE_POST_LOGIN_REDIRECT_KEY,
  withJwtInQuery,
} from "./utils/postLoginRedirect";
import { isCampaignPostLoginRedirect } from "./utils/campaignPixelEvents";
import { sendMetaPixelPageView } from "./utils/metaPixel";
import {
  clearAllJwtStorage,
  getJwtFromStorage,
  hasAnyJwtInStorage,
} from "./utils/authStorage";
import { HOST } from "./utils/host";
import {
  appendPhonePeChromeWVParam,
  openPhonePeIframeCheckout,
} from "./utils/phonePeIframeCheckout";

const { VITE_EASEBUZZ_KEY, VITE_EASEBUZZ_ENV } = (import.meta as any).env;
const EASEBUZZ_KEY = VITE_EASEBUZZ_KEY;
const EASEBUZZ_ENV = VITE_EASEBUZZ_ENV;

import {
  COIN_ORDER_PAYMENT_GATEWAY,
  getPaymentGatewayFromUrl,
  PAYMENT_GATEWAY,
  type PaymentGateway,
} from "./utils/paymentGateway";

export { PAYMENT_GATEWAY };

// Global callback for showing payment status popup
let showPaymentStatusCallback: ((status: string) => void) | null = null;
export const setPaymentStatusCallback = (
  callback: (status: string) => void,
) => {
  showPaymentStatusCallback = callback;
};

type LastTrackedCoinPurchase = {
  orderId: string;
  orderUuid: string;
  coinPackId: number;
  amount: number;
  coinQuantity: number;
  pixelContext: ParsedCoinPixelContext;
};

let lastTrackedCoinPurchaseRef: LastTrackedCoinPurchase | null = null;

const COIN_PAYMENT_POLL_INTERVAL_MS = 5000;
const COIN_PAYMENT_POLL_MAX_ATTEMPTS = 8;

function isCoinPaymentPendingStatus(status: string | undefined): boolean {
  const normalized = (status ?? "").toUpperCase();
  return normalized === "PENDING" || normalized === "INITIATED";
}

export type CreateOrderPixelOptions = {
  trackCoinPixels?: boolean;
  pixelContext?: ParsedCoinPixelContext | null;
  coinPack?: CoinPackForAnalytics;
};

// Shared helper to create coin purchase orders
const createCoinOrder = async (
  coinPackId: number | string,
  token?: string | null,
  organisationId: string = DEFAULT_ORGANISATION_ID,
) => {
  const rawToken = token || getJwtFromStorage(organisationId);
  const jwtToken = headerSafeToken(rawToken);
  const r = await fetch(`${HOST}/api/v1.2/monetization/orders/create/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
      "X-Organisation-ID": organisationId,
    },
    body: JSON.stringify({
      coin_pack_id: coinPackId,
      payment_gateway: COIN_ORDER_PAYMENT_GATEWAY,
    }),
  });
  const data = await r.json();
  if (!r.ok) {
    throw new Error(data.detail || "Failed to create order");
  }

  return data;
};

// Shared helper to initiate payment after order creation
const initiatePayment = async (
  orderUuid: number | string,
  mandateUuid?: number | string | null,
  token?: string | null,
  organisationId: string = DEFAULT_ORGANISATION_ID,
) => {
  const rawToken = token || getJwtFromStorage(organisationId);
  const jwtToken = headerSafeToken(rawToken);
  const r = await fetch(
    `${HOST}/api/v1.2/monetization/orders/initiate-payment/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
        "X-Organisation-ID": organisationId,
      },
      body: JSON.stringify({
        order_uuid: orderUuid,
        mandate_uuid: mandateUuid ?? null,
      }),
    },
  );
  const data = await r.json();
  if (!r.ok) {
    throw new Error(data.detail || "Failed to initiate payment");
  }
  return data;
};

export function extractEasebuzzAccessKey(value) {
  if (!value || typeof value !== "string") return "";

  // If full URL, extract last path segment
  if (value.includes("/pay/")) {
    return value.replace(/\/+$/, "").split("/").pop();
  }

  // Already a token
  return value;
}

// Backend validation for coin pack payment using order UUID
const validateCoinPackPayment = async (
  orderUuid?: string | null,
  organisationId: string = DEFAULT_ORGANISATION_ID,
  token?: string | null,
  gateway: PaymentGateway = getPaymentGatewayFromUrl(),
): Promise<string | undefined> => {
  if (!orderUuid) {
    return;
  }
  const rawToken = token || getJwtFromStorage(organisationId);
  const jwtToken = headerSafeToken(rawToken);
  try {
    let endpoint = "";
    if (gateway === "PhonePe") {
      endpoint = "orders/details/";
    } else if (gateway === "Easebuzz") {
      endpoint = "easebuzz/payment/validate/";
    }
    if (!endpoint) {
      return undefined;
    }
    const r = await fetch(`${HOST}/api/v1.2/monetization/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
        "X-Organisation-ID": organisationId,
      },
      body: JSON.stringify({ order_uuid: orderUuid }),
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) {
      console.error("Payment validation failed", { status: r.status, data });
      return undefined;
    }
    console.log("Payment validated", data);

    const paymentStatus = data?.data?.payment_status as string | undefined;
    const ref = lastTrackedCoinPurchaseRef;
    if (ref && orderUuid && ref.orderUuid === orderUuid) {
      const failReason =
        (data?.data?.failure_reason as string | undefined) ??
        (data?.data?.message as string | undefined) ??
        "";
      if (paymentStatus === "SUCCESS") {
        sendCoinPaymentSuccess(ref.pixelContext, {
          order_id: ref.orderId,
          transaction_id: ref.orderUuid,
          amount: ref.amount,
          coin_pack_id: ref.coinPackId,
          coin_quantity: ref.coinQuantity,
        });
        lastTrackedCoinPurchaseRef = null;
      } else if (paymentStatus === "FAILED") {
        sendCoinPaymentFailed(ref.pixelContext, {
          failure_reason: failReason,
        });
        lastTrackedCoinPurchaseRef = null;
      } else if (paymentStatus === "CANCELLED") {
        lastTrackedCoinPurchaseRef = null;
      }
      // PENDING / INITIATED: keep ref so post-checkout polling can fire success/failed.
    }

    if (paymentStatus) {
      showPaymentStatusCallback?.(paymentStatus);
    }
    return paymentStatus;
  } catch (err) {
    console.error("Failed to validate payment", err);
    return undefined;
  }
};

const pollCoinPackPaymentAfterCheckout = async (
  orderUuid: string | null | undefined,
  organisationId: string = DEFAULT_ORGANISATION_ID,
  token?: string | null,
  gateway: PaymentGateway = getPaymentGatewayFromUrl(),
) => {
  if (!orderUuid) return;

  for (let attempt = 0; attempt < COIN_PAYMENT_POLL_MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) =>
        window.setTimeout(resolve, COIN_PAYMENT_POLL_INTERVAL_MS),
      );
    }

    const paymentStatus = await validateCoinPackPayment(
      orderUuid,
      organisationId,
      token,
      gateway,
    );

    const stillTracking =
      lastTrackedCoinPurchaseRef?.orderUuid === String(orderUuid);
    if (!stillTracking) return;

    if (!isCoinPaymentPendingStatus(paymentStatus)) {
      lastTrackedCoinPurchaseRef = null;
      return;
    }
  }

  if (lastTrackedCoinPurchaseRef?.orderUuid === String(orderUuid)) {
    lastTrackedCoinPurchaseRef = null;
  }
};

/** PhonePe PayPage iframe for coin purchases (see PhonePe docs). */
const launchPhonePeIframeCheckout = (
  tokenUrl: string,
  orderUuid: string | null | undefined,
  organisationId: string = DEFAULT_ORGANISATION_ID,
  token?: string | null,
) => {
  const onClose = () => {
    void pollCoinPackPaymentAfterCheckout(
      orderUuid,
      organisationId,
      token,
      "PhonePe",
    );
  };

  const opened = openPhonePeIframeCheckout(tokenUrl, onClose);
  if (!opened) {
    void pollCoinPackPaymentAfterCheckout(
      orderUuid,
      organisationId,
      token,
      "PhonePe",
    );
  }
};

// Easebuzz iframe checkout (primary coin purchase flow)
const launchEasebuzzCheckout = (
  accessToken: string | null | undefined,
  orderUuid: string | null | undefined,
  organisationId: string = DEFAULT_ORGANISATION_ID,
  token?: string | null,
) => {
  try {
    const accessKey = extractEasebuzzAccessKey(accessToken);
    const merchantKey = EASEBUZZ_KEY;
    const env = EASEBUZZ_ENV;

    if (!accessKey) {
      console.warn("Missing Easebuzz access key in payment response", {
        accessToken,
      });
      void pollCoinPackPaymentAfterCheckout(
        orderUuid,
        organisationId,
        token,
        "Easebuzz",
      );
      return;
    }
    if (!merchantKey) {
      console.warn("Missing Easebuzz merchant key (set VITE_EASEBUZZ_KEY)");
      void pollCoinPackPaymentAfterCheckout(
        orderUuid,
        organisationId,
        token,
        "Easebuzz",
      );
      return;
    }

    const easebuzzCheckout = new (window as any).EasebuzzCheckout(
      merchantKey,
      env,
    );
    const options = {
      access_key: accessKey,
      onResponse: () => {
        void pollCoinPackPaymentAfterCheckout(
          orderUuid,
          organisationId,
          token,
          "Easebuzz",
        );
      },
      theme: "#123456",
    };
    easebuzzCheckout.initiatePayment(options);
  } catch (err) {
    console.error("Error occurred in Easebuzz checkout", err);
    void pollCoinPackPaymentAfterCheckout(
      orderUuid,
      organisationId,
      token,
      "Easebuzz",
    );
  }
};

// Combined helper to create order and immediately initiate payment
const createOrderAndInitiatePayment = async (
  coinPackId: number | string,
  token?: string | null,
  options?: CreateOrderPixelOptions,
  organisationId: string = DEFAULT_ORGANISATION_ID,
) => {
  const trackCoinPurchase =
    Boolean(options?.trackCoinPixels) &&
    options?.pixelContext != null &&
    options?.coinPack != null;

  if (trackCoinPurchase) {
    const { pixelContext, coinPack } = options!;
    sendCoinPaymentInitiated(pixelContext, coinPack);
  }

  const orderData = await createCoinOrder(coinPackId, token, organisationId);
  const order = orderData.data;
  if (!order?.order_uuid) {
    return;
  }

  if (trackCoinPurchase) {
    const { pixelContext, coinPack } = options!;
    lastTrackedCoinPurchaseRef = {
      orderId: String(order.id),
      orderUuid: String(order.order_uuid),
      coinPackId: coinPack.id,
      amount: coinPack.price,
      coinQuantity: coinPack.coins,
      pixelContext,
    };
  }

  const paymentData = await initiatePayment(
    order.order_uuid,
    order.mandate_uuid ?? null,
    token,
    organisationId,
  );
  const payment = paymentData.data;
  if (PAYMENT_GATEWAY === "Easebuzz") {
    launchEasebuzzCheckout(
      payment?.access_token,
      order.order_uuid,
      organisationId,
      token,
    );
  } else if (PAYMENT_GATEWAY === "PhonePe") {
    const tokenUrl = payment?.access_token;
    if (!tokenUrl) {
      return { order, payment };
    }
    launchPhonePeIframeCheckout(
      appendPhonePeChromeWVParam(tokenUrl),
      order.order_uuid,
      organisationId,
      token,
    );
  }
  return { order, payment };
};

const ZintleLogo = ({ h }: { h?: string }) => (
  <img
    src="/zintle_logo.png"
    alt="Zintle Logo"
    className={`w-auto ${h || "h-8"} object-contain`}
  />
);

const ZintleLogoSvg = ({ height = 26 }: { height?: number }) => (
  <svg
    style={{ height, display: "block" }}
    viewBox="0 0 929 149"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Zintle"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M61.9884 57.3567C63.6957 55.4976 66.7715 57.0354 66.3087 59.5168L59.5401 95.803C59.3712 96.7088 59.9053 97.5979 60.7843 97.8743L119.165 116.219C122.411 117.239 122.75 121.697 119.696 123.197L71.2608 146.966C67.5149 148.804 63.2044 149.127 59.2267 147.866L2.63194 129.928C0.00512896 129.095 -0.869374 125.817 0.994248 123.787L61.9884 57.3567ZM63.8722 1.65747C67.618 -0.18081 71.9287 -0.503525 75.9064 0.757078L132.501 18.6956C135.128 19.5281 136.002 22.8063 134.139 24.8362L73.1456 91.2668C71.4384 93.1262 68.3626 91.5891 68.8253 89.1077L75.5939 52.8206C75.7626 51.9147 75.2278 51.0255 74.3487 50.7493L15.9679 32.4045C12.7221 31.3846 12.3833 26.9259 15.4376 25.427L63.8722 1.65747Z"
      fill="white"
    />
    <path
      d="M247.171 100.774C246.509 101.4 246.952 102.515 247.864 102.515H308.294C310.976 102.515 312.911 105.083 312.171 107.661L305.114 132.263C304.618 133.992 303.036 135.184 301.237 135.184H179.718C176.068 135.184 174.295 130.723 176.949 128.217L261.616 48.2894C262.28 47.663 261.836 46.5477 260.924 46.5477H200.406C197.726 46.5477 195.791 43.9816 196.528 41.4046L203.592 16.7149C204.087 14.9839 205.669 13.7908 207.47 13.7908H329C332.648 13.7908 334.422 18.2481 331.772 20.7548L247.171 100.774Z"
      fill="white"
    />
    <path
      d="M326.366 135.184C323.684 135.184 321.749 132.615 322.489 130.037L355.032 16.7111C355.528 14.982 357.11 13.7908 358.909 13.7908H383.889C386.57 13.7908 388.505 16.3578 387.767 18.9351L355.306 132.261C354.811 133.992 353.229 135.184 351.429 135.184H326.366Z"
      fill="white"
    />
    <path
      d="M535.973 14.9013C535.902 14.9774 535.85 15.0689 535.822 15.1686L502.195 132.264C501.699 133.993 500.117 135.184 498.318 135.184H473.342C470.66 135.184 468.725 132.615 469.466 130.037L486.906 69.3401C487.197 68.3259 485.932 67.602 485.205 68.3671L422.934 133.928C422.173 134.73 421.116 135.184 420.01 135.184H388.822C386.14 135.184 384.205 132.615 384.945 130.037L417.487 16.7111C417.984 14.982 419.565 13.7908 421.364 13.7908H446.347C449.027 13.7908 450.962 16.3567 450.225 18.9338L432.509 80.8624C432.219 81.8768 433.484 82.5992 434.21 81.8336L497.536 15.049C498.298 14.2457 499.356 13.7908 500.463 13.7908H535.488C536.065 13.7908 536.365 14.4785 535.973 14.9013Z"
      fill="white"
    />
    <path
      d="M590.946 47.4834C591.13 46.8391 590.646 46.1974 589.976 46.1974H551.294C548.614 46.1974 546.679 43.6313 547.416 41.0543L554.48 16.3646C554.975 14.6336 556.557 13.4404 558.358 13.4404H674.163C676.843 13.4404 678.778 16.0065 678.041 18.5835L670.977 43.2732C670.482 45.0042 668.9 46.1974 667.099 46.1974H625.531C625.081 46.1974 624.686 46.4951 624.562 46.9272L600.036 132.265C599.539 133.993 597.958 135.184 596.159 135.184H571.178C568.497 135.184 566.562 132.617 567.3 130.04L590.946 47.4834Z"
      fill="white"
    />
    <path
      d="M704.954 99.9431C704.586 101.232 705.553 102.515 706.893 102.515H774.714C777.396 102.515 779.331 105.083 778.591 107.661L771.534 132.263C771.038 133.992 769.456 135.184 767.656 135.184H666.744C664.062 135.184 662.127 132.615 662.867 130.038L695.497 16.3611C695.994 14.6319 697.575 13.4404 699.374 13.4404H724.356C727.037 13.4404 728.971 16.0066 728.234 18.5837L704.954 99.9431Z"
      fill="white"
    />
    <path
      d="M818.825 16.3611C819.321 14.6319 820.903 13.4404 822.702 13.4404H923.532C926.213 13.4404 928.148 16.0065 927.41 18.5835L920.347 43.2732C919.852 45.0042 918.269 46.1974 916.469 46.1974H845.177C844.279 46.1974 843.489 46.7906 843.24 47.6527L840.905 55.7058C840.531 56.9959 841.499 58.2841 842.842 58.2841H910.657C913.338 58.2841 915.273 60.8502 914.535 63.4272L907.472 88.1169C906.977 89.8479 905.394 91.0411 903.594 91.0411H832.312C831.41 91.0411 830.617 91.6409 830.371 92.5097L828.27 99.9497C827.907 101.237 828.874 102.515 830.211 102.515H898.041C900.723 102.515 902.658 105.083 901.918 107.661L894.861 132.263C894.365 133.992 892.783 135.184 890.984 135.184H790.071C787.389 135.184 785.454 132.615 786.194 130.038L818.825 16.3611Z"
      fill="white"
    />
  </svg>
);

const GooglePlayIcon = ({ size = "sm" }: { size?: "sm" | "lg" }) => {
  const w = size === "lg" ? 22 : 18;
  const h = size === "lg" ? 24 : 20;
  return (
    <svg width={w} height={h} viewBox="0 0 512 512" aria-hidden="true">
      <defs>
        <linearGradient id="gp-h" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00C3FF" />
          <stop offset="1" stopColor="#00A0FF" />
        </linearGradient>
      </defs>
      <path
        d="M47 30c-7 4-11 12-11 22v408c0 10 4 18 11 22l2 1 229-229v-4L49 29z"
        fill="url(#gp-h)"
      />
      <path
        d="M353 333l-77-77v-4l77-77 1 1 91 52c26 15 26 39 0 54l-91 51z"
        fill="#00E676"
      />
      <path d="M354 332l-78-78L49 481c9 9 23 10 39 1z" fill="#FF3D47" />
      <path d="M354 180L88 30c-16-9-30-8-39 1l227 227z" fill="#FFCE00" />
    </svg>
  );
};

// --- Components ---

const Header = ({
  setShowLogin,
  setShowCoins,
  isLoggedIn,
  onLogout,
}: {
  setShowLogin: (v: boolean) => void;
  setShowCoins: (v: boolean) => void;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const navTo = (destination: string) => {
    const sectionMap: Record<string, string> = {
      explore: "explore",
      pricing: "pricing",
      safety: "safety",
    };
    if (sectionMap[destination]) {
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => scrollToSection(sectionMap[destination]), 120);
      } else {
        scrollToSection(sectionMap[destination]);
      }
    } else if (destination === "home") {
      navigate("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/" + destination);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isActive = (dest: string) => {
    if (dest === "home") return location.pathname === "/";
    if (dest === "explore" || dest === "pricing")
      return location.pathname === "/";
    return location.pathname === "/" + dest;
  };

  return (
    <nav className="znw-nav">
      <div className="znw-wrap znw-nav-in">
        <button
          onClick={() => navTo("home")}
          className="znw-logo-link"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <ZintleLogoSvg height={24} />
        </button>

        <div className="znw-nav-links">
          <button
            className={`znw-navbtn${isActive("home") ? " active" : ""}`}
            onClick={() => navTo("home")}
          >
            Home
          </button>
          <button
            className={`znw-navbtn${isActive("explore") ? " active" : ""}`}
            onClick={() => navTo("explore")}
          >
            Explore
          </button>
          <button
            className={`znw-navbtn${isActive("guidelines") ? " active" : ""}`}
            onClick={() => navTo("guidelines")}
          >
            Guidelines
          </button>
          <button
            className={`znw-navbtn${isActive("pricing") ? " active" : ""}`}
            onClick={() => navTo("pricing")}
          >
            Pricing
          </button>
          <button
            className={`znw-navbtn${isActive("privacy") ? " active" : ""}`}
            onClick={() => navTo("privacy")}
          >
            Privacy
          </button>

          {!isLoggedIn ? (
            <button
              className="znw-login-btn"
              onClick={() => setShowLogin(true)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Log in
            </button>
          ) : (
            <div className="znw-user-wrap" ref={menuRef}>
              <button
                className="znw-user-pill"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Account menu"
              >
                <span className="znw-user-ava">+</span>
                <span className="znw-user-who">Account</span>
                <svg
                  className="znw-user-cv"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div className={`znw-user-menu${menuOpen ? " open" : ""}`}>
                <div className="znw-user-mhead">
                  <div className="mn">Account</div>
                </div>
                <button
                  className="znw-user-mitem danger"
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout?.();
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Log out
                </button>
              </div>
            </div>
          )}

          {location.pathname !== "/" && (
            <a
              href="https://play.google.com/store/apps/details?id=ai.zintle"
              target="_blank"
              rel="noopener noreferrer"
              className="znw-gplay"
              aria-label="Get it on Google Play"
            >
              <GooglePlayIcon />
              <span className="gp-txt">
                <small>GET IT ON</small>
                <strong>Google Play</strong>
              </span>
            </a>
          )}
        </div>

        <button
          className="znw-menu-btn"
          aria-label="Menu"
          onClick={() => {
            navigate("/");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
    </nav>
  );
};

const PhoneMockup = () => (
  <div className="znw-phone-stage">
    <div className="znw-glow-blob" />
    <div className="znw-phone">
      <div className="znw-phone-notch" />
      {/* Top bar */}
      <div className="znw-phone-top">
        <svg
          style={{ height: 15 }}
          viewBox="0 0 929 149"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M61.9884 57.3567C63.6957 55.4976 66.7715 57.0354 66.3087 59.5168L59.5401 95.803C59.3712 96.7088 59.9053 97.5979 60.7843 97.8743L119.165 116.219C122.411 117.239 122.75 121.697 119.696 123.197L71.2608 146.966C67.5149 148.804 63.2044 149.127 59.2267 147.866L2.63194 129.928C0.00512896 129.095 -0.869374 125.817 0.994248 123.787L61.9884 57.3567ZM63.8722 1.65747C67.618 -0.18081 71.9287 -0.503525 75.9064 0.757078L132.501 18.6956C135.128 19.5281 136.002 22.8063 134.139 24.8362L73.1456 91.2668C71.4384 93.1262 68.3626 91.5891 68.8253 89.1077L75.5939 52.8206C75.7626 51.9147 75.2278 51.0255 74.3487 50.7493L15.9679 32.4045C12.7221 31.3846 12.3833 26.9259 15.4376 25.427L63.8722 1.65747Z"
            fill="white"
          />
          <path
            d="M247.171 100.774C246.509 101.4 246.952 102.515 247.864 102.515H308.294C310.976 102.515 312.911 105.083 312.171 107.661L305.114 132.263C304.618 133.992 303.036 135.184 301.237 135.184H179.718C176.068 135.184 174.295 130.723 176.949 128.217L261.616 48.2894C262.28 47.663 261.836 46.5477 260.924 46.5477H200.406C197.726 46.5477 195.791 43.9816 196.528 41.4046L203.592 16.7149C204.087 14.9839 205.669 13.7908 207.47 13.7908H329C332.648 13.7908 334.422 18.2481 331.772 20.7548L247.171 100.774Z"
            fill="white"
          />
          <path
            d="M326.366 135.184C323.684 135.184 321.749 132.615 322.489 130.037L355.032 16.7111C355.528 14.982 357.11 13.7908 358.909 13.7908H383.889C386.57 13.7908 388.505 16.3578 387.767 18.9351L355.306 132.261C354.811 133.992 353.229 135.184 351.429 135.184H326.366Z"
            fill="white"
          />
          <path
            d="M535.973 14.9013C535.902 14.9774 535.85 15.0689 535.822 15.1686L502.195 132.264C501.699 133.993 500.117 135.184 498.318 135.184H473.342C470.66 135.184 468.725 132.615 469.466 130.037L486.906 69.3401C487.197 68.3259 485.932 67.602 485.205 68.3671L422.934 133.928C422.173 134.73 421.116 135.184 420.01 135.184H388.822C386.14 135.184 384.205 132.615 384.945 130.037L417.487 16.7111C417.984 14.982 419.565 13.7908 421.364 13.7908H446.347C449.027 13.7908 450.962 16.3567 450.225 18.9338L432.509 80.8624C432.219 81.8768 433.484 82.5992 434.21 81.8336L497.536 15.049C498.298 14.2457 499.356 13.7908 500.463 13.7908H535.488C536.065 13.7908 536.365 14.4785 535.973 14.9013Z"
            fill="white"
          />
          <path
            d="M590.946 47.4834C591.13 46.8391 590.646 46.1974 589.976 46.1974H551.294C548.614 46.1974 546.679 43.6313 547.416 41.0543L554.48 16.3646C554.975 14.6336 556.557 13.4404 558.358 13.4404H674.163C676.843 13.4404 678.778 16.0065 678.041 18.5835L670.977 43.2732C670.482 45.0042 668.9 46.1974 667.099 46.1974H625.531C625.081 46.1974 624.686 46.4951 624.562 46.9272L600.036 132.265C599.539 133.993 597.958 135.184 596.159 135.184H571.178C568.497 135.184 566.562 132.617 567.3 130.04L590.946 47.4834Z"
            fill="white"
          />
          <path
            d="M704.954 99.9431C704.586 101.232 705.553 102.515 706.893 102.515H774.714C777.396 102.515 779.331 105.083 778.591 107.661L771.534 132.263C771.038 133.992 769.456 135.184 767.656 135.184H666.744C664.062 135.184 662.127 132.615 662.867 130.038L695.497 16.3611C695.994 14.6319 697.575 13.4404 699.374 13.4404H724.356C727.037 13.4404 728.971 16.0066 728.234 18.5837L704.954 99.9431Z"
            fill="white"
          />
          <path
            d="M818.825 16.3611C819.321 14.6319 820.903 13.4404 822.702 13.4404H923.532C926.213 13.4404 928.148 16.0065 927.41 18.5835L920.347 43.2732C919.852 45.0042 918.269 46.1974 916.469 46.1974H845.177C844.279 46.1974 843.489 46.7906 843.24 47.6527L840.905 55.7058C840.531 56.9959 841.499 58.2841 842.842 58.2841H910.657C913.338 58.2841 915.273 60.8502 914.535 63.4272L907.472 88.1169C906.977 89.8479 905.394 91.0411 903.594 91.0411H832.312C831.41 91.0411 830.617 91.6409 830.371 92.5097L828.27 99.9497C827.907 101.237 828.874 102.515 830.211 102.515H898.041C900.723 102.515 902.658 105.083 901.918 107.661L894.861 132.263C894.365 133.992 892.783 135.184 890.984 135.184H790.071C787.389 135.184 785.454 132.615 786.194 130.038L818.825 16.3611Z"
            fill="white"
          />
        </svg>
        <div className="znw-phone-coins">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4l2 2" />
          </svg>
          Z 10
        </div>
      </div>
      {/* Category chips */}
      <div className="znw-phone-chips">
        <span className="znw-pchip on">All</span>
        <span className="znw-pchip">✨ Astrology</span>
        <span className="znw-pchip">🃏 Tarot Card</span>
        <span className="znw-pchip">💞 Relations</span>
      </div>
      {/* Cards grid */}
      <div className="znw-phone-grid">
        <div
          className="znw-pcard"
          style={{ gridColumn: "1 / -1", height: 160 }}
        >
          <div
            className="znw-pcard-bg"
            style={{
              background: "linear-gradient(135deg,#4B1B7E,#1a3060)",
              height: "100%",
              width: "100%",
            }}
          />
          <div className="scrim" />
          <div
            style={{
              position: "absolute",
              top: 7,
              left: 9,
              background: "linear-gradient(135deg,#F44876,#FF7000)",
              fontSize: 9,
              fontWeight: 700,
              color: "#fff",
              padding: "3px 8px",
              borderRadius: 20,
              zIndex: 2,
            }}
          >
            Featured
          </div>
          <div
            style={{
              position: "absolute",
              top: 7,
              right: 9,
              background: "#1FAE55",
              fontSize: 9,
              fontWeight: 700,
              color: "#fff",
              padding: "3px 8px",
              borderRadius: 20,
              zIndex: 2,
            }}
          >
            Live
          </div>
          <div className="meta">
            <div className="nm">
              Janny Ai{" "}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: "rgba(255,255,255,.7)",
                }}
              >
                Astrologer
              </span>
            </div>
            <div className="rt">⭐ 4.8</div>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 10,
              right: 10,
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#F44876,#FF7000)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
        </div>
        <div className="znw-pcard" style={{ height: 130 }}>
          <div
            className="znw-pcard-bg"
            style={{
              background: "linear-gradient(135deg,#1a3060,#2d1b6e)",
              height: "100%",
              width: "100%",
            }}
          />
          <div className="scrim" />
          <div className="live">
            <span className="d" />
            Live
          </div>
          <div className="meta">
            <div className="nm">Jia Ai</div>
            <div className="rt">Astrologer</div>
          </div>
        </div>
        <div className="znw-pcard" style={{ height: 130 }}>
          <div
            className="znw-pcard-bg"
            style={{
              background: "linear-gradient(135deg,#2e1060,#1a3060)",
              height: "100%",
              width: "100%",
            }}
          />
          <div className="scrim" />
          <div
            style={{
              position: "absolute",
              top: 7,
              right: 7,
              background: "#E0322F",
              fontSize: 8,
              fontWeight: 700,
              color: "#fff",
              padding: "2px 7px",
              borderRadius: 20,
              zIndex: 2,
            }}
          >
            Offline
          </div>
          <div className="meta">
            <div className="nm">Ria Ai</div>
            <div className="rt">Taro Card</div>
          </div>
        </div>
      </div>
      {/* Bottom nav */}
      <div className="znw-phone-nav">
        {[
          {
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            ),
            on: true,
          },
          {
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            ),
            on: false,
          },
          {
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            ),
            on: false,
          },
          {
            icon: (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            ),
            on: false,
          },
        ].map((item, i) => (
          <div key={i} className={`ni${item.on ? " on" : ""}`}>
            {item.icon}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const Hero = ({
  setShowLogin,
}: {
  setShowLogin: (v: boolean) => void;
  setShowCoins: (v: boolean) => void;
}) => (
  <header className="znw-hero-wrap">
    <div className="znw-wrap znw-hero-grid">
      <div className="hero-copy">
        <div className="znw-eyebrow">
          <span className="dot" />
          &nbsp;Astrology · Tarot · Relationships · Career · Companionship
        </div>
        <h1 className="znw-hero-title">
          Conversations that
          <br />
          <span className="grad-text">actually go deep.</span>
        </h1>
        <p className="znw-hero-sub">
          Talk through love, career, family or faith — with a companion who
          listens, remembers you, and answers in your language.
        </p>
        <p className="znw-hero-hinglish">
          "Aaj ka horoscope?" · "Late night vent — koi sun raha hai?"
        </p>
        <div className="znw-hero-cta">
          <button
            className="pill pill-grad"
            style={{ height: 54, padding: "0 30px", fontSize: 15 }}
            onClick={() => setShowLogin(true)}
          >
            Start your first chat
          </button>
          <a
            href="https://play.google.com/store/apps/details?id=ai.zintle"
            target="_blank"
            rel="noopener noreferrer"
            className="znw-gplay lg"
            aria-label="Get it on Google Play"
          >
            <GooglePlayIcon size="lg" />
            <span className="gp-txt">
              <small>GET IT ON</small>
              <strong>Google Play</strong>
            </span>
          </a>
        </div>
        <div className="znw-store-note">
          <span>
            <b>50k+</b> conversations &amp; counting
          </span>
          <span>
            <b>7</b> languages
          </span>
          <span>
            <b>24×7</b> · always there for you
          </span>
        </div>
      </div>
      <PhoneMockup />
    </div>
  </header>
);

const ExploreSection = () => (
  <section id="explore" className="znw-explore">
    <div className="znw-wrap">
      <div className="znw-sec-head">
        <div className="znw-sec-tag grad-text">One app, many guides</div>
        <h2 className="znw-sec-title">Guidance for every part of life</h2>
        <p className="znw-sec-sub">
          Pick a companion who gets what's on your mind.
        </p>
      </div>
      <div className="znw-vgrid">
        {[
          ["🔮", "Astrology & Kundli"],
          ["🃏", "Tarot & Numerology"],
          ["💞", "Relationships"],
          ["🚀", "Career & Coaching"],
          ["🌙", "Companionship"],
          ["🏠", "Vastu & Palmistry"],
          ["🧘", "Yoga & Wellness"],
          ["✨", "& growing weekly"],
        ].map(([emoji, title]) => (
          <div key={title} className="znw-vcard">
            <div className="znw-vemoji">{emoji}</div>
            <h3>{title}</h3>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const HowItWorks = () => (
  <section id="how" className="znw-how">
    <div className="znw-wrap">
      <div className="znw-sec-head">
        <div className="znw-sec-tag grad-text">How Zintle works</div>
        <h2 className="znw-sec-title">
          From "I have a question" to "I feel better" — in a minute
        </h2>
      </div>
      <div className="znw-steps-row">
        {[
          [
            "1",
            "Sign up in seconds",
            "Phone number + OTP. Pick your language.",
          ],
          ["2", "Pick your companion", "Browse by topic, language and vibe."],
          ["3", "Talk it out", "Chat or call — Hindi, English or Hinglish."],
          ["4", "Pay as you go", "Start free. Top up with UPI, or go PRO."],
        ].map(([n, h, p]) => (
          <div key={n} className="znw-how-step">
            <div className="n">{n}</div>
            <h4>{h}</h4>
            <p>{p}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const WhyDifferent = () => (
  <section className="znw-why">
    <div className="znw-wrap">
      <div className="znw-sec-head">
        <div className="znw-sec-tag grad-text">Why it feels different</div>
        <h2 className="znw-sec-title">
          Not quick answers. Real understanding.
        </h2>
        <p className="znw-sec-sub">
          Most apps hand you a one-line horoscope or a canned reply. Zintle
          actually listens — it remembers your story, reads how you're feeling,
          and stays with you as long as you need.
        </p>
      </div>
      <div className="znw-feat3">
        <div className="znw-ftile">
          <div className="znw-vemoji">💬</div>
          <h4>Remembers you</h4>
          <p>
            Knows your situation and picks up right where you left off — no
            re-explaining every time.
          </p>
        </div>
        <div className="znw-ftile">
          <div className="znw-vemoji">🎯</div>
          <h4>Goes deeper</h4>
          <p>
            Asks the follow-up question, sees the real worry, and talks it
            through — not just a one-line reply.
          </p>
        </div>
        <div className="znw-ftile">
          <div className="znw-vemoji">🤍</div>
          <h4>Always there</h4>
          <p>
            Warm, patient and judgement-free, in your language, at 2pm or 2am.
          </p>
        </div>
      </div>
      <div className="znw-usecases">
        <div className="znw-uc-label">
          Conversations that actually go somewhere
        </div>
        <div className="znw-uc-grid">
          <div className="znw-uc-card">
            <div className="znw-uc-tag">💞 Relationships</div>
            <div className="znw-bubble in">
              "We had a huge fight again. I don't even know if I should stay."
            </div>
            <div className="znw-bubble out">
              That sounds exhausting. Last time you mentioned the trust issue
              after the move — is this the same thing, or something new?
            </div>
            <div className="znw-uc-foot">
              Remembers the back-story · helps you see it clearly
            </div>
          </div>
          <div className="znw-uc-card">
            <div className="znw-uc-tag">🔮 Astrology</div>
            <div className="znw-bubble in">
              "Mangal dosha hai kya meri kundli mein? Shaadi ko lekar tension
              hai."
            </div>
            <div className="znw-bubble out">
              Chaliye aapki birth details se dekhte hain — aur main samjhaata
              hoon iska asli matlab kya hai, bina dar ke.
            </div>
            <div className="znw-uc-foot">
              Your language · calm, no fear-mongering
            </div>
          </div>
          <div className="znw-uc-card">
            <div className="znw-uc-tag">🚀 Career</div>
            <div className="znw-bubble in">
              "Got the interview tomorrow but I'm panicking. What if I freeze?"
            </div>
            <div className="znw-bubble out">
              Let's do a quick mock round right now. I'll play the interviewer —
              answer me like it's real, and we'll fix the shaky bits.
            </div>
            <div className="znw-uc-foot">
              Practical · rehearse before the real thing
            </div>
          </div>
          <div className="znw-uc-card">
            <div className="znw-uc-tag">🌙 Companionship</div>
            <div className="znw-bubble in">
              "Can't sleep. Everyone's asleep and my head won't shut up."
            </div>
            <div className="znw-bubble out">
              I'm here. Want to just talk it out, or should I help you slow your
              mind down for a bit?
            </div>
            <div className="znw-uc-foot">
              2am or 2pm · someone who always picks up
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const CoinStore = ({
  onClose,
  initialStep = "store",
  coinPacks,
  organisationId = DEFAULT_ORGANISATION_ID,
}: {
  onClose: () => void;
  initialStep?: "store" | "login";
  coinPacks: any[];
  organisationId?: string;
}) => {
  const navigate = useNavigate();
  const isBiffle = isBiffleOrganisationId(organisationId);
  const abandonCampaignRedirectAndClose = () => {
    sessionStorage.removeItem(ZINTLE_POST_LOGIN_REDIRECT_KEY);
    onClose();
  };
  const [step, setStep] = useState<"store" | "login" | "success">(initialStep);
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const isLoggedIn = !!getJwtFromStorage(organisationId);
  const packs = coinPacks;

  const isCampaignLoginFlow = isCampaignPostLoginRedirect(
    sessionStorage.getItem(ZINTLE_POST_LOGIN_REDIRECT_KEY),
  );

  if (step === "login") {
    return (
      <PhoneOtpLoginScreen
        isBiffle={isBiffle}
        organisationId={organisationId}
        isCampaignFlow={isCampaignLoginFlow}
        onClose={abandonCampaignRedirectAndClose}
        onSuccess={() => {
          const pending = sessionStorage.getItem(
            ZINTLE_POST_LOGIN_REDIRECT_KEY,
          );
          sessionStorage.removeItem(ZINTLE_POST_LOGIN_REDIRECT_KEY);
          if (pending?.startsWith("/")) {
            const jwt = getJwtFromStorage(organisationId);
            const dest =
              jwt && isBiffle ? withJwtInQuery(pending, jwt) : pending;
            navigate(dest);
          }
          onClose();
        }}
      />
    );
  }

  const handleBuy = async (pack: any) => {
    setSelectedPack(pack);
    if (!isLoggedIn) {
      setStep("login");
      return;
    }
    if (pack?.id) {
      try {
        await createOrderAndInitiatePayment(
          pack.id,
          undefined,
          undefined,
          organisationId,
        );
        abandonCampaignRedirectAndClose();
      } catch (e) {
        console.error("Failed to create coin order from CoinStore", e);
      }
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex animate-fade-in overflow-y-auto overscroll-contain items-center justify-center p-4 ${isBiffle ? "bg-slate-900/70 backdrop-blur-sm" : "bg-black/80 backdrop-blur-sm"}`}
    >
      <div
        className={`w-full shrink-0 max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden relative flex flex-col my-auto ${isBiffle ? "bg-white border border-gray-200" : "bg-brand-surface border border-white/10"}`}
      >
        <button
          onClick={abandonCampaignRedirectAndClose}
          className={`absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center transition-all z-10 shadow-lg border ${isBiffle ? "bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200 hover:text-red-600" : "bg-white/10 hover:bg-white/20 text-white hover:text-red-400 border-white/20"}`}
          aria-label="Close"
        >
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>
        <div className="p-6 md:p-8 overflow-y-auto flex-1 pb-8">
          {step === "store" && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="mb-4 inline-flex items-center justify-center rounded-full bg-brand-gold/10 p-4 text-3xl leading-none">
                  <ZintleCoinIcon className={COIN_ICON_CLASS} />
                </div>
                <h3 className="text-3xl font-bold text-white mb-2">
                  Recharge Wallet
                </h3>
                <p className="text-brand-muted text-sm">1 Coin = ₹1 (approx)</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6 pt-4">
                {packs.map((p, i) => (
                  <div
                    key={i}
                    className={`relative p-6 rounded-2xl ${p.color} cursor-pointer hover:scale-105 hover:shadow-lg transition-all border border-white/10 overflow-visible`}
                    onClick={() => handleBuy(p)}
                  >
                    {p.tag && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-primary text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-md z-10">
                        {p.tag}
                      </span>
                    )}
                    <div className="text-center pt-2">
                      <p className="text-3xl font-bold text-white mb-2">
                        {p.coins}
                      </p>
                      <p className="text-sm text-brand-muted mb-4 font-medium">
                        Coins
                      </p>
                      <button className="bg-white text-brand-bg text-sm font-bold py-2.5 px-6 rounded-full w-full hover:bg-gray-100 transition-colors shadow-md">
                        ₹{p.price}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-brand-muted flex items-center justify-center gap-2 pt-4 border-t border-white/10">
                <i className="fa-solid fa-shield-halved"></i> 100% Secure
                Payment
              </p>
            </div>
          )}
          {step === "success" && (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                <i className="fa-solid fa-check"></i>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Payment Successful!
              </h3>
              <p className="text-brand-muted mb-8">
                Your {selectedPack?.coins} coins have been added to your wallet.
              </p>
              <button
                type="button"
                onClick={abandonCampaignRedirectAndClose}
                className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-xl transition-all"
              >
                Start Exploring
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CoinSection = ({
  setShowCoins,
  setShowLogin,
  coinPacks,
  organisationId = DEFAULT_ORGANISATION_ID,
}: {
  setShowCoins: (v: boolean) => void;
  setShowLogin: (v: boolean) => void;
  coinPacks: any[];
  organisationId?: string;
}) => {
  const isLoggedIn = !!getJwtFromStorage(organisationId);

  const handleRechargeClick = async (pkg: any) => {
    // If user is logged out, open login popup instead of creating order
    if (!isLoggedIn) {
      setShowLogin(true);
      setShowCoins(true);
      return;
    }

    if (!pkg?.id) {
      console.warn("No coin_pack_id available for package", pkg);
      return;
    }
    try {
      await createOrderAndInitiatePayment(
        pkg.id,
        undefined,
        undefined,
        organisationId,
      );
    } catch (e) {
      console.error("Failed to create coin order from CoinSection", e);
    }
  };

  return (
    <section id="pricing" className="znw-pricing">
      <div className="znw-wrap">
        <div className="znw-sec-head">
          <div className="znw-sec-tag grad-text">Simple, micro-priced</div>
          <h2 className="znw-sec-title">Pay the way India pays</h2>
        </div>
        <div className="znw-price">
          <div className="znw-pc">
            <div className="znw-pname">Trial Plan</div>
            <div className="znw-pamt">₹1</div>
            <div className="znw-pdesc">Get started, feel the value.</div>
            <ul>
              <li>
                <span className="znw-ck">✓</span> Daily horoscope
              </li>
              <li>
                <span className="znw-ck">✓</span> Free intro chats
              </li>
              <li>
                <span className="znw-ck">✓</span> Browse everything
              </li>
            </ul>
            <button
              className="pill pill-ghost"
              onClick={() => setShowLogin(true)}
            >
              Get started
            </button>
          </div>
          <div className="znw-pc feature">
            <div className="znw-ribbon">Most popular</div>
            <div className="znw-pname">Coins &amp; top-ups</div>
            <div className="znw-pamt">
              ₹9<span>+ more packs</span>
            </div>
            <div className="znw-pdesc">Pay only for what you use.</div>
            <ul>
              <li>
                <span className="znw-ck">✓</span> Go deeper, anytime
              </li>
              <li>
                <span className="znw-ck">✓</span> Voice, media &amp; reports
              </li>
              <li>
                <span className="znw-ck">✓</span> Send gifts
              </li>
            </ul>
            <button
              className="pill pill-grad"
              onClick={() => {
                if (isLoggedIn) {
                  setShowCoins(true);
                } else {
                  setShowLogin(true);
                  setShowCoins(true);
                }
              }}
            >
              Top up &amp; chat
            </button>
          </div>
          <div className="znw-pc">
            <div className="znw-pname">Zintle PRO</div>
            <div className="znw-pamt">
              ₹199<span>/mo &amp; up</span>
            </div>
            <div className="znw-pdesc">Everything, ad-free.</div>
            <ul>
              <li>
                <span className="znw-ck">✓</span> Ad-free, priority access
              </li>
              <li>
                <span className="znw-ck">✓</span> Free minutes monthly
              </li>
              <li>
                <span className="znw-ck">✓</span> Weekly &amp; monthly plans
              </li>
            </ul>
            <button
              className="pill pill-ghost"
              onClick={() => setShowLogin(true)}
            >
              Go PRO
            </button>
          </div>
        </div>
        {coinPacks.length > 0 && (
          <div className="znw-coin-packs-row">
            <p className="znw-coin-packs-label grad-text">
              Or pick a coin pack directly:
            </p>
            <div className="znw-coin-packs">
              {coinPacks.slice(0, 6).map((pkg, i) => (
                <button
                  key={i}
                  className="znw-cpk"
                  onClick={() => handleRechargeClick(pkg)}
                >
                  <ZintleCoinIcon className={COIN_ICON_CLASS} />
                  <span>{pkg.coins} coins</span>
                  <strong>₹{pkg.price}</strong>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// Mobile-optimized Coins Page Component
const CoinsPage = ({
  setShowCoins,
  setShowLogin,
  coinPacks,
  coinPacksLoading,
  organisationId = DEFAULT_ORGANISATION_ID,
}: {
  setShowCoins: (v: boolean) => void;
  setShowLogin: (v: boolean) => void;
  coinPacks: any[];
  coinPacksLoading: boolean;
  organisationId?: string;
}) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tokenFromQuery = searchParams.get("id");

  const pixelContext = useMemo(
    () => parseCoinPixelContext(location.search, location.pathname),
    [location.search, location.pathname],
  );

  const quickRecharge = isQuickRechargeFromSearch(location.search);
  const displayedPacks = useMemo(
    () => (quickRecharge ? coinPacks.filter((p) => p.is_micropack) : coinPacks),
    [coinPacks, quickRecharge],
  );

  const timerPack = useMemo(
    () => resolveTimerPack(displayedPacks),
    [displayedPacks],
  );
  const exclusiveDeals = useMemo(
    () =>
      displayedPacks.filter((p) => p.is_micropack && p.id !== timerPack?.id),
    [displayedPacks, timerPack],
  );
  const topPlans = useMemo(
    () => displayedPacks.filter((p) => !p.is_micropack),
    [displayedPacks],
  );
  const storeViewedSentRef = useRef(false);
  const defaultPackSelectedRef = useRef(false);

  useEffect(() => {
    if (
      !pixelContext ||
      storeViewedSentRef.current ||
      displayedPacks.length === 0
    )
      return;
    storeViewedSentRef.current = true;
    if (quickRecharge) {
      sendQuickRechargePopupViewed(pixelContext, displayedPacks);
    } else {
      sendCoinStoreViewed(pixelContext, displayedPacks);
    }
  }, [pixelContext, displayedPacks, quickRecharge]);

  // Use token from query params if available, otherwise fall back to localStorage
  const token = tokenFromQuery || getJwtFromStorage(organisationId);
  const isLoggedIn = !!token;

  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  useEffect(() => {
    if (quickRecharge || displayedPacks.length === 0) return;

    const coin100Pack = displayedPacks.find(
      (p) => p.product_id === TIMER_COIN_PRODUCT_ID,
    );
    if (!coin100Pack) return;

    setSelectedPackage((prev) => prev ?? coin100Pack);

    if (defaultPackSelectedRef.current || !pixelContext) return;
    defaultPackSelectedRef.current = true;

    const index = getCoinPackStoreIndex(
      coin100Pack.id,
      timerPack,
      exclusiveDeals,
      topPlans,
    );
    sendCoinPackSelected(pixelContext, coin100Pack, index, {
      selected_by_default: true,
    });
  }, [
    quickRecharge,
    displayedPacks,
    pixelContext,
    timerPack,
    exclusiveDeals,
    topPlans,
  ]);

  const handlePackSelect = (pkg: any, index: number) => {
    setSelectedPackage(pkg);
    sendCoinPackSelected(pixelContext, pkg, index);
  };

  const handleDesktopRecharge = async (pkg: any, index: number) => {
    handlePackSelect(pkg, index);
    await handlePayClick(pkg);
  };

  const handleQuickRechargePay = async (pkg: any, index: number) => {
    handlePackSelect(pkg, index);
    await handlePayClick(pkg);
  };

  const handlePayClick = async (pkg?: any) => {
    const packageToUse = pkg;
    if (!packageToUse) return;

    // If user is logged out, open login popup instead of creating order
    if (!isLoggedIn) {
      setShowLogin(true);
      setShowCoins(true);
      return;
    }

    if (!packageToUse?.id) {
      console.warn("No coin_pack_id available for package", packageToUse);
      return;
    }
    try {
      await createOrderAndInitiatePayment(
        packageToUse.id,
        token,
        {
          trackCoinPixels: true,
          pixelContext,
          coinPack: {
            id: packageToUse.id,
            name: packageToUse.name,
            price: packageToUse.price,
            coins: packageToUse.coins,
            bonus_coins: packageToUse.bonus_coins ?? 0,
          },
        },
        organisationId,
      );
    } catch (e) {
      console.error("Failed to create coin order from CoinsPage", e);
    }
  };

  if (coinPacksLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg p-6">
        <div className="flex items-center gap-2 text-sm text-brand-muted">
          <i className="fa-solid fa-spinner fa-spin" aria-hidden />
          Loading coin packs…
        </div>
      </div>
    );
  }

  if (quickRecharge) {
    return (
      <QuickRechargePopup
        packs={displayedPacks}
        selectedPackageId={selectedPackage?.id ?? null}
        onPackSelect={handlePackSelect}
        onPackPay={handleQuickRechargePay}
      />
    );
  }

  const handleMobileRecharge = () => {
    if (selectedPackage) void handlePayClick(selectedPackage);
  };

  return (
    <div className="bg-brand-bg md:min-h-screen md:pb-8">
      <CoinStoreMobile
        timerPack={timerPack}
        exclusiveDeals={exclusiveDeals}
        topPlans={topPlans}
        selectedPackageId={selectedPackage?.id ?? null}
        onPackSelect={handlePackSelect}
        onRecharge={handleMobileRecharge}
      />

      <div className="container mx-auto hidden px-4 pb-8 pt-12 md:block md:pb-20">
        <h2 className="mb-12 text-center text-3xl font-bold text-white">
          Coin Packages
        </h2>

        {/* Desktop: Grid layout (same as CoinSection) */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {displayedPacks.map((pkg, i) => (
            <div
              key={i}
              className={`relative glass-card rounded-3xl p-6 text-center transition-transform hover:-translate-y-1 ${
                pkg.highlight
                  ? "border-2 border-brand-gold shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                  : "hover:bg-white/5"
              }`}
            >
              {pkg.tag && (
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full ${
                    pkg.highlight
                      ? "bg-brand-gold text-black"
                      : "text-green-600 bg-green-100"
                  }`}
                >
                  {pkg.tag}
                </span>
              )}
              <h3 className="mb-4 flex items-center justify-center gap-2 text-xl font-bold leading-none text-white">
                <ZintleCoinIcon className={COIN_ICON_CLASS} />
                <span>{pkg.coins} Coins</span>
              </h3>
              <p className="text-2xl font-bold text-white mb-6">₹{pkg.price}</p>
              <button
                onClick={() => handleDesktopRecharge(pkg, i)}
                className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-brand-primary/20"
              >
                {isLoggedIn ? "Recharge" : "Login"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SafetySection = () => (
  <section id="safety" className="znw-safety-sec">
    <div className="znw-wrap">
      <div className="znw-safety-box">
        <div
          className="znw-sec-head"
          style={{ marginBottom: 8, textAlign: "left", maxWidth: "none" }}
        >
          <div className="znw-sec-tag" style={{ color: "rgb(94,234,212)" }}>
            Trust &amp; safety first
          </div>
          <h2 className="znw-sec-title">Built to be a safe place to open up</h2>
          <p className="znw-sec-sub" style={{ marginTop: 8 }}>
            You're sharing real feelings and personal questions. We take that
            seriously — here's how we protect you.
          </p>
        </div>
        <div className="znw-safety-grid">
          {[
            [
              "🛡️",
              "Quality you can trust",
              "Guidance is grounded in real domain knowledge, quality-checked and continually improved.",
            ],
            [
              "🤝",
              "Honest & transparent",
              "We're always upfront about how Zintle works — no deception, and never impersonating a real person.",
            ],
            [
              "🔐",
              "Privacy protected",
              "Your conversations and data are protected, with control to delete anytime — aligned to India's DPDP Act.",
            ],
            [
              "⚖️",
              "No false promises",
              "Zintle is for reflection and companionship — never a substitute for professional medical, legal or financial advice.",
            ],
            [
              "💚",
              "Care when it counts",
              "If we sense you're in distress, we gently point you to professional support and trusted helplines.",
            ],
            [
              "🔞",
              "18+ & age-aware",
              "Any mature content is strictly age-gated and kept fully separate from the everyday experience.",
            ],
          ].map(([ic, h, p]) => (
            <div key={h} className="znw-sf">
              <div className="znw-sfi">{ic}</div>
              <h4>{h}</h4>
              <p>{p}</p>
            </div>
          ))}
        </div>
        <div className="znw-safety-bar">
          <div className="znw-sb-item">
            <span className="znw-sb-ic">🚩</span> Report any chat in one tap
          </div>
          <div className="znw-sb-item">
            <span className="znw-sb-ic">👥</span> Human review of flagged
            content
          </div>
          <div className="znw-sb-item">
            <span className="znw-sb-ic">🔒</span> Encrypted &amp; securely
            stored
          </div>
          <div className="znw-sb-links">
            <Link to="/guidelines">Community Guidelines</Link>
            <span>·</span>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const GetAppSection = ({
  setShowLogin,
}: {
  setShowLogin: (v: boolean) => void;
}) => (
  <section id="get" className="znw-get">
    <div className="znw-wrap">
      <div className="znw-final">
        <div style={{ marginBottom: 18 }}>
          <ZintleLogoSvg height={40} />
        </div>
        <h2>
          Someone is ready to listen.
          <br />
          Right now.
        </h2>
        <p>
          Start your first conversation in under a minute — in your language.
        </p>
        <div className="znw-hero-cta" style={{ justifyContent: "center" }}>
          <a
            href="https://play.google.com/store/apps/details?id=ai.zintle"
            target="_blank"
            rel="noopener noreferrer"
            className="znw-gplay lg"
            aria-label="Get it on Google Play"
          >
            <GooglePlayIcon size="lg" />
            <span className="gp-txt">
              <small>GET IT ON</small>
              <strong>Google Play</strong>
            </span>
          </a>
          <button
            className="pill pill-ghost"
            style={{ height: 54, padding: "0 28px", fontSize: 15 }}
            onClick={() => setShowLogin(true)}
          >
            Start your first chat
          </button>
        </div>
        <p style={{ marginTop: 18, fontSize: 13, color: "var(--muted)" }}>
          Apni baat. Apni bhasha. Apna Zintle.
        </p>
      </div>
    </div>
  </section>
);

const Footer = () => {
  const navigate = useNavigate();
  const scrollToSection = (id: string) => {
    navigate("/");
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };
  return (
    <footer className="znw-footer">
      <div className="znw-wrap">
        <div className="znw-foot">
          <div>
            <Link to="/" style={{ display: "inline-block", marginBottom: 10 }}>
              <ZintleLogoSvg height={28} />
            </Link>
            <p>
              India's conversational guidance &amp; companionship app — deep,
              personalised conversations in your own language, anytime.
            </p>
            <div className="znw-foot-social">
              <span className="fs-label">Follow us</span>
              <div className="fs-row">
                <a
                  href="https://x.com/zintleapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Zintle on X"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/zintleapp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Zintle on Instagram"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5.5" />
                    <circle cx="12" cy="12" r="4.2" />
                    <circle
                      cx="17.4"
                      cy="6.6"
                      r="1.2"
                      fill="currentColor"
                      stroke="none"
                    />
                  </svg>
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=ai.zintle&pcampaignid=web_share"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Zintle on Facebook"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="znw-foot-cols">
            <div className="znw-foot-col">
              <h5>Company</h5>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact Support</Link>
            </div>
            <div className="znw-foot-col">
              <h5>Community</h5>
              <button onClick={() => scrollToSection("safety")}>
                Trust &amp; Safety
              </button>
              <Link to="/guidelines">Guidelines</Link>
              <button onClick={() => scrollToSection("pricing")}>
                Plans &amp; Pricing
              </button>
            </div>
            <div className="znw-foot-col">
              <h5>Legal</h5>
              <Link to="/terms">Terms of Use</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/refund">Refund Policy</Link>
            </div>
          </div>
        </div>

        <p className="znw-disclaimer">
          Zintle provides conversational guidance and companionship for personal
          reflection and entertainment. It is not a substitute for professional
          medical, psychological, legal or financial advice. Conversations may
          be AI-generated and are not a relationship with a real person. If you
          are in crisis, please reach out to a qualified professional or local
          helpline.
        </p>

        <div className="znw-foot-bottom">
          <span>© 2026 Sofnics Tech Labs Pvt. Ltd. All Rights Reserved.</span>
          <span>Made in India · for Bharat 🇮🇳</span>
        </div>
      </div>
    </footer>
  );
};

const mapCoinPack = (p: any) => ({
  id: p.id,
  coins: p.coin_value,
  price: p.amount,
  bonus: p.bonus_coins,
  bonus_coins: p.bonus_coins ?? 0,
  product_id: p.product_id,
  name: p.name,
  icon_url: p.icon_url ?? null,
  is_micropack: Boolean(p.is_micropack ?? p.isMicropack),
  color: "bg-brand-surface",
  tag: p.isBonusPack
    ? "Bonus Pack"
    : p.isTrialPack
      ? "Trial Pack"
      : (p.is_micropack ?? p.isMicropack)
        ? "Micropack"
        : undefined,
  highlight: p.isBonusPack || false,
});

const Layout = () => {
  const location = useLocation();
  const organisationId = useMemo(
    () => getOrganisationIdFromSearch(location.search, location.pathname),
    [location.search, location.pathname],
  );
  const isCoinsPage = location.pathname === "/coins";
  const isQuickRechargeCoinsPage =
    isCoinsPage && isQuickRechargeFromSearch(location.search);
  const isSubscriptionsPage = location.pathname === "/subscriptions";
  const isCampaignPage =
    (location.pathname.replace(/\/+$/, "") || "/") === "/campaign";
  const isFbRedirectPage = location.pathname === "/fb-redirect";
  const isPaymentStatusPage = location.pathname === "/payment-status";
  const [showLogin, setShowLogin] = useState(false);
  const [showCoins, setShowCoins] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(hasAnyJwtInStorage());
  const [coinPacks, setCoinPacks] = useState<any[]>([]);
  const [coinPacksLoading, setCoinPacksLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  useEffect(() => {
    sendMetaPixelPageView(organisationId);
  }, [organisationId, location.pathname]);

  // Fetch coin packs on mount/when logged in changes
  useEffect(() => {
    let cancelled = false;

    const fetchPacks = async () => {
      setCoinPacksLoading(true);
      try {
        const searchParams = new URLSearchParams(location.search);
        const tokenFromQuery = searchParams.get("id");
        const rawToken = tokenFromQuery || getJwtFromStorage(organisationId);
        const jwtToken = headerSafeToken(rawToken);
        const r = await fetch(
          `${HOST}/api/v1.2/creator_center/details/get-coin-pack-details/`,
          {
            headers: {
              ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
              "X-Organisation-ID": organisationId,
            },
          },
        );
        const data = await r.json();
        if (cancelled) return;
        if (data.success && Array.isArray(data.data)) {
          setCoinPacks(
            data.data
              .filter((p: any) => p.is_active)
              .map((p: any) => mapCoinPack(p)),
          );
        } else {
          setCoinPacks([]);
        }
      } catch {
        if (!cancelled) setCoinPacks([]);
      } finally {
        if (!cancelled) setCoinPacksLoading(false);
      }
    };
    void fetchPacks();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, organisationId, location.search]);

  // Check JWT changes after CoinStore closes
  useEffect(() => {
    const check = () => setIsLoggedIn(hasAnyJwtInStorage());
    if (!showLogin && !showCoins) check();
  }, [showLogin, showCoins]);

  // Set up payment status callback
  useEffect(() => {
    setPaymentStatusCallback((status: string) => {
      setPaymentStatus(status);
    });
    return () => {
      setPaymentStatusCallback(() => {});
    };
  }, []);

  // Logout clears JWT
  const handleLogout = () => {
    clearAllJwtStorage();
    setIsLoggedIn(false);
    setShowLogin(false);
    setShowCoins(false);
  };

  return (
    <div
      className={`text-brand-text font-sans ${
        isCampaignPage
          ? "h-dvh max-h-dvh overflow-hidden"
          : isQuickRechargeCoinsPage
            ? "h-auto min-h-0 bg-transparent"
            : isCoinsPage
              ? ""
              : "min-h-screen"
      }`}
    >
      {!isCoinsPage &&
        !isSubscriptionsPage &&
        !isCampaignPage &&
        !isFbRedirectPage &&
        !isPaymentStatusPage && (
          <Header
            setShowLogin={setShowLogin}
            setShowCoins={setShowCoins}
            isLoggedIn={isLoggedIn}
            onLogout={handleLogout}
          />
        )}

      <Routes>
        <Route
          path="/"
          element={
            <>
              <Hero setShowLogin={setShowLogin} setShowCoins={setShowCoins} />
              <div className="znw-wrap znw-trust-strip">
                <div className="znw-trust">
                  <div className="znw-stat">
                    <span className="big">Goes deep</span>
                    <span className="lbl">
                      Real conversations, not quick replies
                    </span>
                  </div>
                  <div className="znw-stat">
                    <span className="big">Remembers</span>
                    <span className="lbl">
                      Builds on your journey over time
                    </span>
                  </div>
                  <div className="znw-stat">
                    <span className="big">7+</span>
                    <span className="lbl">Indian languages &amp; Hinglish</span>
                  </div>
                  <div className="znw-stat">
                    <span className="big">24×7</span>
                    <span className="lbl">Always there, judgement-free</span>
                  </div>
                </div>
              </div>
              <ExploreSection />
              <HowItWorks />
              <WhyDifferent />
              <CoinSection
                setShowCoins={setShowCoins}
                setShowLogin={setShowLogin}
                coinPacks={coinPacks}
                organisationId={organisationId}
              />
              <SafetySection />
              <GetAppSection setShowLogin={setShowLogin} />
            </>
          }
        />
        <Route
          path="/coins"
          element={
            <CoinsPage
              setShowCoins={setShowCoins}
              setShowLogin={setShowLogin}
              coinPacks={coinPacks}
              coinPacksLoading={coinPacksLoading}
              organisationId={organisationId}
            />
          }
        />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/safety" element={<Safety />} />
        <Route path="/guidelines" element={<Guidelines />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/refund" element={<Refund />} />
        <Route path="/child-safety-standards" element={<ChildSafety />} />
        <Route
          path="/subscriptions"
          element={<Subscriptions setShowLogin={setShowLogin} />}
        />
        <Route
          path="/campaign"
          element={
            <Campaign
              organisationId={organisationId}
              setShowLogin={setShowLogin}
            />
          }
        />
        <Route path="/fb-redirect" element={<FBRedirect />} />
        <Route path="/payment-status" element={<PaymentStatus />} />
      </Routes>

      {!isCoinsPage &&
        !isSubscriptionsPage &&
        !isCampaignPage &&
        !isFbRedirectPage &&
        !isPaymentStatusPage && <Footer />}

      {(showCoins || showLogin) && (
        <CoinStore
          onClose={() => {
            setShowCoins(false);
            setShowLogin(false);
          }}
          initialStep={showLogin ? "login" : "store"}
          coinPacks={coinPacks}
          organisationId={organisationId}
        />
      )}

      {paymentStatus && (
        <PaymentStatusPopup
          status={paymentStatus}
          onClose={() => setPaymentStatus(null)}
        />
      )}
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <Layout />
  </BrowserRouter>
);

const appRoot = createRoot(document.getElementById("root")!);
appRoot.render(<App />);
