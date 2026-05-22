export const CUSTOMER_STORAGE_KEYS = {
  accessToken: 'nx_customer_access_token',
  refreshToken: 'nx_customer_refresh_token',
  user: 'nx_customer_user',
  location: 'nx_customer_location',
  paymentMethod: 'nx_customer_payment_method',
} as const;

export const DEFAULT_CUSTOMER_API_BASE_URL = 'https://nex-connect.in/sa/api';
export const DEFAULT_LOCAL_API_BASE_URL = 'http://localhost:8000/api';

export const DEFAULT_ENABLED_PAYMENT_METHODS = [
  'razorpay_upi',
  'razorpay_card',
  'razorpay_wallet',
  'razorpay_netbanking',
  'cod',
] as const;

export function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function buildWsBaseUrl(apiBaseUrl: string): string {
  return trimTrailingSlash(apiBaseUrl)
    .replace(/^https:/, 'wss:')
    .replace(/^http:/, 'ws:')
    .replace(/\/api$/, '');
}

export function buildHealthUrl(apiBaseUrl: string): string {
  return `${trimTrailingSlash(apiBaseUrl).replace(/\/api$/, '')}/health/`;
}

export function withQuery(path: string, query?: Record<string, string | number | boolean | undefined | null>): string {
  if (!query) return path;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function buildApiUrl(baseUrl: string, path: string, query?: Record<string, string | number | boolean | undefined | null>): string {
  const normalizedBase = trimTrailingSlash(baseUrl);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${withQuery(normalizedPath, query)}`;
}

export const CUSTOMER_ENDPOINTS = {
  health: '/health/',
  login: '/auth/login/',
  refresh: '/auth/refresh/',
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
  createPayment: (orderId: string) => `/orders/${orderId}/create-payment/`,
  verifyPayment: (orderId: string) => `/orders/${orderId}/verify-payment/`,
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
} as const;
