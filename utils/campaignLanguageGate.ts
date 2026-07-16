import type { NavigateFunction } from "react-router-dom";
import { isBiffleOrganisationId } from "./organisationIdFromUrl";
import {
  buildCampaignLanguagePath,
  CAMPAIGN_LANGUAGE_REDIRECT_KEY,
} from "./postLoginRedirect";
import {
  fetchUserDetails,
  userNeedsLanguageSelection,
} from "./userProfileApi";

export type CampaignLanguageGateResult = "checkout" | "language";

/** Skip duplicate get-user-details when checkout gate already ran upstream. */
const CAMPAIGN_LANGUAGE_GATE_PASSED_KEY =
  "zintle_campaign_language_gate_passed";

/** Language selection is mandatory only for Biffle campaign checkout. */
export function isBiffleCampaignLanguageFlow(organisationId: string): boolean {
  return isBiffleOrganisationId(organisationId);
}

function searchFromRelativePath(path: string): string {
  const idx = path.indexOf("?");
  return idx >= 0 ? path.slice(idx) : "";
}

/** Call before navigating to campaign checkout after language is confirmed. */
export function markCampaignLanguageGatePassed(organisationId: string): void {
  sessionStorage.setItem(CAMPAIGN_LANGUAGE_GATE_PASSED_KEY, organisationId);
}

/** Returns true once per navigation if upstream already verified language. */
export function consumeCampaignLanguageGatePassed(
  organisationId: string,
): boolean {
  const passed = sessionStorage.getItem(CAMPAIGN_LANGUAGE_GATE_PASSED_KEY);
  if (passed !== organisationId) return false;
  sessionStorage.removeItem(CAMPAIGN_LANGUAGE_GATE_PASSED_KEY);
  return true;
}

export async function resolveCampaignLanguageGate(opts: {
  token: string;
  organisationId: string;
  checkoutPath: string;
}): Promise<CampaignLanguageGateResult> {
  if (!isBiffleCampaignLanguageFlow(opts.organisationId)) {
    return "checkout";
  }

  const details = await fetchUserDetails(opts.token, opts.organisationId);
  if (userNeedsLanguageSelection(details)) {
    sessionStorage.setItem(CAMPAIGN_LANGUAGE_REDIRECT_KEY, opts.checkoutPath);
    return "language";
  }
  return "checkout";
}

/**
 * Post-login campaign navigation: Biffle only — language screen when needed, otherwise checkout.
 * Zintle campaign flows navigate straight to checkout (unchanged).
 */
export async function navigateAfterCampaignLoginGate(opts: {
  checkoutPath: string;
  token: string;
  organisationId: string;
  navigate: NavigateFunction;
  languageSearchQuery?: string;
}): Promise<void> {
  if (!isBiffleCampaignLanguageFlow(opts.organisationId)) {
    opts.navigate(opts.checkoutPath);
    return;
  }

  const languageSearch =
    opts.languageSearchQuery ?? searchFromRelativePath(opts.checkoutPath);

  const goToLanguageScreen = () => {
    sessionStorage.setItem(CAMPAIGN_LANGUAGE_REDIRECT_KEY, opts.checkoutPath);
    opts.navigate(buildCampaignLanguagePath(languageSearch));
  };

  try {
    const gate = await resolveCampaignLanguageGate({
      token: opts.token,
      organisationId: opts.organisationId,
      checkoutPath: opts.checkoutPath,
    });
    if (gate === "language") {
      opts.navigate(buildCampaignLanguagePath(languageSearch));
      return;
    }
    markCampaignLanguageGatePassed(opts.organisationId);
    opts.navigate(opts.checkoutPath);
  } catch (err) {
    console.error("[Campaign] Language gate failed", err);
    goToLanguageScreen();
  }
}

/** Blocks Biffle campaign checkout until the user has a saved language. */
export async function resolveCampaignSubscriptionsLanguageGate(opts: {
  token: string;
  organisationId: string;
  checkoutPath: string;
  languageSearchQuery: string;
  navigate: NavigateFunction;
}): Promise<"allowed" | "redirecting"> {
  if (!isBiffleCampaignLanguageFlow(opts.organisationId)) {
    return "allowed";
  }

  if (consumeCampaignLanguageGatePassed(opts.organisationId)) {
    return "allowed";
  }

  try {
    const gate = await resolveCampaignLanguageGate({
      token: opts.token,
      organisationId: opts.organisationId,
      checkoutPath: opts.checkoutPath,
    });
    if (gate === "language") {
      opts.navigate(buildCampaignLanguagePath(opts.languageSearchQuery), {
        replace: true,
      });
      return "redirecting";
    }
    markCampaignLanguageGatePassed(opts.organisationId);
    return "allowed";
  } catch (err) {
    console.error("[Subscriptions] Campaign language gate failed", err);
    sessionStorage.setItem(CAMPAIGN_LANGUAGE_REDIRECT_KEY, opts.checkoutPath);
    opts.navigate(buildCampaignLanguagePath(opts.languageSearchQuery), {
      replace: true,
    });
    return "redirecting";
  }
}

export function getCampaignLanguageCheckoutRedirect(): string | null {
  return sessionStorage.getItem(CAMPAIGN_LANGUAGE_REDIRECT_KEY);
}

export function clearCampaignLanguageCheckoutRedirect(): void {
  sessionStorage.removeItem(CAMPAIGN_LANGUAGE_REDIRECT_KEY);
}
