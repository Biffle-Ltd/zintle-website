import React from "react";
import { CampaignPrimaryCta } from "./CampaignCta";
import {
  languageScriptGlyph,
  type LanguageOption,
} from "../utils/userProfileApi";

export function CampaignOnboardingShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden overscroll-none bg-white font-sans antialiased">
      {children}
    </div>
  );
}

export function CampaignOnboardingSpinner({ isBiffle }: { isBiffle: boolean }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div
        className={`h-8 w-8 animate-spin rounded-full border-2 ${
          isBiffle
            ? "border-gray-300 border-t-violet-600"
            : "border-gray-200 border-t-[#162a44]"
        }`}
      />
    </div>
  );
}

export function CampaignOnboardingBackButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-6 flex h-10 w-10 items-center justify-center rounded-full text-[#162a44] transition-opacity active:opacity-70"
      aria-label={label}
    >
      <i className="fa-solid fa-arrow-left text-lg" aria-hidden />
    </button>
  );
}

export function CampaignOnboardingTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h1 className="mb-6 text-[28px] font-bold leading-tight text-[#162a44]">
      {children}
    </h1>
  );
}

export function CampaignSelectRow({
  name,
  value,
  selected,
  label,
  leading,
  onSelect,
}: {
  name: string;
  value: string;
  selected: boolean;
  label: string;
  leading: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <label
      className={`flex w-full cursor-pointer items-center gap-4 rounded-xl border px-4 py-4 text-left transition-colors ${
        selected
          ? "border-[#162a44]/30 bg-[#f8fafc]"
          : "border-gray-200 bg-white"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      {leading}
      <span className="flex-1 text-base font-medium text-[#162a44]">
        {label}
      </span>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          selected
            ? "border-[#162a44] bg-[#162a44]"
            : "border-gray-300 bg-white"
        }`}
        aria-hidden
      >
        {selected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
      </span>
    </label>
  );
}

export function CampaignLanguageGlyph({ code }: { code: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e8f5e9] text-sm font-semibold text-[#2e7d32]">
      {languageScriptGlyph(code)}
    </span>
  );
}

export function CampaignLanguageList({
  languages,
  selectedCode,
  name,
  onChange,
}: {
  languages: LanguageOption[];
  selectedCode: string | null;
  name: string;
  onChange: (code: string) => void;
}) {
  return (
    <div
      className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain"
      role="radiogroup"
      aria-label="Languages You Speak"
    >
      {languages.map((language) => (
        <CampaignSelectRow
          key={language.id}
          name={name}
          value={language.code}
          selected={selectedCode === language.code}
          label={language.name}
          leading={<CampaignLanguageGlyph code={language.code} />}
          onSelect={() => onChange(language.code)}
        />
      ))}
    </div>
  );
}

export function CampaignOnboardingContinue({
  isBiffle,
  disabled,
  saving,
  error,
  onContinue,
}: {
  isBiffle: boolean;
  disabled?: boolean;
  saving?: boolean;
  error?: string | null;
  onContinue: () => void;
}) {
  return (
    <div className="mt-4 shrink-0">
      {error ? (
        <p className="mb-3 text-center text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <CampaignPrimaryCta
        isBiffle={isBiffle}
        disabled={disabled}
        showChevron={false}
        onClick={onContinue}
      >
        {saving ? "Continuing…" : "Continue"}
      </CampaignPrimaryCta>
    </div>
  );
}

export function CampaignOnboardingError({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <p className="text-sm text-gray-600">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-full bg-[#162a44] px-6 py-2.5 text-sm font-semibold text-white"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
