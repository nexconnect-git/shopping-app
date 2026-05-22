export type Role = 'customer' | 'vendor' | 'delivery' | 'admin';
export type AddressLabel = 'home' | 'work' | 'other';

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  phone: string;
  avatar: string | null;
  country?: string;
  is_verified?: boolean;
  is_active?: boolean;
  is_superuser?: boolean;
  force_password_change?: boolean;
}

export interface AuthTokens {
  access: string;
  refresh?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface Address {
  id: string;
  label: AddressLabel;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  landmark?: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
}

export interface CustomerAddress extends Address {
  delivery_instructions?: string;
}

export interface SelectedLocation {
  lat: number;
  lng: number;
  name: string;
  city?: string;
  state?: string;
  postalCode?: string;
  source?: 'gps' | 'manual' | 'saved_address' | 'default_address';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image: string | null;
  icon_name?: string;
  parent?: string | null;
  parent_name?: string | null;
  children?: Category[];
  subcategory_count?: number;
  is_active?: boolean;
  show_in_customer_ui?: boolean;
  display_order?: number;
}

export interface Vendor {
  id: string;
  store_name: string;
  description: string;
  logo: string | null;
  banner: string | null;
  phone?: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  status?: string;
  is_open: boolean;
  is_open_now?: boolean;
  availability_note?: string;
  opening_time?: string;
  closing_time?: string;
  min_order_amount?: number;
  delivery_radius_km?: number;
  average_rating: number;
  total_ratings: number;
  is_featured?: boolean;
  distance_km?: number;
  estimated_delivery_minutes?: number;
  estimated_delivery_label?: string;
  far_order_eta_label?: string;
  vehicle_type?: string;
  vehicle_reason?: string;
  is_far_delivery?: boolean;
  requires_far_delivery_confirmation?: boolean;
  within_instant_radius?: boolean;
  same_state?: boolean;
  is_serviceable?: boolean;
  serviceability_error?: string;
  matched_products_preview?: string[];
  has_previously_ordered?: boolean;
  products?: Product[];
  vendor_tier?: string;
  user_info?: User;
}

export interface ProductImage {
  id: string;
  image: string;
  is_primary: boolean;
  display_order?: number;
}

export interface CatalogProduct {
  id: string;
  category?: Category | null;
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  unit?: string;
  barcode?: string;
  search_keywords?: string;
  compliance_notes?: string;
  is_active?: boolean;
  images?: ProductImage[];
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  catalog_product?: CatalogProduct | null;
  name: string;
  slug?: string;
  description: string;
  price: number;
  compare_price?: number | null;
  tax_rate?: number;
  brand?: string;
  sku?: string;
  stock: number;
  low_stock_threshold?: number;
  min_order_quantity?: number;
  unit: string;
  weight?: string;
  is_available?: boolean;
  average_rating: number;
  total_ratings: number;
  discount_percentage?: number;
  in_stock?: boolean;
  images?: ProductImage[];
  primary_image: string | null;
  vendor: Vendor | string;
  vendor_name: string;
  category: Category;
}

export interface ProductReview {
  id: string;
  rating: number;
  comment?: string;
  review?: string;
  user_name?: string;
  customer_name?: string;
  created_at?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  total_items: number;
  total_amount: number;
}

export interface OrderItem {
  id: string;
  product?: string | null;
  product_name: string;
  product_price?: number;
  quantity: number;
  subtotal: number;
}

export interface OrderTracking {
  id: string;
  status: string;
  description: string;
  latitude: number | string | null;
  longitude: number | string | null;
  timestamp: string;
}

export interface VendorInfo {
  id: string;
  store_name: string;
  address?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  phone?: string;
}

export interface DeliveryPartnerInfo {
  id?: string;
  name: string;
  phone: string;
  vehicle_type: string;
  vehicle_number?: string;
  average_rating: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name?: string;
  vendor: string;
  vendor_name: string;
  vendor_info?: VendorInfo;
  status: string;
  payment_method: string;
  is_payment_verified?: boolean;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  notes?: string;
  items: OrderItem[];
  tracking?: OrderTracking[];
  delivery_address: Address;
  delivery_latitude?: number | string | null;
  delivery_longitude?: number | string | null;
  pickup_otp?: string;
  delivery_otp?: string;
  delivery_partner?: string | null;
  delivery_partner_info?: DeliveryPartnerInfo;
  assignment_status?: string | null;
  refund_status?: string;
  razorpay_refund_id?: string;
  wallet_discount?: number | string;
  placed_at: string;
  distance_km?: number;
  has_rating?: boolean;
  total_items?: number;
  total_amount?: number;
  delivery_tip?: string | null;
}

export interface DeliveryFeeQuote {
  vendor_id: string;
  vendor_name: string;
  distance_km: number;
  estimated_delivery_minutes: number;
  estimated_delivery_label: string;
  far_order_eta_label: string;
  delivery_fee: string;
  vehicle_type: string;
  vehicle_reason: string;
  is_far_delivery: boolean;
  requires_far_delivery_confirmation: boolean;
  within_instant_radius: boolean;
  same_state: boolean;
  is_serviceable: boolean;
  serviceability_error: string;
  max_supported_distance_km: number;
  instant_radius_km: number;
}

export interface DeliveryFeePreview {
  fees: DeliveryFeeQuote[];
  total_delivery_fee: string;
  requires_far_delivery_confirmation: boolean;
  far_delivery_quotes: DeliveryFeeQuote[];
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type ListResponse<T> = T[] | PaginatedResponse<T> | { results?: T[]; items?: T[]; vendors?: T[]; products?: T[]; coupons?: T[] };

export interface Coupon {
  id: string;
  code: string;
  title?: string;
  name?: string;
  description?: string;
  terms?: string;
  discount_type?: string;
  discount_value?: number | string;
  discount?: number | string;
  min_order_amount?: number | string;
  valid_until?: string | null;
  display_section?: string;
  badge_text?: string;
  icon_name?: string;
  accent_color?: string;
  display_order?: number;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  badge_text?: string;
  cta_label?: string;
  cta_url?: string;
  image?: string | null;
  bg_gradient?: string;
  display_order?: number;
}

export interface PaymentMethod {
  id: string;
  label: string;
  description: string;
  icon: string;
  isDefault?: boolean;
}

export interface PaymentRailMeta {
  key: string;
  label: string;
  detail: string;
  icon: string;
  enabled?: boolean;
}

export interface CustomerAddressView {
  id: string;
  label: string;
  name: string;
  line: string;
  phone: string;
  isDefault: boolean;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  latitude?: number | null;
  longitude?: number | null;
  raw?: unknown;
}

export interface CustomerOrderItemView {
  id: string;
  name: string;
  unit: string;
  price: number;
  mrp: number;
  discount: string;
  image: string;
  category: string;
  rating: number;
  storeId: string;
  raw?: unknown;
}

export interface CustomerOrderView {
  id: string;
  date: string;
  time: string;
  amount: number;
  items: CustomerOrderItemView[];
  status: 'Active' | 'Delivered' | 'Cancelled';
  payment: string;
  raw?: unknown;
}

export interface CheckoutSummary {
  subtotal: number;
  deliveryFee: number;
  handlingFee: number;
  couponDiscount: number;
  walletDiscount: number;
  loyaltyDiscount: number;
  discount: number;
  total: number;
  maxWalletUsable: number;
  recommendedSavings: number;
  itemCount: number;
}

export interface DeliveryPreviewSummary {
  deliveryFee: number;
  requiresFarDeliveryConfirmation: boolean;
  deliveryQuotes: unknown[];
  farDeliveryQuotes: unknown[];
  primaryQuote: Record<string, unknown> | null;
  etaLabel: string;
  instantRadiusKm: number;
  instantRadiusLabel: string;
}

export interface NormalizedCoupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  badgeText: string;
  iconName: string;
  accentColor: string;
  validUntil: string | null;
  raw?: unknown;
}

export interface NormalizedBanner {
  id: string;
  title: string;
  subtitle: string;
  badgeText: string;
  ctaLabel: string;
  ctaUrl: string;
  image: string | null;
  bgGradient: string;
  raw?: unknown;
}

export interface Issue {
  id: string;
  order?: string;
  issue_type?: string;
  status: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WalletTransaction {
  id: string;
  amount: number | string;
  transaction_type?: string;
  description?: string;
  created_at?: string;
}

export interface Wallet {
  balance: number | string;
  transactions?: WalletTransaction[];
}

export interface Referral {
  code?: string;
  referral_code?: string;
  total_rewards?: number | string;
  reward_amount?: number | string;
  referred_count?: number;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export type LocationSource = 'gps' | 'manual' | 'saved_address' | 'default_address' | 'unknown';

export interface LocationContext {
  coordinates: GeoCoordinates | null;
  addressId?: string;
  label: string;
  city?: string;
  state?: string;
  postalCode?: string;
  source: LocationSource;
  permissionGranted?: boolean;
  isTemporary?: boolean;
}

export interface ServiceabilityResult {
  isServiceable: boolean;
  reason?: string;
  distanceKm?: number;
  deliveryFee?: number;
  estimatedDeliveryMinutes?: number;
  estimatedDeliveryLabel?: string;
  vendorId?: string;
  addressId?: string;
}

export interface CartStoreLock {
  storeId: string;
  storeName: string;
}

export interface StoreCartConflict {
  existingStore: CartStoreLock;
  incomingStore: CartStoreLock;
  message: string;
}

export interface AddToCartValidationResult {
  allowed: boolean;
  conflict?: StoreCartConflict;
}

export interface FeeConfig {
  platformFee?: number;
  packagingFee?: number;
  smallCartFee?: number;
  smallCartThreshold?: number;
  surgeFee?: number;
  roundingMode?: 'none' | 'nearest_rupee' | 'ceil_rupee' | 'floor_rupee';
}

export interface TaxConfig {
  taxRatePercent?: number;
  taxableIncludesDelivery?: boolean;
  taxableIncludesPlatformFee?: boolean;
}

export interface CouponDiscount {
  code?: string;
  amount: number;
  type?: 'percentage' | 'fixed' | 'free_delivery';
}

export interface PriceBreakup {
  itemSubtotal: number;
  productDiscount: number;
  couponDiscount: number;
  deliveryFee: number;
  platformFee: number;
  packagingFee: number;
  smallCartFee: number;
  tax: number;
  surgeFee: number;
  roundingAdjustment: number;
  finalPayableAmount: number;
}

export interface PricingInput {
  items: CartItem[];
  productDiscount?: number;
  couponDiscount?: CouponDiscount | number;
  deliveryFee?: number;
  feeConfig?: FeeConfig;
  taxConfig?: TaxConfig;
}

export interface PricingResult {
  breakup: PriceBreakup;
  displayOnly: true;
}

export interface CheckoutValidationInput {
  isAuthenticated: boolean;
  cartItems: CartItem[];
  selectedAddress?: CustomerAddress | CustomerAddressView | Address | null;
  selectedPaymentMethod?: string | null;
  serviceability?: ServiceabilityResult | null;
  codUpiConfirmed?: boolean;
  scheduledOrder?: ScheduledOrderDetails | null;
}

export interface CheckoutValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export interface ScheduleOrderConfig {
  enabled: boolean;
  minPreparationMinutes: number;
  maxScheduleDays: number;
  slotIntervalMinutes: number;
  timezone?: string;
}

export interface DeliverySlot {
  id: string;
  startAt: string;
  endAt: string;
  label: string;
  available: boolean;
  unavailableReason?: string;
}

export interface ScheduledOrderDetails {
  scheduledFor: string;
  slotId?: string;
  slotLabel?: string;
}

export interface ProductSearchQuery {
  query: string;
  location: LocationContext;
  categoryId?: string;
  limit?: number;
}

export interface StoreProductMatch {
  store: Vendor;
  matchingProducts: Product[];
  distanceKm?: number;
  estimatedDeliveryMinutes?: number;
  availabilityRank?: number;
  lowestPrice?: number;
}

export interface ProductSearchResult {
  query: ProductSearchQuery;
  matches: StoreProductMatch[];
}

export interface RelatedProductResult {
  storeId: string;
  products: Product[];
  source: 'same_store' | 'other_store';
}

export interface RecommendationContext {
  storeId: string;
  customerId?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  previousProductIds?: string[];
}

export type RecommendationReason =
  | 'previously_bought'
  | 'popular_in_store'
  | 'frequently_bought_together'
  | 'vendor_promoted'
  | 'seasonal'
  | 'related_category'
  | 'offer';

export interface RecommendedProduct {
  product: Product;
  reason: RecommendationReason;
  score?: number;
}

export interface PaymentGatewayConfig {
  id: string;
  label: string;
  enabled: boolean;
  provider: 'cod' | 'razorpay' | 'upi' | 'wallet' | 'other';
  metadata?: Record<string, unknown>;
}

export interface AvailablePaymentMethod {
  id: string;
  label: string;
  description?: string;
  enabled: boolean;
  reasonUnavailable?: string;
  requiresConfirmation?: boolean;
}

export interface PaymentEligibilityResult {
  methods: AvailablePaymentMethod[];
  hasAvailableMethod: boolean;
  reasonUnavailable?: string;
}

export interface Offer {
  id: string;
  title: string;
  description?: string;
  couponCode?: string;
  vendorId?: string;
  categoryId?: string;
  productId?: string;
  active: boolean;
  validFrom?: string;
  validUntil?: string | null;
}

export interface CouponValidationInput {
  code: string;
  cartSubtotal: number;
  customerId?: string;
  vendorId?: string;
  productIds?: string[];
  categoryIds?: string[];
  paymentMethod?: string;
  scheduledOrder?: boolean;
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discount?: CouponDiscount;
  message?: string;
  rejectionReason?: string;
}

export interface AppliedCoupon {
  code: string;
  discountAmount: number;
  title?: string;
  message?: string;
}

export interface DeliveryPartnerLocation {
  partnerId?: string;
  latitude: number;
  longitude: number;
  updatedAt?: string;
}

export interface TrackingRoute {
  polyline?: string;
  points?: GeoCoordinates[];
  estimatedArrivalTime?: string;
}

export interface OrderStatusTimelineItem {
  status: string;
  label: string;
  completed: boolean;
  timestamp?: string;
  description?: string;
}

export interface OrderTrackingState {
  orderId: string;
  status: string;
  storeLocation?: GeoCoordinates;
  customerLocation?: GeoCoordinates;
  deliveryPartnerLocation?: DeliveryPartnerLocation;
  route?: TrackingRoute;
  etaLabel?: string;
  timeline: OrderStatusTimelineItem[];
}

export interface AuthSessionState {
  isAuthenticated: boolean;
  user?: User | null;
  accessTokenExpiresAt?: number;
  refreshTokenExpiresAt?: number;
  accountStatus?: 'active' | 'suspended' | 'pending' | 'rejected';
}

export type EmailTemplateType =
  | 'customer_welcome'
  | 'login_otp'
  | 'order_placed'
  | 'order_delivered_invoice'
  | 'order_delivered_tax_invoice'
  | 'order_cancelled'
  | 'refund_initiated'
  | 'refund_completed'
  | 'payment_failed'
  | 'account_suspended';

export interface EmailTemplatePayload {
  type: EmailTemplateType;
  customerName?: string;
  supportContact?: string;
  brandName?: string;
}

export interface OtpEmailPayload extends EmailTemplatePayload {
  type: 'login_otp';
  otp: string;
  expiryMinutes: number;
}

export interface OrderPlacedEmailPayload extends EmailTemplatePayload {
  type: 'order_placed';
  orderId: string;
  orderDate: string;
  storeName: string;
  deliveryAddress: string;
  items: Array<{ name: string; quantity: number; amount: number }>;
  priceBreakup: PriceBreakup;
}

export interface InvoiceEmailPayload extends EmailTemplatePayload {
  type: 'order_delivered_invoice';
  orderId: string;
  invoiceNumber: string;
  priceBreakup: PriceBreakup;
}

export interface TaxInvoiceEmailPayload extends EmailTemplatePayload {
  type: 'order_delivered_tax_invoice';
  orderId: string;
  invoiceNumber: string;
  taxDetails: Record<string, unknown>;
  priceBreakup: PriceBreakup;
}
