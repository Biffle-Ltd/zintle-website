const CAMPAIGN_PATH = "/campaign";

let plantedHref = "";

type CampaignExit = "none" | "guilt";

function campaignPathname(): string {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function historyBase(): Record<string, unknown> {
  const current = window.history.state as Record<string, unknown> | null;
  return current && typeof current === "object" ? { ...current } : {};
}

/**
 * One extra entry on this exact URL, planted once.
 * First back lands on the guilt entry. The next back leaves the page.
 */
export function plantCampaignBackStops(): void {
  if (typeof window === "undefined") return;
  if (campaignPathname() !== CAMPAIGN_PATH) return;
  const href = window.location.href;
  if (plantedHref === href) return;
  plantedHref = href;
  try {
    const base = historyBase();
    const idx = typeof base.idx === "number" ? base.idx : 0;
    window.history.replaceState({ ...base, campaignExit: "guilt" }, "", href);
    window.history.pushState(
      { ...base, idx: idx + 1, campaignExit: "none" },
      "",
      href,
    );
  } catch {
    plantedHref = "";
  }
}

export function readCampaignExitSheet(): CampaignExit {
  if (typeof window === "undefined") return "none";
  const state = window.history.state as { campaignExit?: unknown } | null;
  if (state?.campaignExit === "guilt") return "guilt";
  return "none";
}

/** Fires only while the address is still the free-trial page. */
export function listenCampaignBack(onBack: () => void): () => void {
  const onPop = () => {
    if (campaignPathname() !== CAMPAIGN_PATH) return;
    onBack();
  };
  window.addEventListener("popstate", onPop);
  return () => window.removeEventListener("popstate", onPop);
}
