import React from "react";

export function WebviewSkeletonHtml({ html }: { html: string }) {
  if (!html) return null;
  return (
    <div
      style={{ display: "contents" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
