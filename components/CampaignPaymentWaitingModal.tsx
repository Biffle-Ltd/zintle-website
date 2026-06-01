import React, { useEffect, useState } from "react";
import { CampaignPaymentMethodLogo } from "./PaymentMethodLogos";

const WAIT_SECONDS = 5 * 60;

export type CampaignPaymentWaitingMethod =
  | "phonepe"
  | "paytm"
  | "gpay"
  | "other_upi";

const METHOD_COPY: Record<
  CampaignPaymentWaitingMethod,
  { logo: "phonepe" | "paytm" | "gpay" | "upi"; appLabel: string; steps: string[] }
> = {
  phonepe: {
    logo: "phonepe",
    appLabel: "PhonePe",
    steps: [
      "Open PhonePe app on your phone",
      "Check for payment notification",
      "Enter UPI PIN to complete payment",
    ],
  },
  paytm: {
    logo: "paytm",
    appLabel: "Paytm",
    steps: [
      "Open Paytm app on your phone",
      "Check for payment notification",
      "Enter UPI PIN to complete payment",
    ],
  },
  gpay: {
    logo: "gpay",
    appLabel: "Google Pay",
    steps: [
      "Open Google Pay app on your phone",
      "Check for payment notification",
      "Enter UPI PIN to complete payment",
    ],
  },
  other_upi: {
    logo: "upi",
    appLabel: "your UPI app",
    steps: [
      "Open your UPI app on your phone",
      "Check for payment notification",
      "Enter UPI PIN to complete payment",
    ],
  },
};

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function CampaignPaymentWaitingModal({
  method,
  amountLabel,
  onCancel,
}: {
  method: CampaignPaymentWaitingMethod;
  amountLabel: string;
  onCancel: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(WAIT_SECONDS);
  const copy = METHOD_COPY[method];

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [secondsLeft]);

  return (
    <>
      <style>{`
        @keyframes payment-wait-ripple {
          0% {
            transform: scale(0.92);
            opacity: 0.45;
          }
          100% {
            transform: scale(1.45);
            opacity: 0;
          }
        }
        @keyframes payment-wait-dot {
          0%,
          70%,
          100% {
            opacity: 0.25;
            transform: translateY(0) scale(0.85);
          }
          35% {
            opacity: 1;
            transform: translateY(-6px) scale(1);
          }
        }
        .payment-wait-ripple {
          animation: payment-wait-ripple 2.2s ease-out infinite;
        }
        .payment-wait-ripple--delay {
          animation-delay: 1.1s;
        }
        .payment-wait-dot {
          animation: payment-wait-dot 1s ease-in-out infinite;
        }
      `}</style>
      <div
        className="fixed inset-0 z-[110] flex items-end justify-center bg-black/85 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="campaign-payment-wait-title"
      >
        <div
          className="w-full max-w-sm rounded-3xl px-5 py-6 text-center shadow-2xl"
          style={{ backgroundColor: "#1E1E21" }}
        >
          <div className="relative mx-auto mb-3 flex h-28 w-28 items-center justify-center">
            <span
              className="payment-wait-ripple payment-wait-ripple--delay pointer-events-none absolute inset-0 rounded-full border-2"
              style={{ borderColor: "rgba(232, 93, 76, 0.35)" }}
              aria-hidden
            />
            <span
              className="payment-wait-ripple pointer-events-none absolute inset-0 rounded-full border-2"
              style={{ borderColor: "rgba(232, 93, 76, 0.5)" }}
              aria-hidden
            />
            <span
              className="absolute inset-0 rounded-full border border-white/10"
              aria-hidden
            />
            <span
              className="absolute inset-3 rounded-full border border-white/5"
              aria-hidden
            />
            <div className="relative z-10">
              <CampaignPaymentMethodLogo variant={copy.logo} size="lg" />
            </div>
          </div>

          <p className="text-2xl font-bold tabular-nums text-white">
            {amountLabel}
          </p>
          <p className="mt-0.5 text-sm text-white/50">Payment Amount</p>

          <p className="mt-4 text-sm text-white/55">Complete payment within</p>
          <p
            className="mt-0.5 text-3xl font-bold tabular-nums tracking-tight"
            style={{ color: "#E85D4C" }}
          >
            {formatTimer(secondsLeft)}
          </p>

          <h2
            id="campaign-payment-wait-title"
            className="mt-4 text-lg font-bold"
            style={{ color: "#E85D4C" }}
          >
            Waiting for Payment...{" "}
          </h2>

          <p className="mt-2 text-sm text-white/55">
            Open {copy.appLabel} and approve the payment request
          </p>
          <div
            className="mt-2.5 flex h-4 items-end justify-center gap-2"
            aria-hidden
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="payment-wait-dot h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: "#E85D4C",
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>

          <ol className="mt-5 space-y-3.5 text-left">
            {copy.steps.map((step, i) => (
              <li key={step} className="flex gap-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: "#E85D4C" }}
                >
                  {i + 1}
                </span>
                <span className="pt-1 text-sm font-medium leading-snug text-white">
                  {step}
                </span>
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={onCancel}
            className="mt-5 w-full rounded-full border border-white/25 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5"
          >
            Cancel Payment
          </button>
        </div>
      </div>
    </>
  );
}
