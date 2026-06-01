import React from "react";

export function CampaignPaymentSuccessModal({
  message,
  onDone,
}: {
  message: string;
  onDone: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/85 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="campaign-payment-success-title"
    >
      <div
        className="w-full max-w-sm rounded-3xl px-6 py-8 text-center shadow-2xl"
        style={{ backgroundColor: "#1E1E21" }}
      >
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
          <span
            className="flex h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: "#34C759" }}
            aria-hidden
          >
            <svg
              className="h-10 w-10 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </span>
        </div>

        <h2
          id="campaign-payment-success-title"
          className="text-2xl font-bold"
          style={{ color: "#34C759" }}
        >
          Payment Successful
        </h2>
        <p className="mx-auto mt-4 max-w-[320px] text-sm leading-relaxed text-white/70">
          {message}
        </p>

        <button
          type="button"
          onClick={onDone}
          className="mt-8 w-full rounded-full py-4 text-base font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#34C759" }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
