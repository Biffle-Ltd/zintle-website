import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { WebCallAutoCallTrigger } from "../components/WebCallAutoCallTrigger";
import { WebCallInstallNudge } from "../components/WebCallInstallNudge";
import {
  fetchWebCallCreatorById,
  fetchWebCallCreators,
  markWebCallIncomingAccepted,
  nextLoggedInWebCallStep,
  readForcedCreatorIdFromSearch,
  resolveWebCallToken,
  webCallPathForStep,
  webCallStepPath,
  maybeStripWebCallSecrets,
  requireWebCallLogin,
  type WebCallCreatorPair,
} from "../utils/webCall";
import { useWebCallFacebookAttribution, readPackIdFromSearch } from "../utils/webCampaign";

/**
 * Real incoming after the welcome-offer purchase. Accept starts the Agora room.
 * Returning users who already claimed (and did not just pay) never land here.
 */
export function WebCallIncoming({
  organisationId,
  setShowLogin,
}: {
  organisationId: string;
  setShowLogin: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [pair, setPair] = useState<WebCallCreatorPair | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "empty" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const forcedCreatorId = readForcedCreatorIdFromSearch(location.search);
  const token = resolveWebCallToken(organisationId, location.search);
  const coinPackId = readPackIdFromSearch(location.search);
  useWebCallFacebookAttribution(organisationId, location.search, token);

  useEffect(() => {
    maybeStripWebCallSecrets(location.pathname, location.search, navigate);
    if (!token) {
      requireWebCallLogin(location.pathname, location.search, setShowLogin);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const next = await nextLoggedInWebCallStep({
          organisationId,
          authToken: token,
          coinPackId,
          search: location.search,
        });
        if (cancelled) return;
        if (next !== "incoming") {
          navigate(webCallPathForStep(next, location.search), { replace: true });
          return;
        }
        if (forcedCreatorId) {
          const card = await fetchWebCallCreatorById({
            organisationId,
            authToken: token,
            creatorId: forcedCreatorId,
          });
          if (cancelled) return;
          if (!card) {
            setPhase("empty");
            return;
          }
          setPair({ creator: card, fallback: null });
          setPhase("ready");
          return;
        }
        const matched = await fetchWebCallCreators({
          organisationId,
          authToken: token,
        });
        if (cancelled) return;
        if (!matched) {
          setPhase("empty");
          return;
        }
        setPair(matched);
        setPhase("ready");
      } catch {
        if (!cancelled) {
          setError("Could not find a creator. Please try again.");
          setPhase("error");
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [
    forcedCreatorId,
    location.pathname,
    location.search,
    navigate,
    organisationId,
    setShowLogin,
    token,
    coinPackId,
    retryTick,
  ]);

  const accept = () => {
    if (!token || !pair) return;
    markWebCallIncomingAccepted();
    navigate(webCallStepPath("room", location.search), {
      state: { pair },
    });
  };

  if (!token) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-700" />
        <button
          type="button"
          onClick={() =>
            requireWebCallLogin(location.pathname, location.search, setShowLogin)
          }
          className="mt-8 text-sm font-semibold text-neutral-700 underline"
        >
          Log in to continue
        </button>
      </div>
    );
  }

  if (phase === "empty") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white px-6">
        <div className="w-full max-w-md">
          <WebCallInstallNudge
            organisationId={organisationId}
            variant="unconnected"
          />
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <WebCallAutoCallTrigger
        name=""
        photoUrl=""
        loading
        onAccept={() => undefined}
      />
    );
  }

  if (phase === "error" || !pair) {
    return (
      <WebCallAutoCallTrigger
        name="Creator"
        photoUrl=""
        status={error || "Could not find a creator. Please try again."}
        onAccept={() => {
          setError(null);
          setPhase("loading");
          setRetryTick((n) => n + 1);
        }}
      />
    );
  }

  return (
    <WebCallAutoCallTrigger
      name={pair.creator.name}
      photoUrl={pair.creator.profilePicUrl}
      status={error}
      onAccept={accept}
    />
  );
}
