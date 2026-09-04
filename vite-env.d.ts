/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EASEBUZZ_KEY?: string;
  readonly VITE_EASEBUZZ_ENV?: string;
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

interface Window {
  EasebuzzCheckout?: EasebuzzCheckoutConstructor;
  PhonePeCheckout?: PhonePeCheckoutApi;
  ReactNativeWebView?: ReactNativeWebViewBridge;
}
