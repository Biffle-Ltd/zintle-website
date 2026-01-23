import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { Safety } from "./pages/Safety";
import { Guidelines } from "./pages/Guidelines";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { Refund } from "./pages/Refund";
import { ChildSafety } from "./pages/ChildSafety";

const HOST = "https://dev.zintle.ai";
// const HOST = "http://127.0.0.1:8003";
const { VITE_EASEBUZZ_KEY, VITE_EASEBUZZ_ENV } = (import.meta as any).env;
const EASEBUZZ_KEY = VITE_EASEBUZZ_KEY;
const EASEBUZZ_ENV = VITE_EASEBUZZ_ENV;

// Global callback for showing payment status popup
let showPaymentStatusCallback: ((status: string) => void) | null = null;
export const setPaymentStatusCallback = (
  callback: (status: string) => void
) => {
  showPaymentStatusCallback = callback;
};

// Shared helper to create coin purchase orders
const createCoinOrder = async (coinPackId: number | string) => {
  const token = localStorage.getItem("zintle_jwt");
  const r = await fetch(`${HOST}/api/v1.2/monetization/orders/create/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      coin_pack_id: coinPackId,
      payment_gateway: "EASEBUZZ",
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
  mandateUuid?: number | string | null
) => {
  const token = localStorage.getItem("zintle_jwt");
  const r = await fetch(
    `${HOST}/api/v1.2/monetization/orders/initiate-payment/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        order_uuid: orderUuid,
        mandate_uuid: mandateUuid ?? null,
      }),
    }
  );
  const data = await r.json();
  if (!r.ok) {
    throw new Error(data.detail || "Failed to initiate payment");
  }
  return data;
};

// Lazy-load Easebuzz checkout script once
// let easebuzzScriptPromise: Promise<void> | null = null;
// const loadEasebuzzScript = () => {
//   if (easebuzzScriptPromise) return easebuzzScriptPromise;
//   easebuzzScriptPromise = new Promise((resolve, reject) => {
//     if (document.getElementById("easebuzz-checkout-script")) {
//       resolve();
//       return;
//     }
//     const script = document.createElement("script");
//     script.id = "easebuzz-checkout-script";
//     script.src =
//       "https://ebz-static.s3.ap-south-1.amazonaws.com/easecheckout/v2.0.0/easebuzz-checkout-v2.min.js";
//     script.async = true;
//     script.onload = () => resolve();
//     script.onerror = () => reject(new Error("Failed to load Easebuzz script"));
//     document.body.appendChild(script);
//   });
//   return easebuzzScriptPromise;
// };

export function extractEasebuzzAccessKey(value) {
  if (!value || typeof value !== "string") return "";

  // If full URL, extract last path segment
  if (value.includes("/pay/")) {
    return value.replace(/\/+$/, "").split("/").pop();
  }

  // Already a token
  return value;
}

// Backend validation for Easebuzz payment using order UUID
const validateEasebuzzPayment = async (orderUuid?: string | null) => {
  if (!orderUuid) {
    return;
  }
  try {
    const r = await fetch(
      `${HOST}/api/v1.2/monetization/easebuzz/payment/validate/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order_uuid: orderUuid }),
      }
    );
    const data = await r.json().catch(() => null);
    if (!r.ok) {
      console.error("Easebuzz validation failed", { status: r.status, data });
      return;
    }
    console.log("Easebuzz payment validated", data);

    // Check payment_status and show popup accordingly
    const paymentStatus = data?.data?.payment_status;
    if (paymentStatus) {
      showPaymentStatusCallback(paymentStatus);
    }
  } catch (err) {
    console.error("Failed to validate Easebuzz payment", err);
  }
};

// Fire Easebuzz iframe checkout with access token
const launchEasebuzzCheckout = async (paymentData: any) => {
  const orderUuid = paymentData?.order_uuid;
  try {
    const accessKey = extractEasebuzzAccessKey(paymentData?.access_token);
    const merchantKey = EASEBUZZ_KEY;
    const env = EASEBUZZ_ENV;

    if (!accessKey) {
      console.warn(
        "Missing Easebuzz access key in payment response",
        paymentData
      );
      return;
    }
    if (!merchantKey) {
      console.warn("Missing Easebuzz merchant key (set VITE_EASEBUZZ_KEY)");
      return;
    }

    const easebuzzCheckout = new (window as any).EasebuzzCheckout(
      merchantKey,
      env
    );
    const options = {
      access_key: accessKey,
      onResponse: (response: any) => {
        console.log("Easebuzz response ----------------->", response);
        validateEasebuzzPayment(orderUuid);
      },
      theme: "#123456",
    };
    easebuzzCheckout.initiatePayment(options);
  } catch (err) {
    console.error("Error occurred in Easebuzz checkout", err);
    validateEasebuzzPayment(orderUuid);
  }
};

// Combined helper to create order and immediately initiate payment
const createOrderAndInitiatePayment = async (coinPackId: number | string) => {
  const orderData = await createCoinOrder(coinPackId);
  const order = orderData.data;
  if (!order?.order_uuid) {
    return;
  }
  const paymentData = await initiatePayment(
    order.order_uuid,
    order.mandate_uuid ?? null
  );
  const payment = paymentData.data;
  // Trigger Easebuzz iframe using access token from payment response
  launchEasebuzzCheckout(payment);
  return { order, payment };
};

const ZintleLogo = ({ h }: { h?: string }) => (
  <img
    src="/zintle_logo.png"
    alt="Zintle Logo"
    className={`w-auto ${h || "h-8"} object-contain`}
  />
);

// Payment Status Popup Component
const PaymentStatusPopup = ({
  status,
  onClose,
}: {
  status: string;
  onClose: () => void;
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "SUCCESS":
        return {
          icon: "fa-check-circle",
          iconColor: "text-green-500",
          bgColor: "bg-green-500/20",
          title: "Payment Successful!",
          message:
            "Your payment has been processed successfully. Coins have been added to your wallet.",
          buttonColor: "bg-green-500 hover:bg-green-600",
        };
      case "FAILED":
        return {
          icon: "fa-times-circle",
          iconColor: "text-red-500",
          bgColor: "bg-red-500/20",
          title: "Payment Failed",
          message:
            "Your payment could not be processed. Please try again or contact support if the issue persists.",
          buttonColor: "bg-red-500 hover:bg-red-600",
        };
      case "CANCELLED":
        return {
          icon: "fa-ban",
          iconColor: "text-orange-500",
          bgColor: "bg-orange-500/20",
          title: "Payment Cancelled",
          message:
            "The payment was cancelled. You can try again when you're ready.",
          buttonColor: "bg-orange-500 hover:bg-orange-600",
        };
      case "PENDING":
        return {
          icon: "fa-clock",
          iconColor: "text-yellow-500",
          bgColor: "bg-yellow-500/20",
          title: "Payment Pending",
          message:
            "Your payment is being processed. Please wait for confirmation. We'll notify you once it's complete.",
          buttonColor: "bg-yellow-500 hover:bg-yellow-600",
        };
      case "INITIATED":
        return {
          icon: "fa-hourglass-half",
          iconColor: "text-blue-500",
          bgColor: "bg-blue-500/20",
          title: "Payment Initiated",
          message:
            "Your payment has been initiated. Please complete the payment process.",
          buttonColor: "bg-blue-500 hover:bg-blue-600",
        };
      case "UNKNOWN":
      default:
        return {
          icon: "fa-question-circle",
          iconColor: "text-gray-500",
          bgColor: "bg-gray-500/20",
          title: "Payment Status Unknown",
          message:
            "We couldn't determine the payment status. Please check your order history or contact support.",
          buttonColor: "bg-gray-500 hover:bg-gray-600",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-brand-surface w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white hover:text-red-400 transition-all z-10"
          aria-label="Close"
        >
          <i className="fa-solid fa-xmark text-sm"></i>
        </button>

        <div className="p-8 text-center">
          <div
            className={`w-20 h-20 ${config.bgColor} ${config.iconColor} rounded-full flex items-center justify-center text-4xl mx-auto mb-6`}
          >
            <i className={`fa-solid ${config.icon}`}></i>
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">{config.title}</h3>
          <p className="text-brand-muted mb-6 text-sm leading-relaxed">
            {config.message}
          </p>
          <button
            onClick={onClose}
            className={`${config.buttonColor} text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
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
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navTo = (destination: string) => {
    if (destination === "features") {
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          const el = document.getElementById("features");
          if (el) {
            const headerOffset = 80;
            const elementPosition = el.getBoundingClientRect().top;
            const offsetPosition =
              elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth",
            });
          }
        }, 100);
      } else {
        const el = document.getElementById("features");
        if (el) {
          const headerOffset = 80;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }
    } else if (destination === "home") {
      navigate("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/" + destination);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "glass py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <button
          onClick={() => navTo("home")}
          className="hover:opacity-80 transition-opacity"
        >
          <ZintleLogo h="h-8" />
        </button>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-brand-muted">
          <button
            onClick={() => navTo("home")}
            className="hover:text-white transition-colors"
          >
            Home
          </button>
          <button
            onClick={() => navTo("features")}
            className="hover:text-white transition-colors"
          >
            Features
          </button>
          <button
            onClick={() => navTo("guidelines")}
            className="hover:text-white transition-colors"
          >
            Guidelines
          </button>
          <button
            onClick={() => navTo("privacy")}
            className="hover:text-white transition-colors"
          >
            Privacy Policy
          </button>
        </nav>

        <div className="flex items-center gap-4">
          {!isLoggedIn ? (
            <button
              onClick={() => setShowLogin(true)}
              className="text-sm font-bold text-white hover:text-brand-primary transition-colors"
            >
              Log In
            </button>
          ) : (
            <>
              <button className="text-sm font-bold text-white hover:text-brand-primary transition-colors">
                My Account
              </button>
              <button
                onClick={onLogout}
                className="text-sm font-bold text-brand-muted hover:text-red-500 transition-colors"
              >
                Log Out
              </button>
            </>
          )}
          <button
            onClick={() => setShowCoins(true)}
            className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white text-sm font-bold py-2 px-5 rounded-full shadow-lg shadow-brand-primary/20 transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-coins"></i> Get Coins
          </button>
        </div>
      </div>
    </header>
  );
};

const Hero = ({ setShowCoins }: { setShowCoins: (v: boolean) => void }) => (
  <section className="relative pt-32 pb-20 overflow-hidden min-h-[90vh] flex items-center">
    {/* Background Elements */}
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl animate-pulse-slow"
        style={{ animationDelay: "1.5s" }}
      ></div>
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
    </div>

    <div className="container mx-auto px-4 max-w-7xl">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
        {/* Left: Text Content */}
        <div className="w-full lg:w-1/2 text-center lg:text-left z-10 flex flex-col items-center lg:items-start">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm animate-fade-in mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-brand-secondary text-xs font-bold tracking-wider uppercase">
              Live Entertainment 24/7
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight animate-slide-up">
            Your AI Companions <br />
            <span className="text-gradient">For Every Mood</span>
          </h1>

          <p
            className="text-lg md:text-xl text-brand-muted max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            Bored? Lonely? Or just want to have fun? Chat, roleplay, and connect
            with lifelike AI characters anytime, anywhere.
            <span className="text-white font-medium">
              {" "}
              Zintle is entertainment in your pocket.
            </span>
          </p>

          <div
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-slide-up w-full sm:w-auto"
            style={{ animationDelay: "0.2s" }}
          >
            <a
              href="https://play.google.com/store/apps/details?id=ai.zintle&hl=en_IN"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-transparent border border-white/20 text-white font-bold py-4 px-8 rounded-full hover:bg-white/5 transition-all flex items-center justify-center gap-3 transform hover:scale-105"
            >
              <i className="fa-brands fa-google-play text-xl"></i>
              <div className="text-left leading-tight">
                <span className="block text-[10px] font-medium uppercase tracking-wider text-brand-muted">
                  Get it on
                </span>
                <span className="block text-sm">Google Play</span>
              </div>
            </a>
          </div>

          <div
            className="mt-8 flex items-center justify-center lg:justify-start gap-4 text-xs text-brand-muted animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-brand-bg bg-white/10 flex items-center justify-center overflow-hidden"
                >
                  <i className="fa-solid fa-user text-white/50"></i>
                </div>
              ))}
            </div>
            <p>
              Join <span className="text-white font-bold">10,000+</span> users
              chatting now
            </p>
          </div>
        </div>

        {/* Right: Phone Mockup */}
        <div
          className="w-full lg:w-1/2 flex justify-center lg:justify-end relative animate-slide-up"
          style={{ animationDelay: "0.3s" }}
        >
          {/* Phone Frame */}
          <div className="relative border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl flex flex-col overflow-hidden transform lg:scale-105 lg:-ml-4">
            <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
            <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>

            {/* Screen Content */}
            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-brand-bg flex flex-col relative">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-xl z-20"></div>

              {/* App Header */}
              <div className="pt-10 pb-4 px-4 bg-brand-surface/80 backdrop-blur-md border-b border-white/5 flex items-center gap-3 z-10">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-brand-primary p-0.5">
                    <img
                      src="https://api.dicebear.com/9.x/avataaars/svg?seed=Lyra&backgroundColor=b6e3f4"
                      alt="Avatar"
                      className="w-full h-full rounded-full bg-brand-bg"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-brand-bg rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Lyra</h3>
                  <p className="text-[10px] text-brand-primary font-medium tracking-wide">
                    ONLINE NOW
                  </p>
                </div>
                <div className="ml-auto text-white/50">
                  <i className="fa-solid fa-ellipsis-vertical"></i>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 p-4 space-y-4 overflow-hidden relative">
                {/* Messages */}
                <div className="flex items-end gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0 overflow-hidden">
                    <img
                      src="https://api.dicebear.com/9.x/avataaars/svg?seed=Lyra&backgroundColor=b6e3f4"
                      alt="AI"
                    />
                  </div>
                  <div className="bg-white/10 text-gray-200 text-xs p-3 rounded-2xl rounded-bl-none max-w-[85%]">
                    The neon lights look amazing tonight! 🌃 Want to grab some
                    ramen and pretend we're saving the world?
                  </div>
                </div>

                <div className="flex items-end gap-2 flex-row-reverse">
                  <div className="bg-brand-primary text-white text-xs p-3 rounded-2xl rounded-br-none max-w-[85%] shadow-lg shadow-brand-primary/20">
                    Haha, you read my mind! Only if you promise not to hack the
                    vending machine this time. 😂
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0 overflow-hidden">
                    <img
                      src="https://api.dicebear.com/9.x/avataaars/svg?seed=Lyra&backgroundColor=b6e3f4"
                      alt="AI"
                    />
                  </div>
                  <div className="bg-white/10 text-gray-200 text-xs p-3 rounded-2xl rounded-bl-none max-w-[85%]">
                    No promises! 🤫 But hey, seriously, I've missed our chats.
                    Ready for an adventure?
                  </div>
                </div>

                {/* Typing Indicator */}
                <div className="flex items-center gap-1 pl-9 mt-2">
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce"></span>
                  <span
                    className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></span>
                  <span
                    className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></span>
                </div>

                {/* Gradient Overlay for bottom fade */}
                <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-brand-bg to-transparent pointer-events-none"></div>
              </div>

              {/* Input Area */}
              <div className="p-3 bg-brand-surface/50 backdrop-blur-md border-t border-white/5">
                <div className="flex items-center gap-2 bg-black/20 rounded-full px-4 py-2 border border-white/5">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="bg-transparent text-white text-xs w-full outline-none placeholder-white/30"
                    disabled
                  />
                  <button className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs shadow-lg shadow-brand-primary/20">
                    <i className="fa-solid fa-paper-plane"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Blobs behind phone */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-brand-primary/20 rounded-full blur-[80px] -z-10 animate-pulse-slow"></div>
        </div>
      </div>
    </div>
  </section>
);
const Features = () => (
  <section id="features" className="py-24 bg-brand-bg relative overflow-hidden">
    <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-blue/5 blur-3xl -z-10"></div>
    <div className="container mx-auto px-4">
      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
          Your Gateway to{" "}
          <span className="text-gradient">Infinite Adventures</span>
        </h2>
        <p className="text-brand-muted text-lg max-w-3xl mx-auto leading-relaxed">
          Dive into Zintle's immersive library of AI-powered interactive
          stories, where every conversation shapes your unique narrative
          journey. Designed for both casual readers and avid story lovers, our
          Story Explorer puts endless adventures at your fingertips.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        {/* Card 1 */}
        <div className="glass-card p-8 rounded-3xl hover:bg-white/5 transition-all group border-l-4 border-l-brand-primary h-full">
          <div className="w-14 h-14 rounded-2xl bg-brand-primary/20 flex items-center justify-center text-brand-primary text-2xl mb-6 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-wand-magic-sparkles"></i>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">
            Smart Recommendations
          </h3>
          <ul className="space-y-3 text-brand-muted">
            <li className="flex gap-3">
              <i className="fa-solid fa-check text-brand-primary mt-1"></i>{" "}
              <span>
                <strong className="text-white">"Because You Liked..."</strong> –
                Follow-up stories matching your tastes
              </span>
            </li>
            <li className="flex gap-3">
              <i className="fa-solid fa-check text-brand-primary mt-1"></i>{" "}
              <span>
                <strong className="text-white">Mood-Based Picks</strong> –
                "Feel-Good Tales" or "Dark Thrillers" filters
              </span>
            </li>
            <li className="flex gap-3">
              <i className="fa-solid fa-check text-brand-primary mt-1"></i>{" "}
              <span>
                <strong className="text-white">Community Trending</strong> – See
                what stories are going viral
              </span>
            </li>
          </ul>
        </div>

        {/* Card 2 */}
        <div className="glass-card p-8 rounded-3xl hover:bg-white/5 transition-all group border-l-4 border-l-blue-500 h-full">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 text-2xl mb-6 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-compass"></i>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">
            Advanced Browsing
          </h3>
          <ul className="space-y-3 text-brand-muted">
            <li className="flex gap-3">
              <i className="fa-solid fa-check text-blue-400 mt-1"></i>{" "}
              <span>
                <strong className="text-white">Genre Shelves</strong> (Fantasy,
                Sci-Fi, Romance, Horror + 15 more)
              </span>
            </li>
            <li className="flex gap-3">
              <i className="fa-solid fa-check text-blue-400 mt-1"></i>{" "}
              <span>
                <strong className="text-white">Length Tags</strong> (5-min
                Quickies | 30-min Epics | Serialized Sagas)
              </span>
            </li>
            <li className="flex gap-3">
              <i className="fa-solid fa-check text-blue-400 mt-1"></i>{" "}
              <span>
                <strong className="text-white">Thematic Collections</strong>{" "}
                ("Strong Female Leads" | "Mind-Bend Mysteries")
              </span>
            </li>
          </ul>
        </div>

        {/* Card 3 */}
        <div className="glass-card p-8 rounded-3xl hover:bg-white/5 transition-all group border-l-4 border-l-brand-teal h-full">
          <div className="w-14 h-14 rounded-2xl bg-brand-teal/20 flex items-center justify-center text-brand-teal text-2xl mb-6 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-masks-theater"></i>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">
            Dynamic Play Modes
          </h3>
          <ul className="space-y-3 text-brand-muted">
            <li className="flex gap-3">
              <i className="fa-solid fa-check text-brand-teal mt-1"></i>{" "}
              <span>
                <strong className="text-white">Reader Mode</strong> –
                Traditional choose-your-path with text options
              </span>
            </li>
            <li className="flex gap-3">
              <i className="fa-solid fa-check text-brand-teal mt-1"></i>{" "}
              <span>
                <strong className="text-white">Roleplay Mode</strong> – Type
                freely like chatting with a character
              </span>
            </li>
            <li className="flex gap-3">
              <i className="fa-solid fa-check text-brand-teal mt-1"></i>{" "}
              <span>
                <strong className="text-white">Audio Drama</strong> – Full
                voice-acted experience with sound effects
              </span>
            </li>
          </ul>
        </div>

        {/* Card 4 */}
        <div className="glass-card p-8 rounded-3xl hover:bg-white/5 transition-all group border-l-4 border-l-brand-gold h-full">
          <div className="w-14 h-14 rounded-2xl bg-brand-gold/20 flex items-center justify-center text-brand-gold text-2xl mb-6 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-gamepad"></i>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">
            Game-Changing Features
          </h3>
          <ul className="space-y-3 text-brand-muted">
            <li className="flex gap-3">
              <i className="fa-solid fa-check text-brand-gold mt-1"></i>{" "}
              <span>
                <strong className="text-white">Memory Timeline</strong> – Review
                key past decisions that shaped your story
              </span>
            </li>
            <li className="flex gap-3">
              <i className="fa-solid fa-check text-brand-gold mt-1"></i>{" "}
              <span>
                <strong className="text-white">Alternative Endings</strong> –
                Replay to unlock different conclusions
              </span>
            </li>
            <li className="flex gap-3">
              <i className="fa-solid fa-check text-brand-gold mt-1"></i>{" "}
              <span>
                <strong className="text-white">
                  Character Relationship Meter
                </strong>{" "}
                – See how your choices affect bonds
              </span>
            </li>
          </ul>
        </div>

        {/* Card 5 */}
        <div className="glass-card p-8 rounded-3xl hover:bg-white/5 transition-all group border-l-4 border-l-purple-500 relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 bg-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
            PREMIUM
          </div>
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400 text-2xl mb-6 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-crown"></i>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Premium Perks</h3>
          <ul className="space-y-3 text-brand-muted">
            <li className="flex gap-3">
              <i className="fa-solid fa-check text-purple-400 mt-1"></i>{" "}
              <span>
                <strong className="text-white">Unlimited Story Access</strong> –
                No daily caps on premium content
              </span>
            </li>
            <li className="flex gap-3">
              <i className="fa-solid fa-check text-purple-400 mt-1"></i>{" "}
              <span>
                <strong className="text-white">Early Releases</strong> – Get new
                stories 1 week before free users
              </span>
            </li>
            <li className="flex gap-3">
              <i className="fa-solid fa-check text-purple-400 mt-1"></i>{" "}
              <span>
                <strong className="text-white">VIP Character Requests</strong> –
                Suggest traits for future AI personas
              </span>
            </li>
          </ul>
        </div>

        {/* Card 6 */}
        <div className="glass-card p-8 rounded-3xl hover:bg-white/5 transition-all group border-l-4 border-l-gray-400 h-full">
          <div className="w-14 h-14 rounded-2xl bg-gray-700 flex items-center justify-center text-gray-300 text-2xl mb-6 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-mobile-screen"></i>
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">
            Always Within Reach
          </h3>
          <ul className="space-y-3 text-brand-muted">
            <li className="flex gap-3">
              <i className="fa-solid fa-check text-gray-400 mt-1"></i>{" "}
              <span>
                <strong className="text-white">Download Stories</strong> for
                offline reading/listening
              </span>
            </li>
            <li className="flex gap-3">
              <i className="fa-solid fa-check text-gray-400 mt-1"></i>{" "}
              <span>
                <strong className="text-white">Sync Progress</strong> across all
                your devices
              </span>
            </li>
            <li className="flex gap-3">
              <i className="fa-solid fa-check text-gray-400 mt-1"></i>{" "}
              <span>
                <strong className="text-white">Night Mode</strong> – Dark theme
                for bedtime reading
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xl md:text-2xl text-white font-serif italic mb-10 opacity-90">
          "The best stories aren't just read—they're lived. Where will Zintle
          take you today?"
        </p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-bold py-4 px-10 rounded-full shadow-xl shadow-brand-primary/30 transition-all transform hover:scale-105 text-lg"
        >
          Start Exploring Now
        </button>
      </div>
    </div>
  </section>
);

const CoinStore = ({
  onClose,
  initialStep = "store",
  coinPacks,
}: {
  onClose: () => void;
  initialStep?: "store" | "login";
  coinPacks: any[];
}) => {
  const [step, setStep] = useState<"store" | "login" | "otp" | "success">(
    initialStep
  );
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginAnim, setLoginAnim] = useState(true);
  const [otpAnim, setOtpAnim] = useState(false);
  const countryCode = "91";

  // Helper: isLoggedIn
  const isLoggedIn = !!localStorage.getItem("zintle_jwt");
  console.log({ isLoggedIn }, { HOST });
  React.useEffect(() => {
    if (step === "login") {
      setLoginAnim(true);
    } else {
      setLoginAnim(false);
    }
    if (step === "otp") {
      setOtpAnim(true);
    } else {
      setOtpAnim(false);
    }
  }, [step]);

  // Send OTP API call
  const handleSendOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${HOST}/api/v1.2/auth/login/otp/request/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "X-Organisation-ID": "ZINTEL1234",
        },
        body: JSON.stringify({
          country_code: countryCode,
          phone_number: phone,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "Failed to send OTP");
      setStep("otp");
    } catch (e: any) {
      setError(e.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };
  // Verify OTP API call
  const handleVerifyOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${HOST}/api/v1/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "X-Organisation-ID": "ZINTEL1234",
        },
        body: JSON.stringify({
          provider: "phone",
          country_code: countryCode,
          phone_number: phone,
          otp,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "Failed to verify OTP");
      // Save JWT token
      if (data.token) {
        localStorage.setItem("zintle_jwt", data.token);
      }
      onClose();
      // Optionally notify parent UI about login status, if needed
    } catch (e: any) {
      setError(e.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const packs = coinPacks;

  const handleBuy = async (pack: any) => {
    setSelectedPack(pack);

    // If user is not logged in, show login step instead of starting payment
    if (!isLoggedIn) {
      setStep("login");
      return;
    }

    // Fire order creation API only for logged-in users
    if (pack?.id) {
      try {
        await createOrderAndInitiatePayment(pack.id);
        onClose();
      } catch (e) {
        console.error("Failed to create coin order from CoinStore", e);
      }
    }
  };

  const LoginStep = () => (
    <div
      className={loginAnim ? "animate-fade-in" : undefined}
      onAnimationEnd={() => setLoginAnim(false)}
    >
      <h3 className="text-2xl font-bold text-white mb-2">Log in to Zintle</h3>
      <p className="text-brand-muted mb-6 text-sm">
        Enter your mobile number to continue purchase
      </p>
      <div className="space-y-4">
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-gray-400">+91</span>
          <input
            type="tel"
            placeholder="Enter mobile number"
            className="bg-transparent w-full text-white outline-none placeholder-gray-600 font-medium"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            autoFocus
            disabled={loading}
          />
        </div>
        {error && <div className="text-red-500 text-xs">{error}</div>}
        <button
          onClick={handleSendOtp}
          disabled={loading || !phone}
          className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-primary/25"
        >
          {loading ? "Sending..." : "Send OTP"}
        </button>
      </div>
    </div>
  );
  const OtpStep = () => (
    <div
      className={otpAnim ? "animate-fade-in" : undefined}
      onAnimationEnd={() => setOtpAnim(false)}
    >
      <h3 className="text-2xl font-bold text-white mb-2">Enter OTP</h3>
      <p className="text-brand-muted mb-6 text-sm">
        Please enter the 6-digit code sent to <b>+91 {phone}</b>
      </p>
      <div className="space-y-4">
        <input
          type="text"
          maxLength={6}
          pattern="[0-9]{6}"
          inputMode="numeric"
          placeholder="OTP"
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none placeholder-gray-600 font-medium w-full text-center tracking-widest text-lg"
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          autoFocus
          disabled={loading}
        />
        {error && <div className="text-red-500 text-xs">{error}</div>}
        <button
          onClick={handleVerifyOtp}
          disabled={loading || otp.length !== 6}
          className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-primary/25"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
        <button
          onClick={() => setStep("login")}
          disabled={loading}
          className="text-xs text-brand-muted underline"
        >
          Edit mobile number
        </button>
      </div>
    </div>
  );

  // const PaymentStep = () => {
  //   React.useEffect(() => {
  //     if (!selectedPack) onClose();
  //   }, [selectedPack, onClose]);
  //   if (!selectedPack) return null;
  //   return (
  //     <div className="animate-fade-in">
  //       <div className="flex justify-between items-center mb-6 pb-6 border-b border-white/10">
  //         <div>
  //           <p className="text-brand-muted text-sm">Paying for</p>
  //           <p className="text-xl font-bold text-white">
  //             {selectedPack.coins} Zintle Coins
  //           </p>
  //         </div>
  //         <div className="text-right">
  //           <p className="text-brand-muted text-sm">Amount</p>
  //           <p className="text-xl font-bold text-brand-primary">
  //             ₹{selectedPack.price}
  //           </p>
  //         </div>
  //       </div>
  //       <p className="text-sm font-bold text-white mb-4">
  //         Select Payment Method
  //       </p>
  //       <div className="space-y-3 mb-6">
  //         {["UPI", "Credit/Debit Card", "Net Banking"].map((m) => (
  //           <label
  //             key={m}
  //             className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
  //           >
  //             <input
  //               type="radio"
  //               name="payment"
  //               className="accent-brand-primary"
  //               defaultChecked={m === "UPI"}
  //             />
  //             <span className="text-gray-300">{m}</span>
  //           </label>
  //         ))}
  //       </div>
  //       <button
  //         onClick={() => setStep("success")}
  //         className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-green-500/25"
  //       >
  //         Pay ₹{selectedPack.price}
  //       </button>
  //     </div>
  //   );
  // };

  const SuccessStep = () => (
    <div className="text-center animate-fade-in py-8">
      <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 animate-float">
        <i className="fa-solid fa-check"></i>
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">
        Payment Successful!
      </h3>
      <p className="text-brand-muted mb-8">
        Your {selectedPack.coins} coins have been added to your wallet.
      </p>
      <button
        onClick={onClose}
        className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-xl transition-all"
      >
        Start Exploring
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className={`bg-brand-surface w-full ${
          step === "login" || step === "otp" ? "max-w-md" : "max-w-5xl"
        } max-h-[90vh] rounded-3xl border border-white/10 shadow-2xl overflow-hidden relative flex flex-col my-auto`}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white hover:text-red-400 transition-all z-10 shadow-lg border border-white/20"
          aria-label="Close"
        >
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>

        <div className="p-6 md:p-8 overflow-y-auto flex-1 pb-8">
          {step === "store" && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <div className="inline-block p-4 rounded-full bg-brand-gold/10 text-brand-gold text-3xl mb-4">
                  <i className="fa-solid fa-coins"></i>
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

          {step === "login" && <LoginStep />}
          {step === "otp" && <OtpStep />}
          {/* {step === "payment" && <PaymentStep />} */}
          {step === "success" && <SuccessStep />}
        </div>
      </div>
    </div>
  );
};

const CoinSection = ({
  setShowCoins,
  setShowLogin,
  coinPacks,
}: {
  setShowCoins: (v: boolean) => void;
  setShowLogin: (v: boolean) => void;
  coinPacks: any[];
}) => {
  const isLoggedIn = !!localStorage.getItem("zintle_jwt");

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
      await createOrderAndInitiatePayment(pkg.id);
    } catch (e) {
      console.error("Failed to create coin order from CoinSection", e);
    }
  };

  // Use the prop for packs
  const packages = coinPacks;
  return (
    <section className="py-20 bg-brand-bg/50 relative">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
          Popular Coin Packages
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {packages.map((pkg, i) => (
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
              <div className="flex justify-center mb-4 text-brand-gold text-2xl">
                <i className="fa-solid fa-coins"></i>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">
                {pkg.coins} Coins
              </h3>
              <p className="text-2xl font-bold text-white mb-6">₹{pkg.price}</p>
              <button
                onClick={() => handleRechargeClick(pkg)}
                className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-brand-primary/20"
              >
                {isLoggedIn ? "Recharge" : "Login"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-black py-16 border-t border-white/5 text-sm">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-1">
          <ZintleLogo h="h-8" />
          <p className="text-brand-muted mt-6 leading-relaxed">
            Bringing you closer to the stories that matter. Safe, inclusive, and
            powered by text-based imagination.
          </p>
          <div className="flex gap-4 mt-6">
            {["twitter", "instagram", "linkedin"].map((social) => (
              <a
                key={social}
                href="#"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-brand-primary transition-colors"
              >
                <i className={`fa-brands fa-${social}`}></i>
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-bold text-white mb-6 text-lg">Company</h4>
          <ul className="space-y-4 text-brand-muted">
            <li>
              <Link
                to="/about"
                className="hover:text-brand-primary transition-colors"
              >
                About Us
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="hover:text-brand-primary transition-colors"
              >
                Contact Support
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white mb-6 text-lg">Community</h4>
          <ul className="space-y-4 text-brand-muted">
            <li>
              <Link
                to="/safety"
                className="hover:text-brand-primary transition-colors"
              >
                Safety Center
              </Link>
            </li>
            <li>
              <Link
                to="/guidelines"
                className="hover:text-brand-primary transition-colors"
              >
                Guidelines
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-white mb-6 text-lg">Legal</h4>
          <ul className="space-y-4 text-brand-muted">
            <li>
              <Link
                to="/privacy"
                className="hover:text-brand-primary transition-colors"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                to="/terms"
                className="hover:text-brand-primary transition-colors"
              >
                Terms of Use
              </Link>
            </li>
            <li>
              <Link
                to="/refund"
                className="hover:text-brand-primary transition-colors"
              >
                Refund Policy
              </Link>
            </li>
            <li>
              <Link
                to="/child-safety-standards"
                className="hover:text-brand-primary transition-colors"
              >
                Child Safety Standards
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-brand-muted">
        <p>© 2025 Sofnics Tech Labs (P) Ltd. All Rights Reserved.</p>
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-lock"></i> SSL Encrypted
        </div>
      </div>
    </div>
  </footer>
);

const defaultCoinPackData = [
  {
    id: 17,
    name: "40 coins micro pack bundle",
    description: "",
    coin_value: 90.0,
    bonus_coins: 0.0,
    icon_url: null,
    is_active: true,
    amount: 29.0,
    product_id: "coin_29",
    isTrialPack: false,
    isBonusPack: false,
    isMicropack: true,
  },
  {
    id: 14,
    name: "90 coins micro pack bundle",
    description: "",
    coin_value: 160.0,
    bonus_coins: 0.0,
    icon_url: null,
    is_active: true,
    amount: 49.0,
    product_id: "coin_49",
    isTrialPack: false,
    isBonusPack: false,
    isMicropack: true,
  },
  {
    id: 15,
    name: "150 coins micro pack bundle",
    description: "",
    coin_value: 240.0,
    bonus_coins: 0.0,
    icon_url: null,
    is_active: true,
    amount: 79.0,
    product_id: "coin_79",
    isTrialPack: false,
    isBonusPack: false,
    isMicropack: true,
  },
  {
    id: 16,
    name: "300 coins micro pack bundle",
    description: "",
    coin_value: 400.0,
    bonus_coins: 0.0,
    icon_url: null,
    is_active: true,
    amount: 149.0,
    product_id: "coin_149",
    isTrialPack: false,
    isBonusPack: false,
    isMicropack: true,
  },
  {
    id: 18,
    name: "coin_5000",
    description: "",
    coin_value: 15000.0,
    bonus_coins: 0.0,
    icon_url: null,
    is_active: true,
    amount: 4999.0,
    product_id: "coin_4999",
    isTrialPack: false,
    isBonusPack: false,
    isMicropack: false,
  },
  {
    id: 19,
    name: "coin_10000",
    description: "",
    coin_value: 35000.0,
    bonus_coins: 0.0,
    icon_url: null,
    is_active: true,
    amount: 9999.0,
    product_id: "coin_9999",
    isTrialPack: false,
    isBonusPack: false,
    isMicropack: false,
  },
  {
    id: 20,
    name: "coin_20000",
    description: "",
    coin_value: 70000.0,
    bonus_coins: 0.0,
    icon_url: null,
    is_active: true,
    amount: 19999.0,
    product_id: "coin_19999",
    isTrialPack: false,
    isBonusPack: false,
    isMicropack: false,
  },
  {
    id: 21,
    name: "coin_50000",
    description: "",
    coin_value: 175000.0,
    bonus_coins: 0.0,
    icon_url: null,
    is_active: true,
    amount: 49999.0,
    product_id: "coin_49999",
    isTrialPack: false,
    isBonusPack: false,
    isMicropack: false,
  },
];

const mapCoinPack = (p: any) => ({
  id: p.id,
  coins: p.coin_value,
  price: p.amount,
  bonus: p.bonus_coins,
  product_id: p.product_id,
  name: p.name,
  color: "bg-brand-surface",
  tag: p.isBonusPack
    ? "Bonus Pack"
    : p.isTrialPack
    ? "Trial Pack"
    : p.isMicropack
    ? "Micropack"
    : undefined,
  highlight: p.isBonusPack || false,
});

const defaultCoinPacks = defaultCoinPackData
  .filter((p) => p.is_active)
  .map(mapCoinPack);

const Layout = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showCoins, setShowCoins] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("zintle_jwt")
  );
  const [coinPacks, setCoinPacks] = useState(defaultCoinPacks);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  // Fetch coin packs on mount/when logged in changes
  useEffect(() => {
    const fetchPacks = async () => {
      if (!localStorage.getItem("zintle_jwt")) return;
      try {
        const r = await fetch(
          `${HOST}/api/v1.2/creator_center/details/get-coin-pack-details/`,
          {
            // headers: { "X-Organisation-ID": "ZINTEL1234" },
          }
        );
        const data = await r.json();
        if (data.success && Array.isArray(data.data)) {
          setCoinPacks(
            data.data
              .filter((p: any) => p.is_active)
              .map((p: any) => mapCoinPack(p))
          );
        }
      } catch (e) {
        // fallback to defaultCoinPacks
      }
    };
    fetchPacks();
  }, [isLoggedIn]);

  // Check JWT changes after CoinStore closes
  useEffect(() => {
    const check = () => setIsLoggedIn(!!localStorage.getItem("zintle_jwt"));
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
    localStorage.removeItem("zintle_jwt");
    setIsLoggedIn(false);
    setShowLogin(false);
    setShowCoins(false);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans">
      <Header
        setShowLogin={setShowLogin}
        setShowCoins={setShowCoins}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <Hero setShowCoins={setShowCoins} />
              <Features />
              <CoinSection
                setShowCoins={setShowCoins}
                setShowLogin={setShowLogin}
                coinPacks={coinPacks}
              />
            </>
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
      </Routes>

      <Footer />

      {(showCoins || showLogin) && (
        <CoinStore
          onClose={() => {
            setShowCoins(false);
            setShowLogin(false);
          }}
          initialStep={showLogin ? "login" : "store"}
          coinPacks={coinPacks}
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
