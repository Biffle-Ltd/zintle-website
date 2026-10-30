import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { clearJwtForOrganisation, getJwtFromStorage } from "../utils/authStorage";
import {
  handleCampaignUnauthorized,
  isCampaignReAuthStatus,
} from "../utils/campaignAuth";
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
import { readCampaignAclidFromParams, readCampaignAclidFromSearch } from "../utils/tjAclid";
import {
  linkCampaignTjAttributionSafe,
  resolveCampaignAclid,
} from "../utils/tjAttribution";
import { isBiffleOrganisationId } from "../utils/organisationIdFromUrl";
import {
  copyShareChatVerifyParams,
  mergeRememberedShareChatVerifySearch,
  rememberShareChatVerifySearch,
  sendShareChatSubmitApplication,
  shareChatVerifySearchHasParams,
} from "../utils/shareChatPixel";
import { ZINTLE_POST_LOGIN_REDIRECT_KEY } from "../utils/postLoginRedirect";
import {
  readCampaignSelectedLanguage,
  writeCampaignSelectedLanguage,
} from "../utils/campaignSelectedLanguage";
import { isCampaignTamilLanguageFlag } from "../utils/campaignTamilFlag";
import {
  campaignFreePlanErrorStatus,
  refreshCampaignCheckoutPlanPath,
} from "../utils/campaignFreePlan";
import {
  fetchAvailableLanguages,
  fetchUserDetails,
  firstActiveLanguageCode,
  updateUserLanguages,
  userNeedsLanguageSelection,
  type LanguageOption,
} from "../utils/userProfileApi";

function buildCampaignBackPath(search: string): string {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const preserved = new URLSearchParams();
  for (const key of ["organisation_id", "fbclid", "aclid", "tamil"] as const) {
    const value =
      key === "aclid"
        ? readCampaignAclidFromParams(params)
        : (params.get(key)?.trim() ?? "");
    if (value) preserved.set(key, value);
  }
  copyShareChatVerifyParams(params, preserved);
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

  useEffect(() => {
    if (!authToken) return;
    const aclid = resolveCampaignAclid(
      organisationId,
      readCampaignAclidFromSearch(location.search),
    );
    if (!aclid) return;
    linkCampaignTjAttributionSafe({
      aclid,
      organisationId,
      authToken,
    });
  }, [authToken, location.search, organisationId]);

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

  useLayoutEffect(() => {
    if (shareChatVerifySearchHasParams(location.search)) {
      rememberShareChatVerifySearch(location.search);
      return;
    }
    const next = mergeRememberedShareChatVerifySearch(location.search);
    if (!next || next === location.search) return;
    navigate(`${location.pathname}${next}`, { replace: true });
  }, [location.pathname, location.search, navigate]);

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
    // /campaign sends a visitor with no stored language straight back here.
    if (readCampaignSelectedLanguage(organisationId)) {
      navigate(campaignBackPath);
    }
    setShowLogin(true);
  }, [
    campaignBackPath,
    location.pathname,
    location.search,
    navigate,
    organisationId,
    setShowLogin,
  ]);

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

  const pendingCheckout = getCampaignLanguageCheckoutRedirect();
  const hasPendingCheckout = Boolean(pendingCheckout?.startsWith("/"));
  const showLanguageBack =
    hasPendingCheckout &&
    Boolean(readCampaignSelectedLanguage(organisationId));

  const loadLanguages = useCallback(async () => {
    if (
      isBiffleCampaignLanguageFlow(organisationId) &&
      isCampaignTamilLanguageFlag(location.search)
    ) {
      navigate(buildCampaignBackPath(location.search), { replace: true });
      return;
    }

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

    setPhase("checking");
    setLoadError(null);

    let listToken = authToken;
    try {
      if (listToken) {
        try {
          const details = await fetchUserDetails(listToken, organisationId);
          if (!userNeedsLanguageSelection(details)) {
            const code = firstActiveLanguageCode(details);
            if (code) writeCampaignSelectedLanguage(organisationId, code);
            const pending = getCampaignLanguageCheckoutRedirect();
            if (pending?.startsWith("/")) {
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
            if (aliveRef.current) navigate(campaignBackPath, { replace: true });
            return;
          }
        } catch (err) {
          if (!aliveRef.current) return;
          const pending = getCampaignLanguageCheckoutRedirect()?.startsWith("/");
          if (
            isCampaignReAuthStatus(campaignFreePlanErrorStatus(err)) &&
            !pending
          ) {
            clearJwtForOrganisation(organisationId);
            listToken = null;
          } else {
            throw err;
          }
        }
      }

      const options = await fetchAvailableLanguages(
        organisationId,
        listToken,
      );
      if (!aliveRef.current) return;
      if (options.length === 0) {
        setLoadError("No languages available. Please try again.");
        setPhase("error");
        return;
      }

      setLanguages(options);
      setPhase("ready");
    } catch (err) {
      if (!aliveRef.current) return;
      if (
        authToken &&
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
    location.search,
    navigate,
    organisationId,
    requireLogin,
  ]);

  useEffect(() => {
    void loadLanguages();
  }, [loadLanguages]);

  const handleContinue = async () => {
    if (!selectedCode || saving) return;

    setSaving(true);
    setSaveError(null);

    writeCampaignSelectedLanguage(organisationId, selectedCode);
    const tokenNow = headerSafeToken(getJwtFromStorage(organisationId));
    let languageSaved = !tokenNow;
    try {
      if (tokenNow) {
        const details = await fetchUserDetails(tokenNow, organisationId);
        const existing = firstActiveLanguageCode(details);
        if (!existing) {
          await updateUserLanguages(tokenNow, organisationId, selectedCode);
        } else {
          writeCampaignSelectedLanguage(organisationId, existing);
        }
        languageSaved = true;
      }
      sendShareChatSubmitApplication();
      sendCampaignLanguageSaved(pixelContext, { language_code: selectedCode });
      const pending = getCampaignLanguageCheckoutRedirect();
      if (pending?.startsWith("/")) {
        await forwardToCheckout();
        return;
      }
      if (aliveRef.current) navigate(campaignBackPath, { replace: true });
    } catch (err) {
      if (!aliveRef.current) return;
      const pending = getCampaignLanguageCheckoutRedirect()?.startsWith("/");
      if (
        isCampaignReAuthStatus(campaignFreePlanErrorStatus(err)) &&
        !pending
      ) {
        clearJwtForOrganisation(organisationId);
        if (aliveRef.current) navigate(campaignBackPath, { replace: true });
        return;
      }
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
        {showLanguageBack ? (
          <CampaignOnboardingBackButton
            onClick={() => navigate(campaignBackPath)}
            label="Back to campaign"
          />
        ) : null}
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
