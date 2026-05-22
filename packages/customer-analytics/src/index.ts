export const CustomerAnalyticsEvents = {
  AppOpened: 'customer_app_opened',
  LoginStarted: 'customer_login_started',
  LoginCompleted: 'customer_login_completed',
  LocationSelected: 'customer_location_selected',
  ProductViewed: 'customer_product_viewed',
  VendorViewed: 'customer_vendor_viewed',
  SearchSubmitted: 'customer_search_submitted',
  CartItemAdded: 'customer_cart_item_added',
  CartItemUpdated: 'customer_cart_item_updated',
  CouponApplied: 'customer_coupon_applied',
  CheckoutStarted: 'customer_checkout_started',
  PaymentStarted: 'customer_payment_started',
  PaymentCompleted: 'customer_payment_completed',
  OrderPlaced: 'customer_order_placed',
  OrderCancelled: 'customer_order_cancelled',
  SupportIssueCreated: 'customer_support_issue_created',
} as const;

export type CustomerAnalyticsEventName = typeof CustomerAnalyticsEvents[keyof typeof CustomerAnalyticsEvents];

export interface CustomerAnalyticsPayloads {
  [CustomerAnalyticsEvents.AppOpened]: { platform: 'web' | 'ios' | 'android' | 'mobile-web'; appVersion?: string };
  [CustomerAnalyticsEvents.LoginStarted]: { method: 'otp' | 'password' };
  [CustomerAnalyticsEvents.LoginCompleted]: { method: 'otp' | 'password'; userId: string };
  [CustomerAnalyticsEvents.LocationSelected]: { source: 'gps' | 'manual' | 'saved_address'; city?: string; state?: string };
  [CustomerAnalyticsEvents.ProductViewed]: { productId: string; vendorId?: string; source?: string };
  [CustomerAnalyticsEvents.VendorViewed]: { vendorId: string; source?: string };
  [CustomerAnalyticsEvents.SearchSubmitted]: { query: string; resultCount?: number };
  [CustomerAnalyticsEvents.CartItemAdded]: { productId: string; vendorId?: string; quantity: number; price?: number };
  [CustomerAnalyticsEvents.CartItemUpdated]: { productId: string; quantity: number };
  [CustomerAnalyticsEvents.CouponApplied]: { code: string; discount?: number };
  [CustomerAnalyticsEvents.CheckoutStarted]: { cartTotal: number; itemCount: number };
  [CustomerAnalyticsEvents.PaymentStarted]: { method: string; amount: number };
  [CustomerAnalyticsEvents.PaymentCompleted]: { method: string; amount: number; orderId?: string };
  [CustomerAnalyticsEvents.OrderPlaced]: { orderId: string; total: number; paymentMethod: string };
  [CustomerAnalyticsEvents.OrderCancelled]: { orderId: string; reason?: string };
  [CustomerAnalyticsEvents.SupportIssueCreated]: { orderId?: string; issueType: string };
}

export type CustomerAnalyticsEvent<TName extends CustomerAnalyticsEventName = CustomerAnalyticsEventName> = {
  [Name in CustomerAnalyticsEventName]: {
    name: Name;
    payload: CustomerAnalyticsPayloads[Name];
  }
}[TName];

export interface AnalyticsAdapter {
  track<TName extends CustomerAnalyticsEventName>(event: CustomerAnalyticsEvent<TName>): void | Promise<void>;
}

export const noopAnalyticsAdapter: AnalyticsAdapter = {
  track: () => undefined,
};

export function createAnalytics(adapter: AnalyticsAdapter = noopAnalyticsAdapter) {
  return {
    track<TName extends CustomerAnalyticsEventName>(name: TName, payload: CustomerAnalyticsPayloads[TName]) {
      return adapter.track({ name, payload } as CustomerAnalyticsEvent<TName>);
    },
  };
}
