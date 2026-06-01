import React from "react";

export function CampaignPaymentFailedModal({
  message = "Please try again or try changing the payment method. Any money deducted will be refunded in 5-7 days.",
  onTryAgain,
}: {
  message?: string;
  onTryAgain: () => void;
}) {
  return (
    <>
      <style>{`
        @keyframes payment-failed-icon-pop {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          55% {
            transform: scale(1.06);
            opacity: 1;
          }
          100% {
            transform: scale(1);
          }
        }
        @keyframes payment-failed-icon-pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(232, 93, 76, 0.45);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(232, 93, 76, 0);
          }
        }
        @keyframes payment-failed-spark {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(0.85);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.15);
          }
        }
        .payment-failed-icon {
          animation:
            payment-failed-icon-pop 0.45s ease-out forwards,
            payment-failed-icon-pulse 2s ease-out 0.45s infinite;
        }
        .payment-failed-spark {
          animation: payment-failed-spark 2.2s ease-in-out infinite;
        }
        .payment-failed-spark--delay {
          animation-delay: 0.6s;
        }
      `}</style>
      <div
        className="fixed inset-0 z-[110] flex items-end justify-center bg-black/85 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="campaign-payment-failed-title"
      >
        <div
          className="w-full max-w-sm rounded-3xl px-6 py-8 text-center shadow-2xl"
          style={{ backgroundColor: "#1E1E21" }}
        >
          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
            <span
              className="payment-failed-spark payment-failed-spark--delay absolute -left-1 top-1.5 h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "#E85D4C" }}
              aria-hidden
            />
            <span
              className="payment-failed-spark absolute -right-0.5 top-5 h-1 w-1 rounded-full"
              style={{ backgroundColor: "#E85D4C" }}
              aria-hidden
            />
            <span
              className="payment-failed-icon flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: "#E85D4C" }}
              aria-hidden
            >
              <svg
                className="h-7 w-7 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </span>
          </div>

          <h2
            id="campaign-payment-failed-title"
            className="text-2xl font-bold"
            style={{ color: "#E85D4C" }}
          >
            Payment Failed
          </h2>
          <p className="mx-auto mt-4 max-w-[320px] text-sm leading-relaxed text-white/70">
            {message}
          </p>

          <button
            type="button"
            onClick={onTryAgain}
            className="mt-8 w-full rounded-full py-4 text-base font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#E85D4C" }}
          >
            Try Again
          </button>

          <p className="mt-6 text-xs leading-relaxed text-white/40">
            If the problem persists, please contact our support team
          </p>
        </div>
      </div>
    </>
  );
}
