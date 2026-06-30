export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(tokens: { access?: string; refresh?: string | null }): Promise<void>;
  clearTokens(): Promise<void>;
}

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface ConfigAdapter {
  get(key: string): string | undefined;
}

export interface DeviceInfoAdapter<DeviceInfo = unknown> {
  getDeviceInfo(): Promise<DeviceInfo>;
}

export interface WebSocketAdapter<Socket = unknown> {
  connect(url: string, protocols?: string | string[]): Socket;
}

export interface LoggerAdapter {
  debug?(message: string, context?: unknown): void;
  warn?(message: string, context?: unknown): void;
  error?(message: string, context?: unknown): void;
}

export interface PaymentAdapter<Init = unknown, Result = unknown> {
  open(payment: Init, description: string, user?: unknown): Promise<Result>;
}

export interface LocationAdapter<Location = unknown> {
  getCurrentLocation(): Promise<Location | null>;
}

export interface NotificationAdapter {
  registerDeviceToken(): Promise<string | null>;
}

export interface PlatformConfig {
  apiBaseUrl: string;
  requestTimeoutMs?: number;
}

export interface HttpRequestInput {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
}

export interface HttpTransport {
  request<T>(input: HttpRequestInput): Promise<T>;
}

export interface CustomerApiClientOptions {
  config: PlatformConfig;
  tokenStorage: TokenStorage;
  transport: HttpTransport;
  logger?: LoggerAdapter;
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
}

export class CustomerApiError extends Error {
  constructor(message: string, readonly status?: number, readonly body?: unknown) {
    super(message);
    this.name = 'CustomerApiError';
  }
}

export const CUSTOMER_API_ENDPOINTS = {
  refresh: '/auth/refresh/',
  login: '/auth/login/',
  logout: '/auth/logout/',
  requestLoginOtp: '/auth/mobile/request-login-otp/',
  verifyLoginOtp: '/auth/mobile/verify-login-otp/',
  register: '/auth/register/',
  requestRegisterOtp: '/auth/mobile/request-register-otp/',
  verifyRegisterOtp: '/auth/mobile/verify-register-otp/',
  passwordReset: '/auth/password-reset/',
  passwordResetConfirm: '/auth/password-reset/confirm/',
  profile: '/auth/profile/',
  addresses: '/auth/addresses/',
  address: (id: string) => `/auth/addresses/${id}/`,
  categories: '/products/categories/',
  vendors: '/vendors/list/',
  vendor: (id: string) => `/vendors/${id}/`,
  vendorReviews: (id: string) => `/vendors/${id}/reviews/`,
  vendorRecommendations: (id: string) => `/vendors/${id}/recommendations/`,
  products: '/products/list/',
  featuredProducts: '/products/featured/',
  product: (id: string) => `/products/${id}/`,
  productSearchByLocation: '/products/search-by-location/',
  productReviews: (id: string) => `/products/${id}/reviews/`,
  cart: '/orders/cart/',
  addToCart: '/orders/cart/add/',
  replaceCart: '/orders/cart/replace/',
  refreshCartFulfillment: '/orders/cart/fulfillment/',
  cartFulfillmentEvent: '/orders/cart/fulfillment/events/',
  cartItem: (id: string) => `/orders/cart/items/${id}/`,
  clearCart: '/orders/cart/clear/',
  deliveryFeePreview: '/orders/delivery-fee-preview/',
  checkoutPreview: '/orders/checkout-preview/',
  availableSlots: '/orders/available-slots/',
  paymentMethods: '/orders/payment-methods/',
  cancellationPolicy: '/orders/cancellation-policy/',
  coupons: '/orders/coupons/',
  validateCoupon: '/orders/coupons/validate/',
  createOrder: '/orders/create/',
  initiateCheckoutPayment: '/orders/initiate-checkout-payment/',
  createPayment: (id: string) => `/orders/${id}/create-payment/`,
  verifyPayment: (id: string) => `/orders/${id}/verify-payment/`,
  orders: '/orders/list/',
  order: (id: string) => `/orders/${id}/`,
  orderTracking: (id: string) => `/orders/${id}/tracking/`,
  reorder: (id: string) => `/orders/${id}/reorder/`,
  cancelOrder: (id: string) => `/orders/${id}/cancel/`,
  rateOrder: (id: string) => `/orders/${id}/rate/`,
  tipDeliveryPartner: (id: string) => `/orders/${id}/tip/`,
  banners: '/orders/banners/',
  notifications: '/notifications/list/',
  markNotificationRead: (id: string) => `/notifications/${id}/read/`,
  markAllNotificationsRead: '/notifications/mark-all-read/',
  unreadNotifications: '/notifications/unread-count/',
  registerDeviceToken: '/notifications/device-token/',
  wishlist: '/products/wishlist/',
  toggleWishlist: (id: string) => `/products/wishlist/${id}/toggle/`,
  wishlistStatus: '/products/wishlist/status/',
  wallet: '/auth/wallet/',
  walletTopUp: '/auth/wallet/topup/',
  verifyWalletTopUp: '/auth/wallet/verify-topup/',
  loyalty: '/auth/loyalty/',
  loyaltyPreview: '/auth/loyalty/preview/',
  referral: '/auth/referral/',
  applyReferral: '/auth/referral/apply/',
  lookupReferral: '/auth/referral/lookup/',
  issues: '/orders/issues/',
  issueOptions: '/orders/issues/options/',
  issue: (id: string) => `/orders/issues/${id}/`,
  issueMessages: (id: string) => `/orders/issues/${id}/messages/`,
  issueAttachments: (id: string) => `/orders/issues/${id}/attachments/`,
  customerHome: '/customer/home/',
  customerServiceability: '/customer/location/serviceability/',
  customerExplore: '/customer/explore/',
  customerBuyAgain: '/customer/buy-again/',
  customerCartSuggestions: '/customer/cart/suggestions/',
  customerBestCoupon: '/customer/cart/apply-best-coupon/',
  customerCheckoutSlots: '/customer/checkout/slots/',
  customerActiveOrder: '/customer/orders/active/',
  customerOrderConfirmation: (id: string) => `/customer/orders/${id}/confirmation/`,
} as const;

function withQuery(path: string, query?: RequestOptions['query']): string {
  if (!query) return path;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

function joinUrl(baseUrl: string, path: string, query?: RequestOptions['query']): string {
  const base = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${withQuery(normalizedPath, query)}`;
}

function hasMultipartBody(body: unknown): boolean {
  return !!body && typeof body === 'object' && body.constructor?.name === 'FormData';
}

export function readApiError(raw: unknown): string {
  if (!raw) return '';
  if (typeof raw === 'string') {
    try {
      return readApiError(JSON.parse(raw));
    } catch {
      return raw;
    }
  }
  if (raw instanceof Error) return raw.message;
  if (typeof raw === 'object') {
    const record = raw as Record<string, unknown>;
    if (record['error']) return String(record['error']);
    if (record['detail']) return String(record['detail']);
    const first = Object.values(record)[0];
    if (Array.isArray(first) && first.length) return String(first[0]);
    if (first) return String(first);
  }
  return String(raw);
}

export function isAuthError(error: unknown): boolean {
  if (error instanceof CustomerApiError && error.status === 401) return true;
  const message = readApiError(error).toLowerCase();
  return ['401', 'unauthorized', 'not authenticated', 'authentication credentials', 'credentials were not provided', 'token is invalid', 'token not valid']
    .some((text) => message.includes(text));
}

export function createCustomerApiClient(options: CustomerApiClientOptions) {
  let refreshPromise: Promise<boolean> | null = null;

  async function refreshAccessToken(): Promise<boolean> {
    if (refreshPromise) return refreshPromise;
    refreshPromise = doRefreshAccessToken().finally(() => {
      refreshPromise = null;
    });
    return refreshPromise;
  }

  async function doRefreshAccessToken(): Promise<boolean> {
    const refresh = await options.tokenStorage.getRefreshToken();
    if (!refresh) return false;
    try {
      const payload = await options.transport.request<{ tokens?: { access?: string; refresh?: string }; access?: string; refresh?: string }>({
        url: joinUrl(options.config.apiBaseUrl, CUSTOMER_API_ENDPOINTS.refresh),
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: { refresh },
      });
      const tokens = payload.tokens || payload;
      if (!tokens.access) {
        await options.tokenStorage.clearTokens();
        return false;
      }
      await options.tokenStorage.setTokens(tokens);
      return true;
    } catch (error) {
      options.logger?.warn?.('Customer token refresh failed', error);
      await options.tokenStorage.clearTokens();
      return false;
    }
  }

  async function request<T>(path: string, requestOptions: RequestOptions = {}, didRefresh = false): Promise<T> {
    const method = requestOptions.method || 'GET';
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(requestOptions.body == null || hasMultipartBody(requestOptions.body) ? {} : { 'Content-Type': 'application/json' }),
      ...(requestOptions.headers || {}),
    };
    if (requestOptions.auth !== false) {
      const token = await options.tokenStorage.getAccessToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    try {
      return await options.transport.request<T>({
        url: joinUrl(options.config.apiBaseUrl, path, requestOptions.query),
        method,
        headers,
        body: requestOptions.body,
      });
    } catch (error) {
      const status = error instanceof CustomerApiError ? error.status : undefined;
      if ((status === 401 || isAuthError(error)) && !didRefresh && path !== CUSTOMER_API_ENDPOINTS.refresh && await refreshAccessToken()) {
        return request<T>(path, requestOptions, true);
      }
      throw error;
    }
  }

  const auth = {
    login: (body: { username: string; password: string }) => request(CUSTOMER_API_ENDPOINTS.login, { method: 'POST', body, auth: false }),
    requestLoginOtp: (phone: string, email = '') => request(CUSTOMER_API_ENDPOINTS.requestLoginOtp, { method: 'POST', body: { phone, email }, auth: false }),
    verifyLoginOtp: (phone: string, otp: string, email = '') => request(CUSTOMER_API_ENDPOINTS.verifyLoginOtp, { method: 'POST', body: { phone, otp, email }, auth: false }),
    register: (body: unknown) => request(CUSTOMER_API_ENDPOINTS.register, { method: 'POST', body, auth: false }),
    requestRegisterOtp: (phone: string, email = '') => request(CUSTOMER_API_ENDPOINTS.requestRegisterOtp, { method: 'POST', body: { phone, email }, auth: false }),
    verifyRegisterOtp: (body: unknown) => request(CUSTOMER_API_ENDPOINTS.verifyRegisterOtp, { method: 'POST', body, auth: false }),
    logout: async () => request<void>(CUSTOMER_API_ENDPOINTS.logout, { method: 'POST', body: { refresh: await options.tokenStorage.getRefreshToken() } }),
    requestPasswordReset: (email: string) => request(CUSTOMER_API_ENDPOINTS.passwordReset, { method: 'POST', body: { email }, auth: false }),
    confirmPasswordReset: (token: string, newPassword: string) => request(CUSTOMER_API_ENDPOINTS.passwordResetConfirm, { method: 'POST', body: { token, new_password: newPassword }, auth: false }),
    profile: () => request(CUSTOMER_API_ENDPOINTS.profile),
    updateProfile: (body: unknown) => request(CUSTOMER_API_ENDPOINTS.profile, { method: 'PUT', body }),
    uploadAvatar: (body: unknown) => request(CUSTOMER_API_ENDPOINTS.profile, { method: 'PUT', body }),
  };

  const account = {
    addresses: () => request(CUSTOMER_API_ENDPOINTS.addresses),
    createAddress: (body: unknown) => request(CUSTOMER_API_ENDPOINTS.addresses, { method: 'POST', body }),
    updateAddress: (id: string, body: unknown) => request(CUSTOMER_API_ENDPOINTS.address(id), { method: 'PUT', body }),
    deleteAddress: (id: string) => request<void>(CUSTOMER_API_ENDPOINTS.address(id), { method: 'DELETE' }),
  };

  const catalog = {
    home: (query?: RequestOptions['query']) => request(CUSTOMER_API_ENDPOINTS.customerHome, { query, auth: false }),
    serviceability: (query?: RequestOptions['query']) => request(CUSTOMER_API_ENDPOINTS.customerServiceability, { query, auth: false }),
    explore: (query?: RequestOptions['query']) => request(CUSTOMER_API_ENDPOINTS.customerExplore, { query, auth: false }),
    buyAgain: (query?: RequestOptions['query']) => request(CUSTOMER_API_ENDPOINTS.customerBuyAgain, { query }),
    categories: (query?: RequestOptions['query']) => request(CUSTOMER_API_ENDPOINTS.categories, { query, auth: false }),
    vendors: (query?: RequestOptions['query']) => request(CUSTOMER_API_ENDPOINTS.vendors, { query, auth: false }),
    nearbyVendors: (query?: RequestOptions['query']) => request(CUSTOMER_API_ENDPOINTS.vendors, { query: { ...query, search_mode: 'nearby' }, auth: false }),
    searchFarVendors: (query?: RequestOptions['query']) => request(CUSTOMER_API_ENDPOINTS.vendors, { query: { ...query, search_mode: 'manual_far' }, auth: false }),
    globalShopSearch: (query?: RequestOptions['query']) => request(CUSTOMER_API_ENDPOINTS.vendors, { query: { ...query, search_mode: 'global_item' }, auth: false }),
    vendor: (id: string, query?: RequestOptions['query']) => request(CUSTOMER_API_ENDPOINTS.vendor(id), { query, auth: false }),
    vendorRecommendations: (id: string, query?: RequestOptions['query']) => request(CUSTOMER_API_ENDPOINTS.vendorRecommendations(id), { query }),
    createVendorReview: (id: string, body: unknown) => request(CUSTOMER_API_ENDPOINTS.vendorReviews(id), { method: 'POST', body }),
    products: (query?: RequestOptions['query']) => request(CUSTOMER_API_ENDPOINTS.products, { query, auth: false }),
    productSearchByLocation: (query?: RequestOptions['query']) => request(CUSTOMER_API_ENDPOINTS.productSearchByLocation, { query, auth: false }),
    featuredProducts: () => request(CUSTOMER_API_ENDPOINTS.featuredProducts, { auth: false }),
    product: (id: string, query?: RequestOptions['query']) => request(CUSTOMER_API_ENDPOINTS.product(id), { query, auth: false }),
    productReviews: (id: string) => request(CUSTOMER_API_ENDPOINTS.productReviews(id), { auth: false }),
    banners: () => request(CUSTOMER_API_ENDPOINTS.banners, { auth: false }),
    coupons: () => request(CUSTOMER_API_ENDPOINTS.coupons, { auth: false }),
    wishlist: () => request(CUSTOMER_API_ENDPOINTS.wishlist),
    toggleWishlist: (id: string) => request(CUSTOMER_API_ENDPOINTS.toggleWishlist(id), { method: 'POST' }),
    wishlistStatus: (ids: string[]) => request(CUSTOMER_API_ENDPOINTS.wishlistStatus, { query: { ids: ids.join(',') } }),
  };

  const cart = {
    cart: () => request(CUSTOMER_API_ENDPOINTS.cart),
    suggestions: () => request(CUSTOMER_API_ENDPOINTS.customerCartSuggestions),
    bestCoupon: () => request(CUSTOMER_API_ENDPOINTS.customerBestCoupon),
    addToCart: (productId: string, quantity = 1, context?: Record<string, unknown>) => request(CUSTOMER_API_ENDPOINTS.addToCart, { method: 'POST', body: { product_id: productId, quantity, ...(context || {}) } }),
    replaceCart: (productId: string, quantity = 1, context?: Record<string, unknown>) => request(CUSTOMER_API_ENDPOINTS.replaceCart, { method: 'POST', body: { product_id: productId, quantity, ...(context || {}) } }),
    refreshFulfillment: (context: Record<string, unknown>) => request(CUSTOMER_API_ENDPOINTS.refreshCartFulfillment, { method: 'POST', body: context }),
    recordFulfillmentEvent: (eventType: string, metadata?: Record<string, unknown>) => request(CUSTOMER_API_ENDPOINTS.cartFulfillmentEvent, { method: 'POST', body: { event_type: eventType, metadata: metadata || {} } }),
    updateCartItem: (id: string, quantity: number) => request(CUSTOMER_API_ENDPOINTS.cartItem(id), { method: 'PATCH', body: { quantity } }),
    removeCartItem: (id: string) => request<void>(CUSTOMER_API_ENDPOINTS.cartItem(id), { method: 'DELETE' }),
    clearCart: () => request<void>(CUSTOMER_API_ENDPOINTS.clearCart, { method: 'DELETE' }),
  };

  const checkout = {
    deliveryFeePreview: (addressId: string) => request(CUSTOMER_API_ENDPOINTS.deliveryFeePreview, { query: { address_id: addressId } }),
    checkoutPreview: (body: unknown) => request(CUSTOMER_API_ENDPOINTS.checkoutPreview, { method: 'POST', body }),
    availableSlots: (query?: RequestOptions['query']) => request(CUSTOMER_API_ENDPOINTS.availableSlots, { query }),
    customerSlots: (query?: RequestOptions['query']) => request(CUSTOMER_API_ENDPOINTS.customerCheckoutSlots, { query }),
    paymentMethods: () => request(CUSTOMER_API_ENDPOINTS.paymentMethods),
    cancellationPolicy: () => request(CUSTOMER_API_ENDPOINTS.cancellationPolicy),
    coupons: () => request(CUSTOMER_API_ENDPOINTS.coupons),
    validateCoupon: (code: string, cartTotal: number, addressId?: string | null) => request(CUSTOMER_API_ENDPOINTS.validateCoupon, { method: 'POST', body: { code, cart_total: cartTotal, address_id: addressId } }),
    createOrder: (body: unknown) => request(CUSTOMER_API_ENDPOINTS.createOrder, { method: 'POST', body }),
    initiateCheckoutPayment: (body: unknown) => request(CUSTOMER_API_ENDPOINTS.initiateCheckoutPayment, { method: 'POST', body }),
    createPayment: (orderId: string) => request(CUSTOMER_API_ENDPOINTS.createPayment(orderId), { method: 'POST', body: {} }),
    verifyPayment: (orderId: string, body: unknown) => request(CUSTOMER_API_ENDPOINTS.verifyPayment(orderId), { method: 'POST', body }),
  };

  const orders = {
    orders: (status?: string) => request(CUSTOMER_API_ENDPOINTS.orders, { query: { status } }),
    order: (id: string) => request(CUSTOMER_API_ENDPOINTS.order(id)),
    activeOrder: () => request(CUSTOMER_API_ENDPOINTS.customerActiveOrder),
    confirmation: (id: string) => request(CUSTOMER_API_ENDPOINTS.customerOrderConfirmation(id)),
    orderTracking: (id: string) => request(CUSTOMER_API_ENDPOINTS.orderTracking(id)),
    reorder: (id: string) => request(CUSTOMER_API_ENDPOINTS.reorder(id), { method: 'POST', body: {} }),
    cancelOrder: (id: string) => request(CUSTOMER_API_ENDPOINTS.cancelOrder(id), { method: 'POST', body: {} }),
    submitOrderRating: (id: string, payload: unknown) => request(CUSTOMER_API_ENDPOINTS.rateOrder(id), { method: 'POST', body: typeof payload === 'number' ? { rating: payload } : payload }),
    tipDeliveryPartner: (id: string, amount: number) => request(CUSTOMER_API_ENDPOINTS.tipDeliveryPartner(id), { method: 'POST', body: { amount } }),
  };

  const notifications = {
    notifications: () => request(CUSTOMER_API_ENDPOINTS.notifications),
    markNotificationRead: (id: string) => request<void>(CUSTOMER_API_ENDPOINTS.markNotificationRead(id), { method: 'PATCH', body: {} }),
    markAllNotificationsRead: () => request<void>(CUSTOMER_API_ENDPOINTS.markAllNotificationsRead, { method: 'POST' }),
    unreadCount: () => request(CUSTOMER_API_ENDPOINTS.unreadNotifications),
    registerDeviceToken: (token: string, platform: string) => request(CUSTOMER_API_ENDPOINTS.registerDeviceToken, { method: 'POST', body: { token, platform } }),
  };

  const wallet = {
    wallet: () => request(CUSTOMER_API_ENDPOINTS.wallet),
    initiateWalletTopUp: (amount: number) => request(CUSTOMER_API_ENDPOINTS.walletTopUp, { method: 'POST', body: { amount } }),
    verifyWalletTopUp: (body: unknown) => request(CUSTOMER_API_ENDPOINTS.verifyWalletTopUp, { method: 'POST', body }),
    loyalty: () => request(CUSTOMER_API_ENDPOINTS.loyalty),
    loyaltyPreview: (orderTotal: number) => request(CUSTOMER_API_ENDPOINTS.loyaltyPreview, { query: { order_total: orderTotal } }),
    referral: () => request(CUSTOMER_API_ENDPOINTS.referral),
    applyReferral: (code: string) => request(CUSTOMER_API_ENDPOINTS.applyReferral, { method: 'POST', body: { code } }),
    lookupReferral: (code: string) => request(CUSTOMER_API_ENDPOINTS.lookupReferral, { query: { code } }),
  };

  const support = {
    issueOptions: () => request(CUSTOMER_API_ENDPOINTS.issueOptions),
    issues: () => request(CUSTOMER_API_ENDPOINTS.issues),
    issue: (id: string) => request(CUSTOMER_API_ENDPOINTS.issue(id)),
    createIssue: (body: unknown) => request(CUSTOMER_API_ENDPOINTS.issues, { method: 'POST', body }),
    sendIssueMessage: (id: string, message: string) => request(CUSTOMER_API_ENDPOINTS.issueMessages(id), { method: 'POST', body: { message } }),
    createIssueAttachment: (id: string, body: unknown) => request(CUSTOMER_API_ENDPOINTS.issueAttachments(id), { method: 'POST', body }),
  };

  return {
    request,
    refreshAccessToken,
    auth,
    account,
    catalog,
    cart,
    checkout,
    orders,
    notifications,
    wallet,
    support,
  };
}
