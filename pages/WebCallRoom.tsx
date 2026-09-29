import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AgoraRTC, {
  type IAgoraRTCClient,
  type ICameraVideoTrack,
  type IMicrophoneAudioTrack,
  type IRemoteAudioTrack,
} from "agora-rtc-sdk-ng";
import { isBiffleOrganisationId } from "../utils/organisationIdFromUrl";
import {
  fetchWebCallProfileOnce,
  parseIdentityGender,
  userNeedsLanguageSelection,
  type UserDetailsData,
} from "../utils/userProfileApi";
import {
  CREATOR_FALLBACK_ERROR_CODES,
  clearPendingIdentityGender,
  clearWebCallIncomingAccepted,
  clearWebCallPrefsReady,
  fetchCallState,
  fetchWebCallCreatorById,
  fetchWebCallCreators,
  initiateWebCall,
  postCallSessionAction,
  readForcedCreatorIdFromSearch,
  readIdentityGenderFromSearch,
  readPendingIdentityGender,
  resolveWebCallToken,
  webCallIncomingAccepted,
  markWebCallCallFinished,
  markWebCallInstallVariant,
  webCallInstallPath,
  webCallStepPath,
  maybeStripWebCallSecrets,
  requireWebCallLogin,
  fetchWalletBalance,
  isWebCallLowBalance,
  WEB_CALL_WALLET_POLL_MS,
  WEB_CALL_STATE_POLL_MS,
  type CallInitiateResult,
  type WebCallCreatorCard,
  type WebCallCreatorPair,
} from "../utils/webCall";
import type { AfterCheckoutPollResult } from "../utils/coinCheckoutOptions";
import { useWebCallFacebookAttribution } from "../utils/webCampaign";
import {
  createIncomingCallDoc,
  disconnectCallDoc,
  watchCallChannel,
} from "../utils/firebaseCall";
import { WebCallConnectedScreen } from "../components/WebCallConnectedScreen";
import { WebCallInstallNudge } from "../components/WebCallInstallNudge";
import { WebCallQuickRechargeOverlay } from "../components/WebCallQuickRechargeOverlay";
import { WebCallRingingScreen } from "../components/WebCallRingingScreen";
import { pickWebCallPreviewCreator } from "../utils/webCallPreviewCreators";

/** One-time SDK setup — avoids Agora stats/log upload spam in DevTools. */
let agoraConfigured = false;
function agoraDisableEventReport() {
  const rtc = AgoraRTC as typeof AgoraRTC & {
    setParameter?: (key: string, value: boolean) => void;
  };
  rtc.setParameter?.("ENABLE_EVENT_REPORT", false);
}
function configureAgoraOnce() {
  if (agoraConfigured) return;
  agoraConfigured = true;
  try {
    // Default is on. Failed posts to statscollector-1.agora.io/events/messages retry for the whole call.
    agoraDisableEventReport();
    AgoraRTC.disableLogUpload();
    AgoraRTC.setLogLevel(3); // warning+
  } catch {
    /* older SDK builds */
  }
}

type PlaybackKind = "speaker" | "earpiece";

function playbackKind(label: string): PlaybackKind | null {
  const value = label.toLowerCase();
  if (!value) return null;
  if (/bluetooth|headset|headphone|usb|airpod/.test(value)) return null;
  if (/earpiece|receiver|handset/.test(value)) return "earpiece";
  if (/\bphone\b/.test(value) && !/speaker/.test(value)) return "earpiece";
  if (/speaker|loud/.test(value)) return "speaker";
  return null;
}

async function routeAudioElements(deviceId: string) {
  const nodes = document.querySelectorAll("audio");
  await Promise.all(
    [...nodes].map(async (node) => {
      const audio = node as HTMLMediaElement & {
        setSinkId?: (id: string) => Promise<void>;
      };
      if (typeof audio.setSinkId !== "function") return;
      try {
        await audio.setSinkId(deviceId);
      } catch {
        /* iOS and some WebViews cannot choose an output */
      }
    }),
  );
}

/** Route remote audio to speaker or earpiece. Never mute via volume. */
async function applyRemoteSpeaker(
  track: IRemoteAudioTrack | null,
  speaker: boolean,
) {
  if (!track) return;
  try {
    track.setVolume(100);
  } catch {
    /* older SDK builds */
  }
  try {
    track.play();
  } catch {
    /* autoplay / already playing */
  }
  let devices: MediaDeviceInfo[] = [];
  try {
    devices = await AgoraRTC.getPlaybackDevices();
  } catch {
    devices = [];
  }
  const want: PlaybackKind = speaker ? "speaker" : "earpiece";
  const match = devices.find((device) => playbackKind(device.label) === want);
  const fallback = speaker
    ? devices.find((device) => device.deviceId === "default") || devices[0]
    : undefined;
  const deviceId = match?.deviceId || fallback?.deviceId;
  if (!deviceId) return;
  try {
    await track.setPlaybackDevice(deviceId);
  } catch {
    await routeAudioElements(deviceId);
  }
}

function isLiveCallSignal(status: string | null | undefined): boolean {
  const value = String(status || "").toLowerCase();
  return (
    value === "initiated" ||
    value === "accepted" ||
    value === "ongoing" ||
    value === "connected"
  );
}

function isEndedCallSignal(status: string | null | undefined): boolean {
  const value = String(status || "").toLowerCase();
  return (
    value === "disconnected" ||
    value === "ended" ||
    value === "abrupted" ||
    value === "timed_out" ||
    value === "cancelled" ||
    value === "rejected" ||
    value === "missed"
  );
}

function uidFromToken(token: string): number | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = JSON.parse(
      atob(part.replace(/-/g, "+").replace(/_/g, "/")),
    ) as { uid?: number };
    const uid = Number(json.uid);
    return Number.isInteger(uid) && uid > 0 ? uid : null;
  } catch {
    return null;
  }
}

/**
 * User joins Agora from the browser. The creator stays in the app and is rung by the existing call API.
 *
 * API order:
 * gender screen, then language screen (one profile update for both)
 * 1. get-user-details once
 * 2. creator passed from the incoming screen, or a fresh auto-call fetch
 * 3. call/action initiate (audio only)
 * 4. Firestore calls/{id} + send-call-notification initiate_call
 * 5. Agora join (one client)
 * 6. On hangup or remote leave: disconnect doc + disconnect_call, one call/action
 *    end|cancel, one call/state, then leave
 */
export function WebCallRoom({
  organisationId,
  setShowLogin,
  createOrderAndInitiatePayment,
}: {
  organisationId: string;
  setShowLogin?: (open: boolean) => void;
  createOrderAndInitiatePayment?: (
    coinPackId: number | string,
    token?: string | null,
    options?: {
      suppressPaymentStatusPopup?: boolean;
      onCheckoutClosed?: () => void;
      onAfterCheckoutPoll?: (
        result: AfterCheckoutPollResult,
      ) => void | Promise<void>;
    },
    organisationId?: string,
  ) => Promise<{ checkoutLaunched: boolean }>;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const forcedCreatorId = readForcedCreatorIdFromSearch(location.search);
  const token = resolveWebCallToken(organisationId, location.search);
  useWebCallFacebookAttribution(organisationId, location.search, token);
  const preview = new URLSearchParams(location.search).get("preview");
  const isPreview =
    preview === "ringing" ||
    preview === "connected" ||
    preview === "ended" ||
    preview === "recharge";
  const previewCreator = pickWebCallPreviewCreator();
  const callType = "audio" as const;
  const isBiffle = isBiffleOrganisationId(organisationId);
  const [phase, setPhase] = useState<
    "starting" | "ringing" | "live" | "ended" | "error"
  >("starting");
  const [detail, setDetail] = useState("Checking your preferences…");
  const [shownCreator, setShownCreator] = useState<WebCallCreatorCard | null>(
    null,
  );
  const sessionRef = useRef<CallInitiateResult | null>(null);
  const signalRef = useRef<{ docId: string; creatorId: number } | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const micRef = useRef<IMicrophoneAudioTrack | null>(null);
  const camRef = useRef<ICameraVideoTrack | null>(null);
  const remoteAudioRef = useRef<IRemoteAudioTrack | null>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const micMutedRef = useRef(false);
  const speakerOnRef = useRef(true);
  const [installVariant, setInstallVariant] = useState<
    "ended" | "unconnected" | null
  >(null);
  const connectedRef = useRef(false);
  const finishCallRef = useRef<(() => Promise<void>) | null>(null);
  const joiningRef = useRef(false);
  const [lowBalance, setLowBalance] = useState(false);
  const [rechargeDismissed, setRechargeDismissed] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [prejoinRecharge, setPrejoinRecharge] = useState(false);
  const [prejoinRetry, setPrejoinRetry] = useState(0);
  const callPrice = shownCreator?.audioPricePerMinute ?? null;

  const goToPostCallInstall = (variant: "ended" | "unconnected") => {
    markWebCallCallFinished();
    markWebCallInstallVariant(variant);
    setInstallVariant(variant);
    setPhase("ended");
    navigate(webCallInstallPath(location.search), { replace: true });
  };
  const goToPostCallInstallRef = useRef(goToPostCallInstall);
  goToPostCallInstallRef.current = goToPostCallInstall;

  useEffect(() => {
    if (isPreview || phase !== "live" || !token || callPrice == null) {
      if (phase !== "live") {
        setLowBalance(false);
        setRechargeDismissed(false);
      }
      return;
    }
    let cancelled = false;
    const check = async () => {
      const balance = await fetchWalletBalance({
        organisationId,
        authToken: token,
      });
      if (cancelled || balance == null) return;
      setWalletBalance(balance);
      setLowBalance(isWebCallLowBalance(balance, callPrice));
    };
    void check();
    const id = window.setInterval(check, WEB_CALL_WALLET_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [isPreview, phase, token, organisationId, callPrice]);

  useEffect(() => {
    maybeStripWebCallSecrets(location.pathname, location.search, navigate);
    if (isPreview) return;
    if (!webCallIncomingAccepted()) {
      navigate(webCallStepPath("incoming", location.search), { replace: true });
      return;
    }
    if (!token) {
      if (setShowLogin) {
        requireWebCallLogin(
          location.pathname,
          location.search,
          setShowLogin,
        );
      }
      return;
    }
    let cancelled = false;
    let stopWatch: (() => void) | null = null;
    let statePoll: ReturnType<typeof setInterval> | null = null;
    let remoteLeaveTimer: ReturnType<typeof setTimeout> | null = null;
    const auth = { organisationId, authToken: token };

    const abandonInFlightCall = () => {
      const signal = signalRef.current;
      signalRef.current = null;
      if (signal) {
        void disconnectCallDoc({
          ...auth,
          docId: signal.docId,
          creatorId: signal.creatorId,
        }).catch(() => undefined);
      }
      const session = sessionRef.current;
      sessionRef.current = null;
      if (session) {
        void postCallSessionAction({
          ...auth,
          action: phaseRef.current === "live" ? "end" : "cancel",
          sessionId: session.session_id,
        }).catch(() => undefined);
      }
    };

    const markLive = () => {
      if (cancelled || connectedRef.current) return;
      connectedRef.current = true;
      setPhase("live");
      setDetail("On call");
    };

    const clearRemoteLeaveTimer = () => {
      if (remoteLeaveTimer == null) return;
      clearTimeout(remoteLeaveTimer);
      remoteLeaveTimer = null;
    };

    const leave = async () => {
      stopWatch?.();
      stopWatch = null;
      if (statePoll != null) {
        clearInterval(statePoll);
        statePoll = null;
      }
      clearRemoteLeaveTimer();
      joiningRef.current = false;
      micRef.current?.close();
      micRef.current = null;
      camRef.current?.close();
      camRef.current = null;
      remoteAudioRef.current = null;
      const client = clientRef.current;
      clientRef.current = null;
      if (client) {
        client.removeAllListeners();
        try {
          await client.leave();
        } catch {
          /* already left */
        }
      }
    };

    const join = async (session: CallInitiateResult): Promise<boolean> => {
      if (cancelled || clientRef.current || joiningRef.current) return false;
      configureAgoraOnce();
      joiningRef.current = true;
      const appId = session.app_id || import.meta.env.VITE_AGORA_APP_ID || "";
      const uid = session.uid || uidFromToken(auth.authToken);
      if (!appId || uid == null) {
        joiningRef.current = false;
        setPhase("error");
        setDetail("Call service is not configured.");
        return false;
      }
      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;
      // Listeners must be set before join. Agora: subscribe/play on user-published;
      // user-unpublished is mute/unpublish, not hangup; user-left is leave/offline.
      // https://docs.agora.io/en/realtime-media/rtc/voice-quickstart
      client.on("user-published", async (user, mediaType) => {
        if (cancelled || clientRef.current !== client) return;
        try {
          await client.subscribe(user, mediaType);
        } catch {
          return;
        }
        clearRemoteLeaveTimer();
        if (mediaType === "audio" && user.audioTrack) {
          remoteAudioRef.current = user.audioTrack;
          void applyRemoteSpeaker(user.audioTrack, speakerOnRef.current);
          markLive();
        }
        if (mediaType === "video" && remoteVideoRef.current) {
          user.videoTrack?.play(remoteVideoRef.current);
        }
      });
      client.on("user-unpublished", (_user, mediaType) => {
        if (cancelled || clientRef.current !== client) return;
        if (mediaType === "audio") remoteAudioRef.current = null;
      });
      client.on("user-joined", () => {
        if (cancelled || clientRef.current !== client) return;
        clearRemoteLeaveTimer();
      });
      client.on("user-left", () => {
        if (cancelled || clientRef.current !== client) return;
        if (!connectedRef.current) return;
        clearRemoteLeaveTimer();
        remoteLeaveTimer = setTimeout(() => {
          remoteLeaveTimer = null;
          if (cancelled || clientRef.current !== client) return;
          if (client.remoteUsers.length > 0) return;
          void finishCallRef.current?.();
        }, 1200);
      });
      client.on("connection-state-change", (cur) => {
        if (cancelled || clientRef.current !== client) return;
        if (!connectedRef.current) return;
        if (cur === "DISCONNECTED" || cur === "DISCONNECTING") {
          void finishCallRef.current?.();
        }
      });
      try {
        await client.join(appId, session.channel_name, session.token, uid);
        // Gateway config can turn event reporting back on during join.
        agoraDisableEventReport();
        if (cancelled) {
          await leave();
          return false;
        }
        const mic = await AgoraRTC.createMicrophoneAudioTrack();
        if (cancelled) {
          mic.close();
          await leave();
          return false;
        }
        micRef.current = mic;
        if (micMutedRef.current) {
          await mic.setMuted(true);
        }
        await client.publish([mic]);
        return true;
      } catch (err) {
        joiningRef.current = false;
        await leave();
        if (!cancelled) {
          setPhase("error");
          setDetail(
            err instanceof Error ? err.message : "Could not join the call.",
          );
        }
        return false;
      }
    };

    const tryCreator = async (creatorId: number, profile: UserDetailsData) => {
      if (cancelled) return "stop" as const;
      const initiate = () =>
        initiateWebCall({
          ...auth,
          creatorId,
          callType,
        });
      let result = await initiate();
      if (!result.ok && result.error.error_code === "Insufficient_balance") {
        for (let i = 0; i < 3; i++) {
          await new Promise((resolve) => window.setTimeout(resolve, 800));
          if (cancelled) return "stop" as const;
          result = await initiate();
          if (result.ok || result.error.error_code !== "Insufficient_balance") {
            break;
          }
        }
      }
      if (result.ok) {
        sessionRef.current = result.data;
      }
      if (cancelled) {
        abandonInFlightCall();
        return "stop" as const;
      }
      if (result.ok) {
        let docId = "";
        try {
          docId = await createIncomingCallDoc({
            ...auth,
            creatorId,
            sessionId: result.data.session_id,
            channelName: result.data.channel_name,
            agoraToken: result.data.token,
            callType,
            userDetails: profile,
          });
          signalRef.current = { docId, creatorId };
        } catch {
          abandonInFlightCall();
          if (!cancelled) {
            setPhase("error");
            setDetail("Could not reach the creator.");
          }
          return "stop" as const;
        }
        if (cancelled) {
          abandonInFlightCall();
          return "stop" as const;
        }
        stopWatch = watchCallChannel(
            result.data.channel_name,
            (row) => {
              if (cancelled) return;
              if (row.ringingAt && !connectedRef.current) {
                setDetail("Ringing…");
              }
              if (isLiveCallSignal(row.status)) {
                markLive();
                return;
              }
              if (isEndedCallSignal(row.status)) {
                void finishCallRef.current?.();
              }
            },
            { docId },
          );
        setPhase("ringing");
        setDetail("Ringing…");
        const joined = await join(result.data);
        if (cancelled) {
          abandonInFlightCall();
          return "stop" as const;
        }
        if (joined) {
          // Backup only. Live hangup is Agora connection-state-change /
          // user-left and Firestore. This catches coins_exhausted if those miss.
          statePoll = setInterval(() => {
            const session = sessionRef.current;
            if (!session || cancelled) {
              if (statePoll != null) {
                clearInterval(statePoll);
                statePoll = null;
              }
              return;
            }
            void fetchCallState({ ...auth, sessionId: session.session_id }).then(
              (status) => {
                if (cancelled) return;
                if (isLiveCallSignal(status)) {
                  if (!connectedRef.current) markLive();
                  return;
                }
                if (isEndedCallSignal(status)) {
                  void finishCallRef.current?.();
                }
              },
            );
          }, WEB_CALL_STATE_POLL_MS);
          return "joined" as const;
        }
        finished = true;
        const signal = signalRef.current;
        signalRef.current = null;
        stopWatch?.();
        stopWatch = null;
        if (signal) {
          try {
            await disconnectCallDoc({
              ...auth,
              docId: signal.docId,
              creatorId: signal.creatorId,
            });
          } catch {
            /* still cancel the session */
          }
        }
        try {
          await postCallSessionAction({
            ...auth,
            action: "cancel",
            sessionId: result.data.session_id,
          });
        } catch {
          /* session may already be gone */
        }
        sessionRef.current = null;
        return "stop" as const;
      }
      if (result.error.error_code === "Insufficient_balance") {
        if (createOrderAndInitiatePayment && !cancelled) {
          const balance =
            (await fetchWalletBalance({
              organisationId,
              authToken: token,
            })) ?? 0;
          setWalletBalance(balance);
          setPrejoinRecharge(true);
          return "recharge" as const;
        }
        if (forcedCreatorId) {
          if (!cancelled) {
            setPhase("error");
            setDetail(
              result.error.error_message ||
                "Not enough coins to start the call.",
            );
          }
          return "stop" as const;
        }
        return "unconnected" as const;
      }
      if (
        result.error.error_code &&
        CREATOR_FALLBACK_ERROR_CODES.has(result.error.error_code)
      ) {
        if (forcedCreatorId) {
          if (!cancelled) {
            setPhase("error");
            setDetail(
              result.error.error_message || "Creator is not available.",
            );
          }
          return "stop" as const;
        }
        return "next" as const;
      }
      if (!cancelled) {
        setPhase("error");
        setDetail(result.error.error_message || "Could not start the call.");
      }
      return "stop" as const;
    };

    const run = async () => {
      let details: UserDetailsData;
      try {
        details = await fetchWebCallProfileOnce(auth.authToken, organisationId);
      } catch {
        if (!cancelled) {
          setPhase("error");
          setDetail("Could not load your profile. Please try again.");
        }
        return;
      }
      if (cancelled) return;
      if (!forcedCreatorId) {
        const pendingIdentity =
          readIdentityGenderFromSearch(location.search) ||
          readPendingIdentityGender();
        const identity =
          parseIdentityGender(details.gender) || pendingIdentity;
        if (!identity) {
          clearWebCallPrefsReady();
          navigate(webCallStepPath("gender", location.search), {
            replace: true,
          });
          return;
        }
        if (userNeedsLanguageSelection(details)) {
          navigate(webCallStepPath("language", location.search), {
            replace: true,
          });
          return;
        }
        clearPendingIdentityGender();
      }
      let ordered: WebCallCreatorCard[] = [];
      if (forcedCreatorId) {
        const forced =
          (await fetchWebCallCreatorById({
            ...auth,
            creatorId: forcedCreatorId,
          })) || {
            id: forcedCreatorId,
            name: "Creator",
            profilePicUrl: "",
            audioPricePerMinute: null,
          };
        ordered = [forced];
      } else {
        const handed = (location.state as { pair?: WebCallCreatorPair } | null)
          ?.pair;
        const pair =
          handed?.creator != null
            ? handed
            : await fetchWebCallCreators({
                ...auth,
              });
        if (cancelled) return;
        if (!pair?.creator) {
          goToPostCallInstallRef.current("unconnected");
          return;
        }
        ordered = [pair.creator, pair.fallback].filter(
          (creator): creator is WebCallCreatorCard => creator != null,
        );
      }
      if (cancelled) return;
      if (!ordered.length) {
        goToPostCallInstallRef.current("unconnected");
        return;
      }
      for (const creator of ordered) {
        if (cancelled) return;
        setShownCreator(creator);
        const outcome = await tryCreator(creator.id, details);
        if (outcome === "unconnected") {
          if (!cancelled) {
            goToPostCallInstallRef.current("unconnected");
          }
          return;
        }
        if (outcome === "recharge") return;
        if (outcome === "joined") return;
        if (outcome === "stop") return;
      }
      if (!cancelled) {
        goToPostCallInstallRef.current("unconnected");
      }
    };

    let finished = false;
    finishCallRef.current = async () => {
      if (finished || cancelled) return;
      finished = true;
      const signal = signalRef.current;
      signalRef.current = null;
      const session = sessionRef.current;
      sessionRef.current = null;
      if (signal) {
        try {
          await disconnectCallDoc({
            ...auth,
            docId: signal.docId,
            creatorId: signal.creatorId,
          });
        } catch {
          /* still end the Agora session */
        }
      }
      if (session) {
        try {
          await postCallSessionAction({
            ...auth,
            action: connectedRef.current ? "end" : "cancel",
            sessionId: session.session_id,
          });
        } catch {
          /* session may already be gone */
        }
      }
      const status = session
        ? await fetchCallState({ ...auth, sessionId: session.session_id })
        : null;
      if (cancelled) return;
      const connected = connectedRef.current || status === "ended";
      goToPostCallInstallRef.current(connected ? "ended" : "unconnected");
      clearWebCallIncomingAccepted();
      await leave();
    };

    void run();

    return () => {
      cancelled = true;
      if (finished) return;
      finished = true;
      finishCallRef.current = null;
      abandonInFlightCall();
      void leave();
    };
    // Call starts once per room mount / call_type. Do not re-run on phase changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callType, organisationId, isPreview, forcedCreatorId, token, prejoinRetry]);

  const hangUp = async () => {
    await finishCallRef.current?.();
  };

  const toggleMute = () => {
    const next = !micMutedRef.current;
    micMutedRef.current = next;
    setMicMuted(next);
    void micRef.current?.setMuted(next);
  };

  const toggleSpeaker = () => {
    const next = !speakerOnRef.current;
    speakerOnRef.current = next;
    setSpeakerOn(next);
    void applyRemoteSpeaker(remoteAudioRef.current, next);
  };

  const connectedScreen = (photoUrl: string | undefined, personName: string) => (
    <WebCallConnectedScreen
      name={personName}
      photoUrl={photoUrl}
      muted={micMuted}
      speakerOn={speakerOn}
      onToggleMute={toggleMute}
      onToggleSpeaker={toggleSpeaker}
      onHangUp={() => void hangUp()}
    />
  );

  if (preview === "connected" || preview === "recharge") {
    return (
      <div className="relative h-dvh max-h-dvh overflow-hidden overscroll-none">
        {connectedScreen(
          previewCreator.profilePicUrl,
          previewCreator.name,
        )}
        {preview === "recharge" && createOrderAndInitiatePayment ? (
          <WebCallQuickRechargeOverlay
            organisationId={organisationId}
            authToken={token || ""}
            walletBalance={30}
            callPrice={40}
            createOrderAndInitiatePayment={createOrderAndInitiatePayment}
            onRecharged={() => undefined}
            onClose={() => undefined}
          />
        ) : null}
      </div>
    );
  }

  if (preview === "ended") {
    return (
      <WebCallInstallNudge organisationId={organisationId} variant="ended" />
    );
  }

  if (preview === "ringing") {
    return (
      <WebCallRingingScreen
        name={previewCreator.name}
        photoUrl={previewCreator.profilePicUrl}
        statusLabel="Ringing"
        onHangUp={() => undefined}
      />
    );
  }

  if (
    prejoinRecharge &&
    token &&
    createOrderAndInitiatePayment
  ) {
    const dismissPrejoin = () => {
      setPrejoinRecharge(false);
      goToPostCallInstall("unconnected");
    };
    return (
      <div className="relative h-dvh max-h-dvh overflow-hidden overscroll-none">
        <WebCallRingingScreen
          name={shownCreator?.name || "Creator"}
          photoUrl={shownCreator?.profilePicUrl}
          statusLabel="Connecting…"
          onHangUp={dismissPrejoin}
        />
        <WebCallQuickRechargeOverlay
          organisationId={organisationId}
          authToken={token}
          walletBalance={walletBalance ?? 0}
          callPrice={callPrice ?? 1}
          createOrderAndInitiatePayment={createOrderAndInitiatePayment}
          onClose={dismissPrejoin}
          onRecharged={() => {
            setPrejoinRecharge(false);
            setPrejoinRetry((n) => n + 1);
          }}
        />
      </div>
    );
  }

  if (phase === "live") {
    return (
      <div className="relative h-dvh max-h-dvh overflow-hidden overscroll-none">
        {connectedScreen(
          shownCreator?.profilePicUrl,
          shownCreator?.name || "Creator",
        )}
        {token &&
        createOrderAndInitiatePayment &&
        lowBalance &&
        !rechargeDismissed &&
        walletBalance != null &&
        callPrice != null ? (
          <WebCallQuickRechargeOverlay
            organisationId={organisationId}
            authToken={token}
            walletBalance={walletBalance}
            callPrice={callPrice}
            createOrderAndInitiatePayment={createOrderAndInitiatePayment}
            onClose={() => setRechargeDismissed(true)}
            onRecharged={() => {
              setRechargeDismissed(false);
              void fetchWalletBalance({
                organisationId,
                authToken: token,
              }).then((balance) => {
                if (balance == null) return;
                setWalletBalance(balance);
                setLowBalance(isWebCallLowBalance(balance, callPrice));
              });
            }}
          />
        ) : null}
      </div>
    );
  }

  if (installVariant) {
    return (
      <WebCallInstallNudge
        organisationId={organisationId}
        variant={installVariant}
      />
    );
  }

  if (phase === "error") {
    const shell = isBiffle ? "bg-white text-gray-900" : "bg-[#162a44] text-white";
    return (
      <div className={`flex h-dvh max-h-dvh flex-col items-center justify-center overflow-hidden overscroll-none px-6 text-center ${shell}`}>
        <p className="text-sm opacity-70">Audio call</p>
        <h1 className="mt-3 text-2xl font-bold">{detail}</h1>
      </div>
    );
  }

  if (!webCallIncomingAccepted() || !token) {
    return (
      <div className="flex h-dvh max-h-dvh items-center justify-center overflow-hidden overscroll-none bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-700" />
      </div>
    );
  }

  const statusLabel = phase === "ringing" ? "Ringing" : "Connecting…";

  return (
    <WebCallRingingScreen
      name={shownCreator?.name || "Creator"}
      photoUrl={shownCreator?.profilePicUrl}
      statusLabel={statusLabel}
      onHangUp={() => void hangUp()}
    />
  );
}
