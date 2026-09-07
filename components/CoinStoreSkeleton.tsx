import React from "react";
import { WebviewSkeletonHtml } from "./WebviewSkeletonHtml";

type CoinStoreSkeletonProps = {
  isBiffle: boolean;
  quickRecharge?: boolean;
};

export function CoinStoreSkeleton({
  isBiffle,
  quickRecharge = false,
}: CoinStoreSkeletonProps) {
  return (
    <WebviewSkeletonHtml
      html={
        window.__ZNW?.coinsSkeletonHtml({
          biffle: isBiffle,
          qr: quickRecharge,
        }) ?? ""
      }
    />
  );
}
