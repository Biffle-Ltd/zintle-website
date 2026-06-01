import React from "react";

const PAYMENT_LOGO_BASE = "/payment-logos";

type PaymentLogoSize = "default" | "lg";

/** Shared circle sizes — default 40×40 (payment list), lg 64×64 (waiting modal). */
const LOGO_CIRCLE_BY_SIZE: Record<PaymentLogoSize, string> = {
  default: "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white",
  lg: "flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white",
};
const QR_ICON_COLOR = "#1a1a1a";

function CircularPaymentLogo({
  src,
  alt,
  fill = "contain",
  size = "default",
}: {
  src: string;
  alt: string;
  /** `cover` for assets that are already circular; `contain` for wide wordmarks. */
  fill?: "cover" | "contain";
  size?: PaymentLogoSize;
}) {
  const imgClass =
    fill === "cover"
      ? "h-full w-full object-cover"
      : "h-[78%] w-[78%] object-contain";

  return (
    <span className={LOGO_CIRCLE_BY_SIZE[size]}>
      <img
        src={src}
        alt={alt}
        className={imgClass}
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}

/** Official PhonePe mark. */
export function PhonePeLogo({ size = "default" }: { size?: PaymentLogoSize }) {
  return (
    <CircularPaymentLogo
      src={`${PAYMENT_LOGO_BASE}/phonepe.png`}
      alt="PhonePe"
      fill="cover"
      size={size}
    />
  );
}

/** Official Paytm wordmark. */
export function PaytmLogo({ size = "default" }: { size?: PaymentLogoSize }) {
  return (
    <CircularPaymentLogo
      src={`${PAYMENT_LOGO_BASE}/paytm.png`}
      alt="Paytm"
      size={size}
    />
  );
}

/** Official Google Pay mark. */
export function GpayLogo({ size = "default" }: { size?: PaymentLogoSize }) {
  return (
    <CircularPaymentLogo
      src={`${PAYMENT_LOGO_BASE}/gpay.png`}
      alt="Google Pay"
      size={size}
    />
  );
}

/** Official UPI / NPCI mark. */
export function UpiLogo({ size = "default" }: { size?: PaymentLogoSize }) {
  return (
    <CircularPaymentLogo
      src={`${PAYMENT_LOGO_BASE}/upi.png`}
      alt="UPI"
      size={size}
    />
  );
}

/** QR code pay icon (no brand asset provided). */
export function QrPayLogo({ size = "default" }: { size?: PaymentLogoSize }) {
  const svgClass = size === "lg" ? "h-9 w-9" : "h-6 w-6";
  return (
    <span className={LOGO_CIRCLE_BY_SIZE[size]} aria-hidden>
      <svg viewBox="0 0 32 32" className={svgClass} role="img" aria-label="QR code">
        <rect
          x="3"
          y="3"
          width="11"
          height="11"
          rx="1.5"
          fill="none"
          stroke={QR_ICON_COLOR}
          strokeWidth="2"
        />
        <rect x="6" y="6" width="4" height="4" rx="0.5" fill={QR_ICON_COLOR} />
        <rect
          x="18"
          y="3"
          width="11"
          height="11"
          rx="1.5"
          fill="none"
          stroke={QR_ICON_COLOR}
          strokeWidth="2"
        />
        <rect x="21" y="6" width="4" height="4" rx="0.5" fill={QR_ICON_COLOR} />
        <rect
          x="3"
          y="18"
          width="11"
          height="11"
          rx="1.5"
          fill="none"
          stroke={QR_ICON_COLOR}
          strokeWidth="2"
        />
        <rect x="6" y="21" width="4" height="4" rx="0.5" fill={QR_ICON_COLOR} />
        <rect x="18" y="18" width="3" height="3" fill={QR_ICON_COLOR} />
        <rect x="23" y="18" width="3" height="3" fill={QR_ICON_COLOR} />
        <rect x="18" y="23" width="3" height="3" fill={QR_ICON_COLOR} />
        <rect x="26" y="23" width="3" height="8" fill={QR_ICON_COLOR} />
        <rect x="23" y="26" width="3" height="5" fill={QR_ICON_COLOR} />
      </svg>
    </span>
  );
}

export function CampaignPaymentMethodLogo({
  variant,
  size = "default",
}: {
  variant: "phonepe" | "paytm" | "gpay" | "upi" | "qr";
  size?: PaymentLogoSize;
}) {
  switch (variant) {
    case "phonepe":
      return <PhonePeLogo size={size} />;
    case "paytm":
      return <PaytmLogo size={size} />;
    case "gpay":
      return <GpayLogo size={size} />;
    case "upi":
      return <UpiLogo size={size} />;
    case "qr":
      return <QrPayLogo size={size} />;
  }
}
