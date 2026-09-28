import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CampaignLanguageList,
  CampaignOnboardingBackButton,
  CampaignOnboardingContinue,
  CampaignOnboardingError,
  CampaignOnboardingShell,
  CampaignOnboardingSpinner,
  CampaignOnboardingTitle,
} from "../components/CampaignOnboardingUi";
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
  campaignFreePlanErrorStatus,
  refreshCampaignCheckoutPlanPath,
} from "../utils/campaignFreePlan";
import {
  fetchAvailableLanguages,
  fetchUserDetails,
  updateUserLanguages,
  userNeedsLanguageSelection,
  type LanguageOption,
} from "../utils/userProfileApi";

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
  const aliveRef = useRef(true);

  const campaignBackPath = useMemo(
    () => buildCampaignBackPath(location.search),
    [location.search],
  );

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const pixelContext = useMemo(() => {
    const base = parseCampaignPixelContext(location.search, location.pathname, {
      organisationId,
      token: authToken,
    });
    return enrichCampaignPixelContext(base, organisationId);
  }, [authToken, location.pathname, location.search, organisationId]);

  const requireLogin = useCallback(() => {
    const checkout =
      getCampaignLanguageCheckoutRedirect() ??
      `${location.pathname}${location.search}`;
    sessionStorage.setItem(ZINTLE_POST_LOGIN_REDIRECT_KEY, checkout);
    navigate(campaignBackPath);
    setShowLogin(true);
  }, [campaignBackPath, location.pathname, location.search, navigate, setShowLogin]);

  const forwardToCheckout = useCallback(async () => {
    const pending = getCampaignLanguageCheckoutRedirect();
    if (!pending?.startsWith("/")) {
      if (aliveRef.current) navigate(campaignBackPath);
      return;
    }

    if (!authToken) {
      requireLogin();
      return;
    }

    const dest = await refreshCampaignCheckoutPlanPath({
      checkoutPath: pending,
      organisationId,
      token: authToken,
    });

    if (!aliveRef.current) return;

    clearCampaignLanguageCheckoutRedirect();
    markCampaignLanguageGatePassed(organisationId);
    navigate(dest);
  }, [authToken, campaignBackPath, navigate, organisationId, requireLogin]);

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
        try {
          await forwardToCheckout();
        } catch (err) {
          if (
            handleCampaignUnauthorized(
              campaignFreePlanErrorStatus(err),
              organisationId,
              requireLogin,
            )
          ) {
            return;
          }
          setLoadError("Could not load plan details. Please try again.");
          setPhase("error");
        }
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
      if (
        handleCampaignUnauthorized(
          campaignFreePlanErrorStatus(err),
          organisationId,
          requireLogin,
        )
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

    let languageSaved = false;
    try {
      await updateUserLanguages(authToken, organisationId, selectedCode);
      sendCampaignLanguageSaved(pixelContext, { language_code: selectedCode });
      languageSaved = true;
      await forwardToCheckout();
    } catch (err) {
      if (!aliveRef.current) return;
      if (
        handleCampaignUnauthorized(
          campaignFreePlanErrorStatus(err),
          organisationId,
          requireLogin,
        )
      ) {
        return;
      }
      setSaveError(
        languageSaved
          ? "Could not load plan details. Please try again."
          : "Could not save your language. Please try again.",
      );
    } finally {
      if (aliveRef.current) setSaving(false);
    }
  };

  if (phase === "checking") {
    return (
      <CampaignOnboardingShell>
        <CampaignOnboardingSpinner isBiffle={isBiffle} />
      </CampaignOnboardingShell>
    );
  }

  if (phase === "error") {
    return (
      <CampaignOnboardingShell>
        <CampaignOnboardingError
          message={loadError}
          onRetry={() => void loadLanguages()}
        />
      </CampaignOnboardingShell>
    );
  }

  return (
    <CampaignOnboardingShell>
      <div className="flex min-h-0 flex-1 flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        <CampaignOnboardingBackButton
          onClick={() => navigate(campaignBackPath)}
          label="Back to campaign"
        />
        <CampaignOnboardingTitle>Languages You Speak</CampaignOnboardingTitle>
        <CampaignLanguageList
          languages={languages}
          selectedCode={selectedCode}
          name="campaign-language"
          onChange={setSelectedCode}
        />
        <CampaignOnboardingContinue
          isBiffle={isBiffle}
          disabled={!selectedCode || saving}
          saving={saving}
          error={saveError}
          onContinue={() => void handleContinue()}
        />
      </div>
    </CampaignOnboardingShell>
  );
}
