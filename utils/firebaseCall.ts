import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";
import { HOST } from "./host";
import { headerSafeToken } from "./headerSafeToken";
import { fetchUserDetails, type UserDetailsData } from "./userProfileApi";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function firebaseWebConfigMissing(): string | null {
  const missing = [
    ["VITE_FIREBASE_API_KEY", import.meta.env.VITE_FIREBASE_API_KEY],
    ["VITE_FIREBASE_APP_ID", import.meta.env.VITE_FIREBASE_APP_ID],
  ].filter(([, value]) => !String(value || "").trim());
  if (!missing.length) return null;
  return `Firebase web config is missing: ${missing.map(([name]) => name).join(", ")}`;
}

function firestoreDb(): Firestore {
  const missing = firebaseWebConfigMissing();
  if (missing) throw new Error(missing);
  if (!db) {
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || "biffle-89bb3";
    app = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain:
        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
        `${projectId}.firebaseapp.com`,
      projectId,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      storageBucket:
        import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
        `${projectId}.appspot.com`,
    });
    db = getFirestore(app);
  }
  return db;
}

function uidFromToken(token: string): number | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))) as {
      uid?: number;
    };
    const uid = Number(json.uid);
    return Number.isInteger(uid) && uid > 0 ? uid : null;
  } catch {
    return null;
  }
}

export type CallDocFields = {
  userId: string;
  agoraToken: string;
  agoraChannel: string;
  status: "incoming";
  call_type: "audio" | "video";
  /** Distinguishes browser calls from app calls. The app omits this field. */
  source: "web";
  user: Record<string, unknown>;
  userSessionId: string;
};

function asInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

/** `{id, code, name, is_active}` — the same shape as `Language.to_dict()` on app call docs. */
function callerLanguages(details: UserDetailsData): Array<Record<string, unknown>> {
  if (!Array.isArray(details.languages)) return [];
  return details.languages.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const item = row as Record<string, unknown>;
    const id = asInt(item.id);
    const code = item.code != null ? String(item.code) : "";
    const name = item.name != null ? String(item.name) : "";
    if (id == null || !code) return [];
    return [{ id, code, name, is_active: item.is_active !== false }];
  });
}

/** Same `user` map the app writes from profile `to_dict()`, plus nulls for empty fields. */
function callerUserMap(details: UserDetailsData, fallbackId: number): Record<string, unknown> {
  const id = asInt(details.id) || fallbackId;
  const createdAt = details.created_at;
  return {
    id,
    email: details.email ?? null,
    username: details.username ?? "",
    phone_number: asInt(details.phone_number),
    country_code: asInt(details.country_code),
    country_iso: details.country_iso ?? null,
    first_name: details.first_name ?? "",
    last_name: details.last_name ?? "",
    profile_pic: details.profile_pic ?? "",
    is_member: Boolean(details.is_member),
    is_onboarded: Boolean(details.is_onboarded),
    creator_id: asInt(details.creator_id),
    is_authenticated: true,
    status: details.status ?? "offline",
    age: asInt(details.age),
    gender: details.gender ?? null,
    dob: details.dob ?? null,
    is_demo: Boolean(details.is_demo),
    organisation_id: details.organisation_id ?? "",
    fcm_token: details.fcm_token ?? null,
    has_fcm_token: Boolean(details.has_fcm_token),
    reward_claims_count: asInt(details.reward_claims_count) ?? 0,
    languages: callerLanguages(details),
    created_at: typeof createdAt === "string" ? createdAt : createdAt ?? null,
  };
}

async function callerProfile(
  authToken: string,
  organisationId: string,
  preloaded?: UserDetailsData,
) {
  const details =
    preloaded ??
    (await fetchUserDetails(authToken, organisationId).catch(
      (): UserDetailsData => ({}),
    ));
  return callerUserMap(details, uidFromToken(authToken) || 0);
}

/** Write calls/{id} the same way the app does, then ask the backend to send FCM. */
export async function createIncomingCallDoc(opts: {
  organisationId: string;
  authToken: string;
  creatorId: number;
  sessionId: string;
  channelName: string;
  agoraToken: string;
  callType: "audio" | "video";
  /** Reuse profile from the room gate so we do not hit get-user-details twice. */
  userDetails?: UserDetailsData;
}): Promise<string> {
  const user = await callerProfile(
    opts.authToken,
    opts.organisationId,
    opts.userDetails,
  );
  const fields: CallDocFields = {
    userId: String(opts.creatorId),
    agoraToken: opts.agoraToken,
    agoraChannel: opts.channelName,
    status: "incoming",
    call_type: opts.callType,
    user,
    userSessionId: opts.sessionId,
    source: "web",
  };
  const ref = await addDoc(collection(firestoreDb(), "calls"), {
    ...fields,
    createdAt: serverTimestamp(),
  });
  try {
    await sendCallNotification({
      organisationId: opts.organisationId,
      authToken: opts.authToken,
      docId: ref.id,
      type: "initiate_call",
      title: "Incoming call",
      body: "Someone is calling you",
      payload: fields,
    });
  } catch {
    /* FCM can fail; the room still owns this doc id and can disconnect it. */
  }
  return ref.id;
}

export async function disconnectCallDoc(opts: {
  organisationId: string;
  authToken: string;
  docId: string;
  creatorId: number;
}): Promise<void> {
  await updateDoc(doc(firestoreDb(), "calls", opts.docId), {
    status: "disconnected",
  });
  await sendCallNotification({
    organisationId: opts.organisationId,
    authToken: opts.authToken,
    docId: opts.docId,
    type: "disconnect_call",
    title: "Call ended",
    body: "The call was disconnected",
    payload: { status: "disconnected", userId: String(opts.creatorId) },
  });
}

export function watchCallChannel(
  channelName: string,
  onDoc: (data: { status?: string; ringingAt?: unknown }) => void,
  opts?: { docId?: string },
): () => void {
  if (opts?.docId) {
    return onSnapshot(doc(firestoreDb(), "calls", opts.docId), (snap) => {
      if (!snap.exists()) return;
      onDoc(snap.data() as { status?: string; ringingAt?: unknown });
    });
  }
  const calls = query(
    collection(firestoreDb(), "calls"),
    where("agoraChannel", "==", channelName),
  );
  return onSnapshot(calls, (snap) => {
    snap.forEach((row) =>
      onDoc(row.data() as { status?: string; ringingAt?: unknown }),
    );
  });
}

async function sendCallNotification(opts: {
  organisationId: string;
  authToken: string;
  docId: string;
  type: "initiate_call" | "disconnect_call";
  title: string;
  body: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  const token = headerSafeToken(opts.authToken);
  await fetch(`${HOST}/api/v1/call_manager/call/send-call-notification/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-Organisation-ID": opts.organisationId,
    },
    body: JSON.stringify({
      collection: "calls",
      doc_id: opts.docId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      payload: opts.payload,
    }),
  });
}
