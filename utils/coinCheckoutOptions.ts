export type AfterCheckoutPollResult = {
  status: string | undefined;
  timedOut: boolean;
};

export type CreateOrderPixelOptions = {
  trackCoinPixels?: boolean;
  pixelContext?: unknown;
  coinPack?: {
    id: number;
    name?: string;
    price: number;
    coins: number;
    bonus_coins?: number;
  };
  onCheckoutClosed?: () => void;
  suppressPaymentStatusPopup?: boolean;
  onAfterCheckoutPoll?: (
    result: AfterCheckoutPollResult,
  ) => void | Promise<void>;
};

export type CreateOrderPaymentResult = {
  order?: unknown;
  payment?: unknown;
  checkoutLaunched: boolean;
};

export type CreateOrderAndInitiatePaymentFn = (
  coinPackId: number | string,
  token?: string | null,
  options?: CreateOrderPixelOptions & Record<string, unknown>,
  organisationId?: string,
) => Promise<CreateOrderPaymentResult>;
