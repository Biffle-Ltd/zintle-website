import React, { useEffect, useState } from "react";

const ACCEPT_GREEN = "#16A34A";
const DECLINE_RED = "#FF3B30";

export function WebCallAutoCallTrigger({
  name,
  photoUrl,
  onAccept,
  busy = false,
  status = null,
  loading = false,
}: {
  name: string;
  photoUrl: string;
  onAccept: () => void;
  busy?: boolean;
  status?: string | null;
  loading?: boolean;
}) {
  const [photoFailed, setPhotoFailed] = useState(false);
  useEffect(() => {
    setPhotoFailed(false);
  }, [photoUrl]);
  const showPhoto = Boolean(photoUrl) && !photoFailed;

  return (
    <div className="relative flex h-dvh max-h-dvh flex-col items-center justify-center overflow-hidden overscroll-none bg-white px-4 py-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[-45%] rotate-[-18deg]"
        style={{
          backgroundImage: "url(/web-call/biffle-ff.svg)",
          backgroundRepeat: "repeat",
          backgroundSize: "110px 122px",
        }}
      />
      <div className="relative z-10 flex w-full max-w-[340px] flex-col items-center">
        <div
          role="img"
          aria-label="Biffle"
          className="mb-[clamp(0.75rem,2.4svh,1.25rem)] shrink-0"
          style={{
            width: "clamp(78px, 22vw, 104px)",
            height: "clamp(32px, 8vw, 44px)",
            backgroundColor: "#6D28D9",
            WebkitMaskImage: "url(/web-call/biffle-wordmark.png)",
            maskImage: "url(/web-call/biffle-wordmark.png)",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
            WebkitMaskSize: "contain",
            maskSize: "contain",
          }}
        />
      <div className="w-full overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
        <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
          {loading ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-700" />
            </div>
          ) : showPhoto ? (
            <img
              src={photoUrl}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setPhotoFailed(true)}
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl text-neutral-400">
              {name.slice(0, 1) || "?"}
            </div>
          )}
        </div>
        <div className="px-5 pb-5 pt-4 text-center">
          <p className="text-[20px] font-semibold leading-tight text-neutral-900">
            {loading ? "Connecting" : name || "Creator"}
          </p>
          <p className="mt-1 text-[14px] text-neutral-500">
            is waiting to connect
          </p>
          {status ? (
            <p className="mt-2 text-[12px] text-neutral-400">{status}</p>
          ) : null}
          <div className="mt-4 flex items-center gap-3">
            {/* Decline is visual-only so the whale path stays on Accept. */}
            <button
              type="button"
              aria-label="Decline"
              tabIndex={-1}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: DECLINE_RED }}
            >
              <img
                src="/web-call/phone-decline.svg"
                alt=""
                className="h-6 w-6"
              />
            </button>
            <button
              type="button"
              data-web-call-accept=""
              disabled={busy || loading}
              onClick={onAccept}
              className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full text-[16px] font-semibold text-white transition-opacity duration-150 active:opacity-60 disabled:opacity-60"
              style={{ backgroundColor: ACCEPT_GREEN }}
            >
              <img
                src="/web-call/phone-accept.svg"
                alt=""
                className="h-5 w-5"
              />
              Accept
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
