import React from "react";
import { WEB_CALL_OFFER_FALLBACK_RUPEES } from "../utils/webCall";

const CTA_GRADIENT = "linear-gradient(90deg, #ED67FF 2.08%, #821DFC 100%)";
const SCREEN_GRADIENT =
  "linear-gradient(180deg, #A142FA 0%, #C45FF8 46%, #F0ABFC 72%, #FDF2F8 100%)";
const COMPARE_AMOUNT = 49;
const OFFER_PURPLE = "#C026D3";

function formatOfferDigits(amount: number): string {
  const rounded = Math.max(0, Math.round(amount));
  return rounded < 100 ? String(rounded).padStart(2, "0") : String(rounded);
}

function OfferHero() {
  return (
    <img
      src="/web-call/welcome-offer-hero.png"
      alt="Welcome offer pack"
      width={456}
      height={456}
      className="block h-auto w-full"
    />
  );
}

export function WebCallOfferScreen({
  amount,
  loading = false,
  paying = false,
  alreadyClaimed = false,
  packMissing = false,
  onPay,
  onStartCall,
}: {
  amount: number | null;
  loading?: boolean;
  paying?: boolean;
  alreadyClaimed?: boolean;
  packMissing?: boolean;
  onPay: () => void;
  onStartCall: () => void;
}) {
  const rupees =
    amount != null ? Math.round(amount) : WEB_CALL_OFFER_FALLBACK_RUPEES;
  const canPay = !loading && !packMissing && !paying;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden font-figtree text-white">
      <div
        className="absolute inset-0"
        style={{ background: SCREEN_GRADIENT }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.7) 0.8px, transparent 1.2px)",
          backgroundSize: "6px 6px",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, transparent 6%, #000 24%, #000 46%, transparent 64%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, transparent 6%, #000 24%, #000 46%, transparent 64%, transparent 100%)",
        }}
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center pt-[max(0.25rem,env(safe-area-inset-top))]">
        <div className="flex w-full max-w-md flex-1 flex-col items-center justify-center text-center">
          <OfferHero />
          <div className="px-6">

          <p className="mt-2 text-[24px] font-medium leading-snug text-white">
            Enjoy more time for less
          </p>
          <p className="mt-0.5 text-[20px] font-bold leading-snug text-white">
            Continue for only ₹{rupees}
          </p>

          <div className="mt-5 inline-flex items-center gap-2.5 rounded-full bg-white px-4 py-2 text-[#111827] shadow-[0_10px_24px_rgba(126,34,206,0.16)]">
            <span className="text-[28px] font-extrabold leading-none tracking-tight">
              <span className="mr-0.5 align-[2px] text-[15px] font-bold">₹</span>
              {formatOfferDigits(rupees)}
            </span>
            <span className="text-[16px] font-medium text-[#B0B0B8] line-through">
              ₹{COMPARE_AMOUNT}
            </span>
            <span
              className="rounded-full px-2.5 py-1 text-[12px] font-semibold leading-none text-white"
              style={{ backgroundColor: OFFER_PURPLE }}
            >
              One time
            </span>
          </div>

          </div>
          <p className="mt-4 w-full whitespace-nowrap px-3 text-center text-[12px] font-medium tracking-[-0.02em] text-white/90">
            One-time payment{" "}
            <span style={{ color: OFFER_PURPLE }}>•</span> No subscription or auto-debit
          </p>
        </div>

        <div className="w-full max-w-sm shrink-0 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {alreadyClaimed ? (
            <button
              type="button"
              onClick={onStartCall}
              className="flex h-12 w-full items-center justify-center rounded-full text-[16px] font-semibold text-white"
              style={{ background: CTA_GRADIENT }}
            >
              Install the app
            </button>
          ) : (
            <button
              type="button"
              onClick={onPay}
              disabled={!canPay}
              className="flex h-12 w-full items-center justify-center rounded-full text-[16px] font-semibold text-white disabled:opacity-80"
              style={{ background: CTA_GRADIENT }}
            >
              {loading ? "Loading…" : "Recharge Now"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
