import React from "react";
import { COIN_ICON_CLASS, ZintleCoinIcon } from "./ZintleCoinIcon";

export type QuickRechargePack = {
  id: number;
  coins: number;
  price: number;
};

function formatRupee(amount: number): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "₹0";
  return Number.isInteger(n) ? `₹${n}` : `₹${n.toFixed(2)}`;
}

function formatCoinAmount(coins: number): string {
  const n = Number(coins);
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? String(n) : String(Math.round(n));
}

type QuickRechargePopupProps = {
  packs: QuickRechargePack[];
  selectedPackageId: number | null;
  onPackSelect: (pkg: QuickRechargePack, index: number) => void;
  onPackPay: (pkg: QuickRechargePack, index: number) => void;
};

export const QuickRechargePopup = ({
  packs,
  selectedPackageId,
  onPackSelect,
  onPackPay,
}: QuickRechargePopupProps) => {
  return (
    <div
      className="w-full rounded-t-[28px] bg-[#0f172a] px-5 pb-8 pt-5 shadow-[0_-8px_40px_rgba(0,0,0,0.45)]"
      role="dialog"
      aria-label="Quick recharge"
    >
      <h2 className="mb-5 text-left text-base font-medium text-white">
          {packs.length > 0
            ? "Tap on the plan to recharge"
            : "No micro coin packs available"}
        </h2>

        {packs.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl bg-[#1e293b] px-6 py-10 text-center">
            <div className="mb-4 flex items-center justify-center text-3xl leading-none text-white/40">
              <ZintleCoinIcon className={COIN_ICON_CLASS} />
            </div>
            <p className="text-sm text-white/70">
              There are no micro coin packs available right now. Please try
              again later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {packs.map((pkg, index) => {
              const isSelected = selectedPackageId === pkg.id;

              return (
                <div
                  key={pkg.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onPackSelect(pkg, index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onPackSelect(pkg, index);
                    }
                  }}
                  className={`flex cursor-pointer flex-col items-center rounded-2xl bg-[#1e293b] px-3 py-4 text-center transition-all active:scale-[0.98] ${
                    isSelected
                      ? "border-2 border-white"
                      : "border-2 border-transparent"
                  }`}
                >
                  <p className="mb-3 flex items-center justify-center gap-2 text-lg font-semibold leading-none text-white">
                    <ZintleCoinIcon className={COIN_ICON_CLASS} />
                    <span>{formatCoinAmount(pkg.coins)}</span>
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPackPay(pkg, index);
                    }}
                    className="w-full rounded-full bg-[#ef4444] px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    {formatRupee(pkg.price)}
                  </button>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
};
