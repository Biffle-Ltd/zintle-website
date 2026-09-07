import React from "react";
import { WebviewSkeletonHtml } from "./WebviewSkeletonHtml";

export function WelcomeBackOfferSkeleton() {
  return (
    <WebviewSkeletonHtml html={window.__ZNW?.welcomeSkeletonHtml() ?? ""} />
  );
}
