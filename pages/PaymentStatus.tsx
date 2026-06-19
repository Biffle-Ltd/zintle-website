import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { PaymentStatusPopup } from "../components/PaymentStatusPopup";
import { getPaymentGatewayFromUrl } from "../utils/paymentGateway";
import { HOST } from "../utils/host";
import { headerSafeToken } from "../utils/headerSafeToken";
import {
  DEFAULT_ORGANISATION_ID,
  getOrganisationIdFromSearch,
} from "../utils/organisationIdFromUrl";
import { getJwtFromStorage } from "../utils/authStorage";

type ValidateRow = {
  payment_status?: string;
};

function pickValidatePayload(json: unknown): ValidateRow | null {
  if (!json || typeof json !== "object") return null;
  const rec = json as Record<string, unknown>;
  const inner = rec.data ?? rec.date;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return inner as ValidateRow;
  }
  return null;
}

function normalizePaymentStatus(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

/**
 * Payment return URL: `/payment-status?order_uuid=<uuid>&organisation_id=<org>`.
 * Supports legacy `order_id` for PhonePe redirects.
 */
export const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const orderUuid =
    searchParams.get("order_uuid")?.trim() ??
    searchParams.get("order_id")?.trim() ??
    "";
  const organisationId = useMemo(
    () =>
      getOrganisationIdFromSearch(
        `?${searchParams.toString()}`,
        location.pathname,
      ),
    [searchParams, location.pathname],
  );

  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!orderUuid) {
        if (!cancelled) {
          setStatus("UNKNOWN");
          setLoading(false);
        }
        return;
      }

      const gateway = getPaymentGatewayFromUrl(location.search);
      const rawToken = getJwtFromStorage(organisationId);
      const jwtToken = headerSafeToken(rawToken);

      try {
        if (gateway === "Easebuzz") {
          const r = await fetch(
            `${HOST}/api/v1.2/monetization/easebuzz/payment/validate/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Organisation-ID": organisationId || DEFAULT_ORGANISATION_ID,
                ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
              },
              body: JSON.stringify({ order_uuid: orderUuid }),
            },
          );

          const json = await r.json().catch(() => null);
          const row = pickValidatePayload(json);
          const paymentStatus = normalizePaymentStatus(row?.payment_status);

          if (!cancelled) {
            setStatus(paymentStatus || "UNKNOWN");
          }
          return;
        }

        const url = new URL(
          `${HOST}/api/v1/monetization/phonepe/payment/validate/`,
        );
        url.searchParams.set("order_id", orderUuid);

        const r = await fetch(url.toString(), {
          method: "GET",
          headers: {
            "X-Organisation-ID": organisationId || DEFAULT_ORGANISATION_ID,
          },
        });

        const json = await r.json().catch(() => null);
        const row = pickValidatePayload(json);
        const paymentStatus = normalizePaymentStatus(row?.payment_status);

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
  }, [orderUuid, organisationId, location.search]);

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
