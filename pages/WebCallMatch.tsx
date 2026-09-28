import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CampaignLanguageList,
  CampaignOnboardingBackButton,
  CampaignOnboardingContinue,
  CampaignOnboardingError,
  CampaignOnboardingShell,
  CampaignOnboardingSpinner,
  CampaignOnboardingTitle,
  CampaignSelectRow,
} from "../components/CampaignOnboardingUi";
import { isBiffleOrganisationId } from "../utils/organisationIdFromUrl";
import {
  fetchAvailableLanguages,
  fetchWebCallProfileOnce,
  parseIdentityGender,
  resetWebCallProfileRequest,
  updateWebCallPreferences,
  type LanguageOption,
  type UserIdentityGender,
} from "../utils/userProfileApi";
import {
  markWebCallPrefsReady,
  nextLoggedInWebCallStep,
  readIdentityGenderFromSearch,
  readPendingIdentityGender,
  resolveWebCallToken,
  savePendingIdentityGender,
  searchWithIdentityGender,
  webCallPathForStep,
  webCallStepPath,
  maybeStripWebCallSecrets,
  requireWebCallLogin,
} from "../utils/webCall";
import { useWebCallFacebookAttribution, readPackIdFromSearch } from "../utils/webCampaign";

/**
 * Same campaign onboarding chrome as /campaign/language.
 * Order: gender → language → welcome offer if unclaimed → incoming after pay;
 * returning claimed users go to install.
 */

const IDENTITIES: {
  value: UserIdentityGender;
  label: string;
  icon: string;
}[] = [
  {
    value: "Male",
    label: "I am a man",
    icon: "/web-call/gender-man.svg",
  },
  {
    value: "Female",
    label: "I am a woman",
    icon: "/web-call/gender-woman.svg",
  },
  {
    value: "Other",
    label: "Other",
    icon: "/web-call/gender-other.svg",
  },
];

function GenderIcon({ src }: { src: string }) {
  return (
    <span
      aria-hidden
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e8f5e9]"
    >
      <span
        className="inline-block h-6 w-6"
        style={{
          backgroundColor: "#162a44",
          WebkitMaskImage: `url("${src}")`,
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          WebkitMaskSize: "24px 24px",
          maskImage: `url("${src}")`,
          maskRepeat: "no-repeat",
          maskPosition: "center",
          maskSize: "24px 24px",
        }}
      />
    </span>
  );
}

function OnboardingPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CampaignOnboardingShell>
      <div className="flex min-h-0 flex-1 flex-col px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        {children}
      </div>
    </CampaignOnboardingShell>
  );
}

export function WebCallGender({
  organisationId,
  setShowLogin,
}: {
  organisationId: string;
  setShowLogin: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isBiffle = isBiffleOrganisationId(organisationId);
  const authToken = resolveWebCallToken(organisationId, location.search);
  const coinPackId = readPackIdFromSearch(location.search);
  useWebCallFacebookAttribution(organisationId, location.search, authToken);
  const [selected, setSelected] = useState<UserIdentityGender | null>(
    () => readPendingIdentityGender(),
  );
  const [confirmedAdult, setConfirmedAdult] = useState(false);

  useEffect(() => {
    maybeStripWebCallSecrets(location.pathname, location.search, navigate);
    if (!authToken) {
      requireWebCallLogin(location.pathname, location.search, setShowLogin);
      return;
    }
    let cancelled = false;
    void nextLoggedInWebCallStep({
      organisationId,
      authToken,
      coinPackId,
      search: location.search,
    }).then((next) => {
      if (cancelled) return;
      if (next !== "gender") {
        navigate(webCallPathForStep(next, location.search), { replace: true });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    authToken,
    coinPackId,
    location.pathname,
    location.search,
    navigate,
    organisationId,
    setShowLogin,
  ]);

  const continueToLanguage = () => {
    if (!authToken || !selected || !confirmedAdult) return;
    savePendingIdentityGender(selected);
    navigate(
      webCallStepPath(
        "language",
        searchWithIdentityGender(location.search, selected),
      ),
    );
  };

  if (!authToken) {
    return (
      <CampaignOnboardingShell>
        <CampaignOnboardingSpinner isBiffle={isBiffle} />
        <button
          type="button"
          onClick={() =>
            requireWebCallLogin(
              location.pathname,
              location.search,
              setShowLogin,
            )
          }
          className="mt-8 text-sm font-semibold text-neutral-700 underline"
        >
          Log in to continue
        </button>
      </CampaignOnboardingShell>
    );
  }

  return (
    <OnboardingPage>
      <CampaignOnboardingTitle>
        How do you identify yourself?
      </CampaignOnboardingTitle>
      <div
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain"
        role="radiogroup"
        aria-label="How do you identify yourself?"
      >
        {IDENTITIES.map((identity) => (
          <CampaignSelectRow
            key={identity.value}
            name="web-call-identity"
            value={identity.value}
            selected={selected === identity.value}
            label={identity.label}
            leading={<GenderIcon src={identity.icon} />}
            onSelect={() => setSelected(identity.value)}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => setConfirmedAdult((value) => !value)}
        className="mt-4 flex w-full items-center justify-center gap-3"
      >
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
            confirmedAdult
              ? "border-[#162a44] bg-[#162a44]"
              : "border-gray-300 bg-white"
          }`}
          aria-hidden
        >
          {confirmedAdult ? (
            <i className="fa-solid fa-check text-[10px] text-white" aria-hidden />
          ) : null}
        </span>
        <span className="text-sm font-medium text-[#162a44]">
          I confirm I am 18 years or above.
        </span>
      </button>
      <CampaignOnboardingContinue
        isBiffle={isBiffle}
        disabled={!selected || !confirmedAdult || !authToken}
        onContinue={continueToLanguage}
      />
    </OnboardingPage>
  );
}

export function WebCallLanguage({
  organisationId,
  setShowLogin,
}: {
  organisationId: string;
  setShowLogin: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isBiffle = isBiffleOrganisationId(organisationId);
  const authToken = resolveWebCallToken(organisationId, location.search);
  const coinPackId = readPackIdFromSearch(location.search);
  useWebCallFacebookAttribution(organisationId, location.search, authToken);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [retryTick, setRetryTick] = useState(0);

  const genderPath = useMemo(
    () => webCallStepPath("gender", location.search),
    [location.search],
  );
  const pendingIdentity =
    readIdentityGenderFromSearch(location.search) ||
    readPendingIdentityGender();

  useEffect(() => {
    maybeStripWebCallSecrets(location.pathname, location.search, navigate);
    if (!authToken) {
      requireWebCallLogin(location.pathname, location.search, setShowLogin);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const next = await nextLoggedInWebCallStep({
          organisationId,
          authToken,
          coinPackId,
          search: location.search,
        });
        if (cancelled) return;
        if (next !== "language") {
          navigate(webCallPathForStep(next, location.search), { replace: true });
          return;
        }
        const details = await fetchWebCallProfileOnce(
          authToken,
          organisationId,
        );
        if (cancelled) return;
        if (
          !(
            readIdentityGenderFromSearch(location.search) ||
            readPendingIdentityGender() ||
            parseIdentityGender(details.gender)
          )
        ) {
          navigate(genderPath, { replace: true });
          return;
        }
        const options = await fetchAvailableLanguages(
          organisationId,
          authToken,
        );
        if (cancelled) return;
        if (!options.length) {
          setError("No languages available. Please try again.");
          setPhase("error");
          return;
        }
        setLanguages(options);
        setPhase("ready");
      } catch {
        if (!cancelled) {
          setError("Could not load languages. Please try again.");
          setPhase("error");
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [
    authToken,
    coinPackId,
    genderPath,
    location.pathname,
    location.search,
    navigate,
    organisationId,
    setShowLogin,
    retryTick,
  ]);

  const save = async () => {
    if (!authToken || !selectedCode || saving) return;
    setSaving(true);
    setError(null);
    try {
      const details = await fetchWebCallProfileOnce(authToken, organisationId);
      const identity =
        pendingIdentity || parseIdentityGender(details.gender);
      if (!identity) {
        setSaving(false);
        navigate(genderPath, { replace: true });
        return;
      }
      await updateWebCallPreferences(authToken, organisationId, {
        identityGender: identity,
        languageCode: selectedCode,
      });
      resetWebCallProfileRequest();
      markWebCallPrefsReady();
      const next = await nextLoggedInWebCallStep({
        organisationId,
        authToken,
        coinPackId,
        search: location.search,
      });
      navigate(webCallPathForStep(next, location.search), { replace: true });
    } catch {
      setError("Could not save your preferences. Please try again.");
      setSaving(false);
    }
  };

  if (phase === "loading") {
    return (
      <CampaignOnboardingShell>
        <CampaignOnboardingSpinner isBiffle={isBiffle} />
        {!authToken ? (
          <button
            type="button"
            onClick={() =>
              requireWebCallLogin(
                location.pathname,
                location.search,
                setShowLogin,
              )
            }
            className="mt-8 text-sm font-semibold text-neutral-700 underline"
          >
            Log in to continue
          </button>
        ) : null}
      </CampaignOnboardingShell>
    );
  }

  if (phase === "error") {
    return (
      <CampaignOnboardingShell>
        <CampaignOnboardingError
          message={error}
          onRetry={() => {
            setError(null);
            setPhase("loading");
            setRetryTick((n) => n + 1);
          }}
        />
      </CampaignOnboardingShell>
    );
  }

  return (
    <OnboardingPage>
      <CampaignOnboardingBackButton
        label="Back"
        onClick={() => navigate(genderPath)}
      />
      <CampaignOnboardingTitle>Languages You Speak</CampaignOnboardingTitle>
      <CampaignLanguageList
        languages={languages}
        selectedCode={selectedCode}
        name="web-call-language"
        onChange={setSelectedCode}
      />
      <CampaignOnboardingContinue
        isBiffle={isBiffle}
        disabled={!selectedCode || saving}
        saving={saving}
        error={error}
        onContinue={() => void save()}
      />
    </OnboardingPage>
  );
}
