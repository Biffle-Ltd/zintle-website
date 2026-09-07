import React from "react";
import { WebviewSkeletonHtml } from "./WebviewSkeletonHtml";

export function SubscriptionsSkeleton({
  showPaymentMethods = true,
  embedded = false,
}: {
  showPaymentMethods?: boolean;
  embedded?: boolean;
}) {
  return (
    <WebviewSkeletonHtml
      html={
        window.__ZNW?.subscriptionsSkeletonHtml({
          showPaymentMethods,
          embedded,
        }) ?? ""
      }
    />
  );
}
