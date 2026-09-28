/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EASEBUZZ_KEY?: string;
  readonly VITE_EASEBUZZ_ENV?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_API_HOST?: string;
  readonly VITE_AGORA_APP_ID?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

type EasebuzzCheckoutOptions = {
  access_key: string;
  onResponse: () => void;
  theme?: string;
};

interface EasebuzzCheckoutInstance {
  initiatePayment: (options: EasebuzzCheckoutOptions) => void;
}

interface EasebuzzCheckoutConstructor {
  new (
    merchantKey: string,
    env: string | undefined,
  ): EasebuzzCheckoutInstance;
}

interface PhonePeCheckoutApi {
  transact: (options: {
    tokenUrl: string;
    type: "IFRAME" | "REDIRECT";
    callback: (response: "USER_CANCEL" | "CONCLUDED") => void;
  }) => void;
  closePage?: () => void;
}

interface ReactNativeWebViewBridge {
  postMessage: (message: string) => void;
}

interface GoogleCredentialResponse {
  credential?: string;
}

interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: GoogleCredentialResponse) => void;
        }) => void;
        renderButton: (
          parent: HTMLElement,
          options: Record<string, string | number>,
        ) => void;
      };
    };
  };
  EasebuzzCheckout?: EasebuzzCheckoutConstructor;
  PhonePeCheckout?: PhonePeCheckoutApi;
  ReactNativeWebView?: ReactNativeWebViewBridge;
  __ZNW?: {
    HOST: string;
    bootHead: () => void;
    bootPaint: () => void;
    ensureFontAwesome?: () => void;
    coinsSkeletonHtml: (opts?: { biffle?: boolean; qr?: boolean }) => string;
    welcomeSkeletonHtml: () => string;
    subscriptionsSkeletonHtml: (opts?: {
      showPaymentMethods?: boolean;
      embedded?: boolean;
    }) => string;
  };
  __ZNW_BOOT?: {
    coins: boolean;
    biffle: boolean;
    qr: boolean;
    welcome: boolean;
    subscriptions: boolean;
    webview: boolean;
    hasAuth: boolean;
    isCampaign: boolean;
  };
  __ZNW_COIN_PACKS?: {
    organisationId: string;
    promise: Promise<Response>;
    consumed?: boolean;
    hasAuth?: boolean;
  };
  __ZNW_USER_DETAILS?: {
    organisationId: string;
    promise: Promise<Response>;
    consumed?: boolean;
    hasAuth?: boolean;
  };
  __ZNW_SUBSCRIPTION_PACKS?: {
    organisationId: string;
    promise: Promise<Response>;
    consumed?: boolean;
    hasAuth?: boolean;
  };
  __ZNW_WELCOME_BACK?: {
    organisationId: string;
    promise: Promise<Response>;
    consumed?: boolean;
    hasAuth?: boolean;
  };
  __ZNW_PLAN_DETAILS?: {
    organisationId: string;
    planId: string;
    promise: Promise<Response>;
    consumed?: boolean;
    hasAuth?: boolean;
  };
}
