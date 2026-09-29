import React, { useEffect, useState } from "react";

const HANGUP_RED = "#F3373A";
const SPEAKER_ON = "#FFFFFF";
const CONTROL_OFF = "#2F2F2F";

function formatCallClock(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) return `${hours}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

function EarpieceIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M8.2 3.2h7.6A2.2 2.2 0 0 1 18 5.4v13.2a2.2 2.2 0 0 1-2.2 2.2H8.2A2.2 2.2 0 0 1 6 18.6V5.4a2.2 2.2 0 0 1 2.2-2.2Zm2.1 2.1h3.4a.85.85 0 0 1 0 1.7h-3.4a.85.85 0 1 1 0-1.7ZM12 17.2a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3Z" />
    </svg>
  );
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M3.5 8.75h3.2L11 5.2v13.6l-4.3-3.55H3.5A1.25 1.25 0 0 1 2.25 14V10c0-.69.56-1.25 1.25-1.25Z" />
      <path d="M14.4 8.35a3.6 3.6 0 0 1 0 7.3 1 1 0 1 0 .9 1.79 5.6 5.6 0 0 0 0-10.88 1 1 0 1 0-.9 1.79Z" />
      <path d="M16.55 5.4a6.85 6.85 0 0 1 0 13.2 1 1 0 1 0 .9 1.79 8.85 8.85 0 0 0 0-16.78 1 1 0 1 0-.9 1.79Z" />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <rect x="9" y="3.2" width="6" height="11.2" rx="3" />
      <path d="M6.2 11.2a1 1 0 0 1 2 0 3.8 3.8 0 0 0 7.6 0 1 1 0 1 1 2 0 5.8 5.8 0 0 1-4.8 5.7V19h2.3a1 1 0 1 1 0 2H8.7a1 1 0 1 1 0-2h2.3v-2.1a5.8 5.8 0 0 1-4.8-5.7Z" />
    </svg>
  );
}

export function WebCallConnectedScreen({
  name,
  photoUrl,
  muted,
  speakerOn,
  onToggleMute,
  onToggleSpeaker,
  onHangUp,
}: {
  name: string;
  photoUrl?: string;
  muted: boolean;
  speakerOn: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onHangUp: () => void;
}) {
  const initial = (name.trim().slice(0, 1) || "?").toUpperCase();
  const [photoFailed, setPhotoFailed] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setPhotoFailed(false);
  }, [photoUrl]);

  useEffect(() => {
    const started = Date.now();
    setElapsed(0);
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const showPhoto = Boolean(photoUrl) && !photoFailed;

  return (
    <div className="relative flex h-dvh max-h-dvh flex-col overflow-hidden overscroll-none bg-[#4a1c18] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {showPhoto ? (
          <img
            src={photoUrl}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setPhotoFailed(true)}
            className="h-full w-full object-cover object-[center_28%]"
            style={{
              transform: "scale(3.4)",
              transformOrigin: "center 28%",
              filter: "blur(2px) saturate(1.05)",
            }}
          />
        ) : null}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <p className="pt-[max(1.75rem,env(safe-area-inset-top))] text-center text-[18px] font-medium tabular-nums tracking-[0.4px]">
          {formatCallClock(elapsed)}
        </p>

        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="relative flex h-[320px] w-[320px] items-center justify-center">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.22) 48%, transparent 70%)",
              }}
            />
            {showPhoto ? (
              <img
                src={photoUrl}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setPhotoFailed(true)}
                className="relative z-10 h-[168px] w-[168px] rounded-full object-cover"
              />
            ) : (
              <div className="relative z-10 flex h-[168px] w-[168px] items-center justify-center rounded-full bg-white/20 text-4xl font-semibold">
                {initial}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center pb-[max(1.75rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-8 rounded-full bg-black px-6 py-3.5">
            <button
              type="button"
              onClick={onToggleSpeaker}
              aria-label={speakerOn ? "Switch to earpiece" : "Switch to speaker"}
              aria-pressed={speakerOn}
              className="flex h-[60px] w-[60px] items-center justify-center rounded-full"
              style={{
                backgroundColor: speakerOn ? SPEAKER_ON : CONTROL_OFF,
                color: speakerOn ? CONTROL_OFF : "#FFFFFF",
              }}
            >
              {speakerOn ? (
                <SpeakerIcon className="h-7 w-7" />
              ) : (
                <EarpieceIcon className="h-7 w-7" />
              )}
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? "Unmute microphone" : "Mute microphone"}
              aria-pressed={muted}
              className="relative flex h-[60px] w-[60px] items-center justify-center rounded-full"
              style={{
                backgroundColor: muted ? HANGUP_RED : CONTROL_OFF,
                color: "#FFFFFF",
              }}
            >
              <MicIcon className="h-7 w-7" />
              {muted ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                >
                  <span className="h-[2px] w-8 rotate-[-32deg] rounded-full bg-white" />
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={onHangUp}
              aria-label="End call"
              className="flex h-[60px] w-[60px] items-center justify-center rounded-full"
              style={{ backgroundColor: HANGUP_RED }}
            >
              <img
                src="/web-call/phone-decline.svg"
                alt=""
                className="h-7 w-7"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
