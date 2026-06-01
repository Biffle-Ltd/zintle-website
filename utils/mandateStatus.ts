/** Mandate object returned by GET …/mandate/status/ */
export type MandateStatusData = {
  id: number;
  mandate_uuid: string;
  payment_gateway: string;
  pg_mandate_id: string;
  mandate_state: string;
  organisation_id: string;
  pg_info?: {
    state?: string;
    amount?: number;
    order_id?: string;
    intent_url?: string;
    redirect_url?: string;
    [key: string]: unknown;
  };
};

/** Backend `MandateState` enum values. */
export const MandateState = {
  INITIATED: "INITIATED",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  REVOKED: "REVOKED",
  PAUSED: "PAUSED",
  UNKNOWN: "UNKNOWN",
} as const;

export type MandateStateValue = (typeof MandateState)[keyof typeof MandateState];

type MandateStatusApiResponse = {
  success: boolean;
  data: MandateStatusData | null;
  error_message?: string;
  success_message?: string | null;
  organisation_id?: string;
};

export const MANDATE_STATUS_POLL_INTERVAL_MS = 10_000;

export function normalizeMandateState(state: string): MandateStateValue | string {
  return state.trim().toUpperCase();
}

export function isMandateInitiated(state: string): boolean {
  return normalizeMandateState(state) === MandateState.INITIATED;
}

export function isMandateActive(state: string): boolean {
  return normalizeMandateState(state) === MandateState.ACTIVE;
}

export function isMandateFailure(state: string): boolean {
  const s = normalizeMandateState(state);
  return (
    s === MandateState.INACTIVE ||
    s === MandateState.REVOKED ||
    s === MandateState.PAUSED ||
    s === MandateState.UNKNOWN
  );
}

export async function fetchMandateStatus(params: {
  host: string;
  mandateId: number;
  authToken: string | null;
  organisationId: string;
}): Promise<MandateStatusData> {
  const { host, mandateId, authToken, organisationId } = params;

  const r = await fetch(
    `${host}/api/v1/monetization/subscriptions/mandate/status/?mandate_id=${mandateId}`,
    {
      method: "GET",
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        "X-Organisation-ID": organisationId,
      },
    },
  );

  const body = (await r.json()) as MandateStatusApiResponse;
  if (!r.ok || !body.success || !body.data) {
    throw new Error(body.error_message ?? "Failed to fetch mandate status");
  }
  return body.data;
}
