import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { campaignCtaGradientStyle } from "./CampaignCta";
import { HOST } from "../utils/host";
import { setJwtForOrganisation } from "../utils/authStorage";
import { setLoginPhoneForOrganisation } from "../utils/loginContactStorage";

const OTP_LENGTH = 6;
const PHONE_LENGTH = 10;
const COUNTRY_CODE = "91";

const BIFFLE_GRADIENT_H = "linear-gradient(90deg, #7c3aed, #ec4899)";

function AuthRoundButton({
  isBiffle,
  onClick,
  disabled,
  ariaLabel,
  children,
}: {
  isBiffle: boolean;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${AUTH_ACTION_BTN_CLASS} rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-opacity active:opacity-90`}
      style={campaignCtaGradientStyle(isBiffle)}
    >
      {children}
    </button>
  );
}

/** Fixed width for edit / verify buttons so both rows align on the right. */
const AUTH_ACTION_BTN_CLASS = "shrink-0 w-12 h-12";

function OtpDigitBoxes({
  value,
  onChange,
  disabled,
  isBiffle,
  onComplete,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  isBiffle: boolean;
  onComplete?: (code: string) => void;
  autoFocus?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const digits = value.split("");

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const activeIndex = focused
    ? Math.min(digits.length, OTP_LENGTH - 1)
    : -1;

  const boxBase = isBiffle
    ? "border-gray-200 bg-gray-50 text-gray-900"
    : "border-white/20 bg-white/5 text-white";
  const boxActive = isBiffle
    ? "border-violet-400 ring-2 ring-violet-400/30"
    : "border-brand-primary ring-2 ring-brand-primary/30";
  const caretClass = isBiffle ? "bg-gray-900" : "bg-white";

  return (
    <div
      className="relative flex flex-1 min-w-0 items-center gap-1.5 sm:gap-2"
      onClick={() => !disabled && inputRef.current?.focus()}
      role="group"
      aria-label="One-time password"
    >
      {Array.from({ length: OTP_LENGTH }, (_, i) => {
        const isActive = i === activeIndex;
        const filled = Boolean(digits[i]);
        return (
          <div
            key={i}
            className={`flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full border text-base sm:text-lg font-semibold tabular-nums transition-shadow ${boxBase} ${
              isActive ? boxActive : ""
            }`}
          >
            {filled ? (
              digits[i]
            ) : isActive ? (
              <span
                className={`inline-block w-0.5 h-5 sm:h-6 animate-pulse ${caretClass}`}
                aria-hidden
              />
            ) : null}
          </div>
        );
      })}
      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={OTP_LENGTH}
        disabled={disabled}
        value={value}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH);
          onChange(next);
          if (next.length === OTP_LENGTH) onComplete?.(next);
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-text"
        aria-label="Enter 6-digit OTP"
      />
    </div>
  );
}

export function PhoneOtpLoginScreen({
  isBiffle,
  organisationId,
  onClose,
  onSuccess,
}: {
  isBiffle: boolean;
  organisationId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shellClass = isBiffle
    ? "bg-white text-gray-900"
    : "bg-brand-bg text-white";

  const pillClass = isBiffle
    ? "bg-gray-50 border border-gray-200"
    : "bg-white/5 border border-white/10";

  const mutedClass = isBiffle ? "text-gray-500" : "text-brand-muted";
  const inputClass = isBiffle
    ? "bg-transparent flex-1 min-w-0 text-gray-900 outline-none placeholder-gray-400 font-medium text-base"
    : "bg-transparent flex-1 min-w-0 text-white outline-none placeholder-gray-600 font-medium text-base";

  const handleSendOtp = useCallback(async () => {
    if (!phone.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${HOST}/api/v1.2/auth/login/otp/request/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Organisation-ID": organisationId,
        },
        body: JSON.stringify({
          country_code: COUNTRY_CODE,
          phone_number: phone,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || "Failed to send OTP");
      setOtpSent(true);
      setOtp("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to send OTP";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [phone, organisationId]);

  const handleVerifyOtp = useCallback(
    async (code?: string) => {
      const otpValue = (code ?? otp).trim();
      if (otpValue.length !== OTP_LENGTH) return;
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`${HOST}/api/v1/auth/login/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Organisation-ID": organisationId,
          },
          body: JSON.stringify({
            provider: "phone",
            country_code: COUNTRY_CODE,
            phone_number: phone,
            otp: otpValue,
          }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.detail || "Failed to verify OTP");
        const jwt = data.token as string | undefined;
        if (jwt) setJwtForOrganisation(organisationId, jwt);
        setLoginPhoneForOrganisation(organisationId, COUNTRY_CODE, phone);
        onSuccess();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to verify OTP";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [otp, phone, organisationId, onSuccess],
  );

  const handleEditPhone = () => {
    setOtpSent(false);
    setOtp("");
    setError(null);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col h-dvh max-h-dvh overflow-hidden touch-manipulation ${shellClass}`}
    >
      <button
        type="button"
        onClick={onClose}
        className={`absolute top-[max(0.75rem,env(safe-area-inset-top))] right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          isBiffle
            ? "text-gray-600 hover:bg-gray-100"
            : "text-white/80 hover:bg-white/10"
        }`}
        aria-label="Close"
      >
        <i className="fa-solid fa-xmark text-xl" aria-hidden />
      </button>

      <div className="flex-1 min-h-0 flex flex-col w-full max-w-lg mx-auto px-6 pt-[max(3.5rem,calc(env(safe-area-inset-top)+2.5rem))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-col items-center text-center shrink-0 mb-10">
          <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
            {isBiffle ? (
              <>
                <span className="text-2xl font-extrabold tracking-tight text-gray-900">
                  Biffle
                </span>
                <span
                  className="text-xs font-bold uppercase tracking-wide text-white px-2.5 py-1 rounded-md"
                  style={{ background: BIFFLE_GRADIENT_H }}
                >
                  PRO
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl font-extrabold tracking-tight text-white italic">
                  ZINTLE
                </span>
                <span
                  className="text-xs font-bold uppercase tracking-wide text-white px-2.5 py-1 rounded-md bg-brand-primary"
                >
                  PRO
                </span>
              </>
            )}
          </div>
          <h1
            className={`text-xl font-bold ${
              isBiffle ? "text-gray-900" : "text-white"
            }`}
          >
            {isBiffle ? "Log in to Biffle" : "Log in to Zintle"}
          </h1>
          <p className={`mt-2 text-sm ${mutedClass}`}>
            {otpSent
              ? "Enter the code we sent to your number"
              : "Enter your mobile number to continue"}
          </p>
        </div>

        <div className="w-full space-y-4 shrink-0">
          <div className="flex items-center gap-2">
            <div
              className={`flex flex-1 min-w-0 items-center gap-2 rounded-full px-4 py-2 ${pillClass}`}
            >
              <span
                className={`shrink-0 text-sm font-medium tabular-nums ${mutedClass}`}
              >
                🇮🇳 +{COUNTRY_CODE}
              </span>
              <input
                type="tel"
                placeholder="Enter phone number"
                inputMode="numeric"
                maxLength={PHONE_LENGTH}
                enterKeyHint={otpSent ? "done" : "go"}
                autoComplete="tel-national"
                autoFocus={!otpSent}
                disabled={loading || otpSent}
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, PHONE_LENGTH))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !otpSent && phone.trim()) {
                    void handleSendOtp();
                  }
                }}
                className={`${inputClass} ${otpSent ? "opacity-70" : ""}`}
              />
            </div>
            {otpSent ? (
              <AuthRoundButton
                isBiffle={isBiffle}
                onClick={handleEditPhone}
                disabled={loading}
                ariaLabel="Edit mobile number"
              >
                <i className="fa-solid fa-pen text-sm" aria-hidden />
              </AuthRoundButton>
            ) : (
              <AuthRoundButton
                isBiffle={isBiffle}
                onClick={() => void handleSendOtp()}
                disabled={loading || !phone.trim()}
                ariaLabel="Send OTP"
              >
                {loading ? (
                  <i
                    className="fa-solid fa-spinner fa-spin text-sm"
                    aria-hidden
                  />
                ) : (
                  <i className="fa-solid fa-chevron-right text-sm" aria-hidden />
                )}
              </AuthRoundButton>
            )}
          </div>

          {otpSent && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <OtpDigitBoxes
                  value={otp}
                  onChange={setOtp}
                  disabled={loading}
                  isBiffle={isBiffle}
                  autoFocus
                  onComplete={(code) => void handleVerifyOtp(code)}
                />
                <AuthRoundButton
                  isBiffle={isBiffle}
                  onClick={() => void handleVerifyOtp()}
                  disabled={loading || otp.length !== OTP_LENGTH}
                  ariaLabel="Verify OTP"
                >
                  {loading ? (
                    <i
                      className="fa-solid fa-spinner fa-spin text-sm"
                      aria-hidden
                    />
                  ) : (
                    <i
                      className="fa-solid fa-chevron-right text-sm"
                      aria-hidden
                    />
                  )}
                </AuthRoundButton>
              </div>

              <div className="flex items-center justify-between gap-3 text-xs">
                <p className={mutedClass}>
                  OTP sent to +{COUNTRY_CODE} {phone}
                </p>
                <button
                  type="button"
                  onClick={() => void handleSendOtp()}
                  disabled={loading}
                  className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                  style={campaignCtaGradientStyle(isBiffle)}
                >
                  Resend
                </button>
              </div>
            </div>
          )}

          {error && (
            <p
              className={`text-center text-xs ${
                isBiffle ? "text-red-600" : "text-red-400"
              }`}
              role="alert"
            >
              {error}
            </p>
          )}
        </div>

        <div className="flex-1 min-h-4" />

        <p
          className={`shrink-0 text-center text-xs leading-relaxed px-2 ${mutedClass}`}
        >
          By continuing, you accept our{" "}
          <Link
            to="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className={`underline ${isBiffle ? "text-gray-700" : "text-white/80"}`}
          >
            Privacy Policy
          </Link>{" "}
          &{" "}
          <Link
            to="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className={`underline ${isBiffle ? "text-gray-700" : "text-white/80"}`}
          >
            Terms & Conditions
          </Link>
        </p>
      </div>
    </div>
  );
}
