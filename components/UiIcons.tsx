import React from "react";

type IconProps = {
  className?: string;
};

export function StopwatchIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M9 1h6a1 1 0 1 1 0 2h-1.07A8.001 8.001 0 0 1 20 11h1a1 1 0 1 1 0 2h-1.07A8.001 8.001 0 0 1 13 20.93V22a1 1 0 1 1-2 0v-1.07A8.001 8.001 0 0 1 4.07 13H3a1 1 0 1 1 0-2h1.07A8.001 8.001 0 0 1 11 3.07V2a1 1 0 0 1 1-1zm3 4a6 6 0 1 0 0 12A6 6 0 0 0 12 5zm0 2a1 1 0 0 1 1 1v2.382l1.447.868a1 1 0 1 1-1.054 1.7l-1.92-1.152A1 1 0 0 1 11 11V8a1 1 0 0 1 1-1z" />
    </svg>
  );
}

export function HourglassIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M6 2h12a1 1 0 1 1 0 2h-1.1A7.002 7.002 0 0 1 13 8.83V11h2a1 1 0 1 1 0 2h-2v2.17A7.002 7.002 0 0 1 16.9 20H18a1 1 0 1 1 0 2H6a1 1 0 1 1 0-2h1.1A7.002 7.002 0 0 1 11 15.17V13H9a1 1 0 1 1 0-2h2V8.83A7.002 7.002 0 0 1 7.1 4H6a1 1 0 0 1 0-2zm2.3 2A5 5 0 0 0 12 7.76 5 5 0 0 0 15.7 4H8.3zM12 16.24A5 5 0 0 0 8.3 20h7.4A5 5 0 0 0 12 16.24z" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function SpinnerIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className ?? ""}`}
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2.5"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function PenIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12.5 6.5l5 5M4 20l4.2-.8L19 8.4a1.5 1.5 0 0 0 0-2.1L17.7 5a1.5 1.5 0 0 0-2.1 0L6.8 13.8 4 20z" />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2 4 5v7c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5l-8-3zm-1 13.7-3.2-3.2 1.4-1.4L11 12.9l4.8-4.8 1.4 1.4L11 15.7z" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm4.3 7.3-5.8 5.8-2.8-2.8 1.4-1.4 1.4 1.4 4.4-4.4 1.4 1.4z" />
    </svg>
  );
}

export function TimesCircleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path
        fillRule="evenodd"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.54 5.46a1 1 0 0 1 0 1.41L13.41 12l2.13 2.13a1 1 0 1 1-1.41 1.41L12 13.41l-2.13 2.13a1 1 0 0 1-1.41-1.41L10.59 12 8.46 9.87a1 1 0 0 1 1.41-1.41L12 10.59l2.13-2.13a1 1 0 0 1 1.41 0z"
      />
    </svg>
  );
}

export function BanIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm7 10a7 7 0 0 0-1.7-4.6L7.4 17.3A7 7 0 0 0 19 12zM5 12a7 7 0 0 0 1.7 4.6L16.6 6.7A7 7 0 0 0 5 12z" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm1 5h-2v6l5 3 .9-1.6-3.9-2.4V7z" />
    </svg>
  );
}

export function QuestionCircleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 14a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zm0-9c-1.9 0-3.2 1.2-3.2 3h2c0-.7.5-1.2 1.2-1.2s1.2.5 1.2 1.2c0 .6-.3.9-1.1 1.4-.9.6-1.5 1.3-1.5 2.4v.5h2v-.4c0-.5.2-.8 1.1-1.4 1.1-.7 1.9-1.6 1.9-2.9C15.6 8.1 14.1 7 12 7z" />
    </svg>
  );
}
