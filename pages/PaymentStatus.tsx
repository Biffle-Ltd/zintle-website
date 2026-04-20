import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PaymentStatusPopup } from "../components/PaymentStatusPopup";
import { HOST } from "../utils/host";
import { headerSafeToken } from "../utils/headerSafeToken";
import {
  DEFAULT_ORGANISATION_ID,
  getOrganisationIdFromSearch,
} from "../utils/organisationIdFromUrl";

type PhonePeValidateRow = {
  payment_status?: string;
};

function pickValidatePayload(json: any): PhonePeValidateRow | null {
  if (!json || typeof json !== "object") return null;
  const inner = json.data ?? json.date;
  if (inner && typeof inner === "object") return inner as PhonePeValidateRow;
  return null;
}

/**
 * PhonePe return URL: `/payment-status?order_id=<id>&organisation_id=<org>`.
 * Validates payment and shows the same status modal as /coins.
 */
export const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderId = searchParams.get("order_id")?.trim() ?? "";
  const organisationId = useMemo(
    () => getOrganisationIdFromSearch(`?${searchParams.toString()}`),
    [searchParams],
  );

  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!orderId) {
        if (!cancelled) {
          setStatus("UNKNOWN");
          setLoading(false);
        }
        return;
      }

      const rawToken = localStorage.getItem("zintle_jwt");
      const jwtToken = headerSafeToken(rawToken);

      try {
        const url = new URL(
          `${HOST}/api/v1/monetization/phonepe/payment/validate/`,
        );
        url.searchParams.set("order_id", orderId);

        const r = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "X-Organisation-ID": organisationId || DEFAULT_ORGANISATION_ID,
            // ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
          },
        });

        const json = await r.json().catch(() => null);
        const row = pickValidatePayload(json);
        const paymentStatus =
          typeof row?.payment_status === "string"
            ? row.payment_status.trim().toUpperCase()
            : "";

        if (!cancelled) {
          setStatus(paymentStatus || "UNKNOWN");
        }
      } catch {
        if (!cancelled) setStatus("UNKNOWN");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [orderId, organisationId]);

  const handleClose = () => {
    const q = new URLSearchParams();
    if (organisationId && organisationId !== DEFAULT_ORGANISATION_ID) {
      q.set("organisation_id", organisationId);
    }
    const suffix = q.toString() ? `?${q.toString()}` : "";
    navigate(`/coins${suffix}`);
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-6">
      {loading && (
        <div className="text-brand-muted text-sm flex items-center gap-2">
          <i className="fa-solid fa-spinner fa-spin" aria-hidden />
          Checking payment…
        </div>
      )}
      {!loading && status && (
        <PaymentStatusPopup status={status} onClose={handleClose} />
      )}
    </div>
  );
};
