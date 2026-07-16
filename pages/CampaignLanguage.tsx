import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CampaignPrimaryCta } from "../components/CampaignCta";
import { getJwtFromStorage } from "../utils/authStorage";
import { handleCampaignUnauthorized } from "../utils/campaignAuth";
import {
  clearCampaignLanguageCheckoutRedirect,
  getCampaignLanguageCheckoutRedirect,
  isBiffleCampaignLanguageFlow,
  markCampaignLanguageGatePassed,
} from "../utils/campaignLanguageGate";
import {
  enrichCampaignPixelContext,
  parseCampaignPixelContext,
  sendCampaignLanguageSaved,
} from "../utils/campaignPixelEvents";
import { headerSafeToken } from "../utils/headerSafeToken";
import { isBiffleOrganisationId } from "../utils/organisationIdFromUrl";
import { ZINTLE_POST_LOGIN_REDIRECT_KEY } from "../utils/postLoginRedirect";
import {
  fetchAvailableLanguages,
  fetchUserDetails,
  languageScriptGlyph,
  updateUserLanguages,
  userNeedsLanguageSelection,
  type LanguageOption,
} from "../utils/userProfileApi";

function CampaignLanguagePageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh max-h-dvh flex-col bg-white font-sans antialiased">
      {children}
    </div>
  );
}

function buildCampaignBackPath(search: string): string {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const preserved = new URLSearchParams();
  for (const key of ["organisation_id", "fbclid"] as const) {
    const value = params.get(key);
    if (value?.trim()) preserved.set(key, value.trim());
  }
  const query = preserved.toString();
  return query ? `/campaign?${query}` : "/campaign";
}

type PagePhase = "checking" | "ready" | "error";

export function CampaignLanguage({
  organisationId,
  setShowLogin,
}: {
  organisationId: string;
  setShowLogin: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isBiffle = isBiffleOrganisationId(organisationId);

  const token = useMemo(
    () => getJwtFromStorage(organisationId),
    [organisationId],
  );
  const authToken = headerSafeToken(token);

  const [phase, setPhase] = useState<PagePhase>("checking");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const campaignBackPath = useMemo(
    () => buildCampaignBackPath(location.search),
    [location.search],
  );

  const pixelContext = useMemo(() => {
    const base = parseCampaignPixelContext(location.search, location.pathname, {
      organisationId,
      token: authToken,
    });
    return enrichCampaignPixelContext(base, organisationId);
  }, [authToken, location.pathname, location.search, organisationId]);

  const forwardToCheckout = useCallback(() => {
    const pending = getCampaignLanguageCheckoutRedirect();
    clearCampaignLanguageCheckoutRedirect();
    if (pending?.startsWith("/")) {
      markCampaignLanguageGatePassed(organisationId);
      navigate(pending);
      return;
    }
    navigate(campaignBackPath);
  }, [campaignBackPath, navigate, organisationId]);

  const requireLogin = useCallback(() => {
    const checkout =
      getCampaignLanguageCheckoutRedirect() ??
      `${location.pathname}${location.search}`;
    sessionStorage.setItem(ZINTLE_POST_LOGIN_REDIRECT_KEY, checkout);
    navigate(campaignBackPath);
    setShowLogin(true);
  }, [campaignBackPath, location.pathname, location.search, navigate, setShowLogin]);

  const loadLanguages = useCallback(async () => {
    if (!isBiffleCampaignLanguageFlow(organisationId)) {
      const pending = getCampaignLanguageCheckoutRedirect();
      clearCampaignLanguageCheckoutRedirect();
      if (pending?.startsWith("/")) {
        navigate(pending, { replace: true });
      } else {
        navigate(campaignBackPath, { replace: true });
      }
      return;
    }

    if (!authToken) {
      requireLogin();
      return;
    }

    setPhase("checking");
    setLoadError(null);

    try {
      const details = await fetchUserDetails(authToken, organisationId);
      if (!userNeedsLanguageSelection(details)) {
        forwardToCheckout();
        return;
      }

      const options = await fetchAvailableLanguages(
        organisationId,
        authToken,
      );
      if (options.length === 0) {
        setLoadError("No languages available. Please try again.");
        setPhase("error");
        return;
      }

      setLanguages(options);
      setPhase("ready");
    } catch (err) {
      const status =
        err && typeof err === "object" && "status" in err
          ? Number((err as { status?: number }).status)
          : 0;
      if (
        handleCampaignUnauthorized(status, organisationId, requireLogin)
      ) {
        return;
      }
      setLoadError("Could not load languages. Please try again.");
      setPhase("error");
    }
  }, [
    authToken,
    campaignBackPath,
    forwardToCheckout,
    navigate,
    organisationId,
    requireLogin,
  ]);

  useEffect(() => {
    void loadLanguages();
  }, [loadLanguages]);

  const handleContinue = async () => {
    if (!selectedCode || !authToken || saving) return;

    setSaving(true);
    setSaveError(null);

    try {
      await updateUserLanguages(authToken, organisationId, selectedCode);
      sendCampaignLanguageSaved(pixelContext, { language_code: selectedCode });
      forwardToCheckout();
    } catch (err) {
      const status =
        err && typeof err === "object" && "status" in err
          ? Number((err as { status?: number }).status)
          : 0;
      if (
        handleCampaignUnauthorized(status, organisationId, requireLogin)
      ) {
        return;
      }
      setSaveError("Could not save your language. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (phase === "checking") {
    return (
      <CampaignLanguagePageShell>
        <div className="flex flex-1 items-center justify-center">
          <div
            className={`h-8 w-8 animate-spin rounded-full border-2 ${
              isBiffle
                ? "border-gray-300 border-t-violet-600"
                : "border-gray-200 border-t-[#162a44]"
            }`}
          />
        </div>
      </CampaignLanguagePageShell>
    );
  }

  if (phase === "error") {
    return (
      <CampaignLanguagePageShell>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-sm text-gray-600">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadLanguages()}
            className="mt-4 rounded-full bg-[#162a44] px-6 py-2.5 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>
      </CampaignLanguagePageShell>
    );
  }

  return (
    <CampaignLanguagePageShell>
      <div className="flex min-h-0 flex-1 flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => navigate(campaignBackPath)}
          className="mb-6 flex h-10 w-10 items-center justify-center rounded-full text-[#162a44] transition-opacity active:opacity-70"
          aria-label="Back to campaign"
        >
          <i className="fa-solid fa-arrow-left text-lg" aria-hidden />
        </button>

        <h1 className="mb-6 text-[28px] font-bold leading-tight text-[#162a44]">
          Languages You Speak
        </h1>

        <div
          className="min-h-0 flex-1 space-y-3 overflow-y-auto"
          role="radiogroup"
          aria-label="Languages You Speak"
        >
          {languages.map((language) => {
            const selected = selectedCode === language.code;
            return (
              <label
                key={language.id}
                className={`flex w-full cursor-pointer items-center gap-4 rounded-xl border px-4 py-4 text-left transition-colors ${
                  selected
                    ? "border-[#162a44]/30 bg-[#f8fafc]"
                    : "border-gray-200 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="campaign-language"
                  value={language.code}
                  checked={selected}
                  onChange={() => setSelectedCode(language.code)}
                  className="sr-only"
                />
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e8f5e9] text-sm font-semibold text-[#2e7d32]">
                  {languageScriptGlyph(language.code)}
                </span>
                <span className="flex-1 text-base font-medium text-[#162a44]">
                  {language.name}
                </span>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    selected
                      ? "border-[#162a44] bg-[#162a44]"
                      : "border-gray-300 bg-white"
                  }`}
                  aria-hidden
                >
                  {selected ? (
                    <span className="h-2 w-2 rounded-full bg-white" />
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>

        {saveError ? (
          <p className="mt-3 text-center text-sm text-red-600">{saveError}</p>
        ) : null}

        <div className="mt-4 shrink-0">
          <CampaignPrimaryCta
            isBiffle={isBiffle}
            disabled={!selectedCode || saving}
            showChevron={false}
            onClick={() => void handleContinue()}
          >
            {saving ? "Saving…" : "Continue"}
          </CampaignPrimaryCta>
        </div>
      </div>
    </CampaignLanguagePageShell>
  );
}
