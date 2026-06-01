import React from "react";

/** Shown under primary subscription / auth actions (campaign + login). */
export const SUBSCRIPTION_CTA_DISCLAIMER =
  "Renews automatically • Cancel anytime";

export function campaignCtaGradientStyle(
  isBiffle: boolean,
): React.CSSProperties {
  return {
    background: isBiffle
      ? "linear-gradient(90deg, #7c3aed, #ec4899)"
      : "linear-gradient(90deg, #f58220, #e94e65)",
  };
}

export const campaignPrimaryCtaClassName =
  "w-full flex items-center justify-center gap-2 rounded-full py-4 text-lg font-bold text-white shadow-lg shadow-black/20 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity active:opacity-90";

type CampaignPrimaryCtaProps = {
  isBiffle: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  showChevron?: boolean;
};

export function CampaignPrimaryCta({
  isBiffle,
  children,
  disabled,
  onClick,
  type = "button",
  showChevron = true,
}: CampaignPrimaryCtaProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={campaignPrimaryCtaClassName}
      style={campaignCtaGradientStyle(isBiffle)}
    >
      <span>{children}</span>
      {showChevron && (
        <i
          className="fa-solid fa-chevron-right text-sm opacity-90"
          aria-hidden
        />
      )}
    </button>
  );
}

export function CampaignCtaDisclaimer({ isBiffle }: { isBiffle: boolean }) {
  return (
    <p
      className={`text-center text-xs leading-snug px-2 ${
        isBiffle ? "text-gray-500" : "text-white/55"
      }`}
    >
      {SUBSCRIPTION_CTA_DISCLAIMER}
    </p>
  );
}
