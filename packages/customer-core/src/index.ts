export interface CartLikeItem {
  quantity?: number | string | null;
  price?: number | string | null;
  mrp?: number | string | null;
  subtotal?: number | string | null;
}

export interface PaymentMethodMeta {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export function toNumber(value: unknown, fallback = 0): number {
  const amount = Number(value ?? fallback);
  return Number.isFinite(amount) ? amount : fallback;
}

export function money(value: number | string | undefined | null, locale = 'en-IN', currencySymbol = '\u20b9'): string {
  const amount = toNumber(value);
  return `${currencySymbol}${amount.toLocaleString(locale, { maximumFractionDigits: 0 })}`;
}

export function statusLabel(status: string): string {
  return String(status || '').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function initials(first?: string, last?: string, fallback = '?'): string {
  const text = `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
  return text || fallback[0]?.toUpperCase() || '?';
}

export function toTitle(value: string): string {
  return String(value || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function cartItemCount(items: CartLikeItem[]): number {
  return items.reduce((sum, item) => sum + toNumber(item.quantity), 0);
}

export function cartSubtotal(items: CartLikeItem[]): number {
  return items.reduce((sum, item) => sum + toNumber(item.price) * toNumber(item.quantity), 0);
}

export function cartMrpTotal(items: CartLikeItem[]): number {
  return items.reduce((sum, item) => sum + toNumber(item.mrp ?? item.price) * toNumber(item.quantity), 0);
}

export function cartSavings(items: CartLikeItem[], couponDiscount = 0): number {
  return Math.max(0, cartMrpTotal(items) - cartSubtotal(items)) + toNumber(couponDiscount);
}

export function deliveryFeeFromPreview(preview: unknown, hasItems = true): number {
  if (!hasItems || !preview || typeof preview !== 'object') return 0;
  const value = (preview as { total_delivery_fee?: unknown; delivery_fee?: unknown }).total_delivery_fee
    ?? (preview as { delivery_fee?: unknown }).delivery_fee;
  return toNumber(value);
}

export function deliveryFeeLabel(deliveryFee: number | string | null | undefined, freeLabel = 'FREE'): string {
  const fee = toNumber(deliveryFee);
  return fee > 0 ? `Rs ${fee}` : freeLabel;
}

export function handlingFeeForItems(items: CartLikeItem[], fee = 4): number {
  return items.length ? fee : 0;
}

export function checkoutTotal(input: {
  subtotal: number;
  deliveryFee?: number;
  handlingFee?: number;
  couponDiscount?: number;
  walletDiscount?: number;
  loyaltyDiscount?: number;
}): number {
  const discounts = toNumber(input.couponDiscount) + toNumber(input.walletDiscount) + toNumber(input.loyaltyDiscount);
  return Math.max(0, toNumber(input.subtotal) + toNumber(input.deliveryFee) + toNumber(input.handlingFee) - discounts);
}

export function freeDeliveryRemaining(subtotal: number, threshold = 300): number {
  return Math.max(0, threshold - toNumber(subtotal));
}

export function freeDeliveryProgress(subtotal: number, threshold = 300): number {
  if (threshold <= 0) return 100;
  return Math.min(100, (toNumber(subtotal) / threshold) * 100);
}

export type DeliveryPromotionState = 'locked' | 'unlocked' | 'fee_applies' | 'empty';

export interface DeliveryPromotion {
  state: DeliveryPromotionState;
  unlocked: boolean;
  remaining: number;
  progress: number;
  title: string;
  description: string;
}

export function getDeliveryPromotion(input: {
  subtotal?: number | string | null;
  deliveryFee?: number | string | null;
  hasItems?: boolean;
  threshold?: number;
}): DeliveryPromotion {
  const threshold = input.threshold ?? 300;
  const subtotal = toNumber(input.subtotal);
  const deliveryFee = toNumber(input.deliveryFee);
  const hasItems = input.hasItems ?? subtotal > 0;
  const remaining = freeDeliveryRemaining(subtotal, threshold);
  const progress = freeDeliveryProgress(subtotal, threshold);

  if (!hasItems) {
    return {
      state: 'empty',
      unlocked: false,
      remaining,
      progress,
      title: 'Add items to check delivery offers',
      description: 'Delivery offers depend on your cart and selected address.',
    };
  }

  if (remaining > 0) {
    return {
      state: 'locked',
      unlocked: false,
      remaining,
      progress,
      title: `Add Rs ${remaining} more for free delivery`,
      description: 'Delivery offers depend on your selected address.',
    };
  }

  if (deliveryFee === 0) {
    return {
      state: 'unlocked',
      unlocked: true,
      remaining: 0,
      progress: 100,
      title: 'Free delivery unlocked',
      description: 'Your selected address has no delivery fee for this cart.',
    };
  }

  return {
    state: 'fee_applies',
    unlocked: false,
    remaining: 0,
    progress: 100,
    title: 'Delivery fee is calculated for your selected address',
    description: 'Fee depends on store distance and serviceability.',
  };
}

export function shouldOpenCartAfterAdd(source: 'add_item' | 'explicit_cart_action' | 'reorder' = 'add_item'): boolean {
  return source === 'explicit_cart_action' || source === 'reorder';
}

export function getPaymentMethodMeta(method: string): PaymentMethodMeta {
  const labels: Record<string, Omit<PaymentMethodMeta, 'id'>> = {
    cod: { label: 'Cash on Delivery', description: 'Pay when the order arrives', icon: 'COD' },
    razorpay: { label: 'Online Payment', description: 'Cards, UPI, net banking and wallets', icon: 'PAY' },
    razorpay_upi: { label: 'UPI', description: 'Pay securely with your UPI app', icon: 'UPI' },
    razorpay_card: { label: 'Credit or Debit Card', description: 'Processed through Razorpay', icon: 'CARD' },
    razorpay_netbanking: { label: 'Net Banking', description: 'All major banks supported', icon: 'BANK' },
    razorpay_wallet: { label: 'Wallet', description: 'Supported payment wallets', icon: 'WALLET' },
  };
  const meta = labels[method] || {
    label: toTitle(method.replace(/_/g, ' ')),
    description: 'Secure payment method',
    icon: 'PAY',
  };
  return { id: method, ...meta };
}

export interface CategoryLike {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  image?: string | null;
  icon_name?: string;
  parent?: string | null;
  parent_name?: string | null;
  children?: CategoryLike[];
  is_active?: boolean;
  show_in_customer_ui?: boolean;
}

export interface ProductLike extends CartLikeItem {
  id?: string;
  name?: string;
  description?: string;
  price?: number | string | null;
  compare_price?: number | string | null;
  discount_percentage?: number | string | null;
  brand?: string;
  stock?: number | string | null;
  unit?: string;
  weight?: string;
  average_rating?: number | string | null;
  total_ratings?: number | string | null;
  primary_image?: string | null;
  images?: Array<{ image?: string | null; is_primary?: boolean }>;
  vendor?: VendorLike | string | null;
  vendor_name?: string;
  category?: CategoryLike | null;
  catalog_product?: { name?: string; unit?: string; category?: CategoryLike | null; images?: Array<{ image?: string | null; is_primary?: boolean }> } | null;
}

export interface VendorLike {
  id?: string;
  store_name?: string;
  description?: string;
  logo?: string | null;
  banner?: string | null;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  is_open?: boolean;
  is_open_now?: boolean;
  availability_note?: string;
  average_rating?: number | string | null;
  total_ratings?: number | string | null;
  min_order_amount?: number | string | null;
  distance_km?: number | string | null;
  estimated_delivery_minutes?: number | string | null;
  estimated_delivery_label?: string;
  far_order_eta_label?: string;
  vehicle_type?: string;
  is_far_delivery?: boolean;
  is_featured?: boolean;
  within_instant_radius?: boolean;
  products?: ProductLike[];
}

export interface NormalizedProduct {
  id: string;
  apiId: string;
  name: string;
  unit: string;
  price: number;
  mrp: number;
  discount: string;
  image: string;
  category: string;
  rating: number;
  storeId: string;
  storeName?: string;
  highlights: string[];
  raw: ProductLike;
}

export interface NormalizedStore {
  id: string;
  name: string;
  category: string;
  rating: number;
  ratings: string;
  eta: string;
  distance: string;
  offer: string;
  delivery: string;
  image: string;
  hero: string;
  tags: string[];
  isExpress: boolean;
  raw: VendorLike;
}

export interface NormalizedCategory {
  id: string;
  label: string;
  icon: string;
  image?: string;
  bg: string;
  raw?: CategoryLike;
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
  raw: unknown;
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
  raw: unknown;
}

export interface DeliveryFeePreviewLike {
  total_delivery_fee?: unknown;
  delivery_fee?: unknown;
  fees?: Array<Record<string, unknown>>;
  far_delivery_quotes?: Array<Record<string, unknown>>;
  requires_far_delivery_confirmation?: boolean;
}

export const DEFAULT_PRODUCT_IMAGE = '/assets/placeholders/product.svg';
export const DEFAULT_STORE_IMAGE = '/assets/placeholders/store.svg';
export const CATEGORY_BACKGROUNDS = ['#ecfdf5', '#fff7ed', '#eff6ff', '#fdf2f8', '#f5f3ff', '#fefce8'];

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
  const message = readApiError(error).toLowerCase();
  return ['401', 'unauthorized', 'not authenticated', 'authentication credentials', 'credentials were not provided', 'token is invalid', 'token not valid']
    .some((text) => message.includes(text));
}

export function listFromResponse<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response as T[];
  if (!response || typeof response !== 'object') return [];
  const record = response as Record<string, unknown>;
  for (const key of ['results', 'items', 'vendors', 'products', 'coupons']) {
    if (Array.isArray(record[key])) return record[key] as T[];
  }
  return [];
}

export function normalizeKey(value?: string | null): string {
  return String(value || '').trim().toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function iconForCategory(value?: string | null): string {
  const key = normalizeKey(value);
  const icons: Record<string, string> = {
    fruit: 'nutrition',
    fruits: 'nutrition',
    'fruits-and-veg': 'nutrition',
    vegetables: 'nutrition',
    dairy: 'local_drink',
    'dairy-and-eggs': 'local_drink',
    bakery: 'bakery_dining',
    snacks: 'cookie',
    beverages: 'local_cafe',
    'personal-care': 'spa',
    'home-care': 'cleaning_services',
    meat: 'set_meal',
    frozen: 'ac_unit',
    grocery: 'shopping_bag',
    groceries: 'shopping_bag',
    pharmacy: 'local_pharmacy',
  };
  return icons[key] || (key && /^[a-z0-9_]+$/.test(String(value)) ? String(value) : 'category');
}

export function categoryFilterKey(category?: CategoryLike | NormalizedCategory | null): string {
  if (!category) return 'all';
  if ('raw' in category && category.raw) return normalizeKey(category.raw.slug || category.raw.id || category.label);
  const source = category as CategoryLike;
  return normalizeKey(source.slug || source.id || source.name);
}

export function categoryMatchesFilterKey(category: CategoryLike | NormalizedCategory, key: string): boolean {
  const target = normalizeKey(key || 'all');
  if (!target) return false;
  if ('raw' in category) {
    return [
      category.id,
      category.label,
      category.raw?.slug,
      category.raw?.id,
      category.raw?.name,
    ].some((value) => normalizeKey(value) === target);
  }
  const source = category as CategoryLike;
  return [
    source.id,
    source.slug,
    source.name,
  ].some((value) => normalizeKey(value) === target);
}

export function categoryEmojiFor(value?: string | CategoryLike | NormalizedCategory | null): string {
  const configured = configuredCategoryIcon(value);
  if (configured && isEmojiIconValue(configured)) return configured.trim();
  let text = '';
  if (typeof value === 'string') {
    text = value;
  } else if (value && 'raw' in value) {
    const source = value as NormalizedCategory;
    text = `${source.label || ''} ${source.raw?.slug || ''} ${source.raw?.icon_name || ''}`;
  } else {
    const source = value as CategoryLike | null | undefined;
    text = `${source?.name || ''} ${source?.slug || ''} ${source?.icon_name || ''}`;
  }
  const key = normalizeKey(text);
  if (!key || key === 'all' || key.includes('grocery')) return '🛍️';
  if (key.includes('fruit') || key.includes('vegetable') || key.includes('produce')) return '🥦';
  if (key.includes('dairy') || key.includes('breakfast') || key.includes('milk') || key.includes('egg')) return '🥛';
  if (key.includes('snack') || key.includes('munch')) return '🍿';
  if (key.includes('beverage') || key.includes('drink') || key.includes('juice')) return '🥤';
  if (key.includes('bakery') || key.includes('bread')) return '🥐';
  if (key.includes('pantry') || key.includes('staple')) return '🧺';
  if (key.includes('personal') || key.includes('care')) return '🧴';
  if (key.includes('home') || key.includes('clean')) return '🧽';
  if (key.includes('medicine') || key.includes('pharmacy') || key.includes('health')) return '💊';
  if (key.includes('baby')) return '🍼';
  if (key.includes('meal') || key.includes('restaurant') || key.includes('food')) return '🍽️';
  if (key.includes('electronic') || key.includes('phone') || key.includes('gadget')) return '📱';
  if (key.includes('fashion') || key.includes('cloth') || key.includes('wear')) return '👕';
  if (key.includes('offer')) return '🏷️';
  return '✨';
}

export function configuredCategoryIcon(value?: string | CategoryLike | NormalizedCategory | null): string {
  if (!value || typeof value === 'string') return '';
  if ('raw' in value) return String(value.raw?.icon_name || '').trim();
  return String((value as CategoryLike).icon_name || '').trim();
}

export function isEmojiIconValue(value?: string | null): boolean {
  const text = String(value || '').trim();
  if (!text) return false;
  if (/^(https?:|data:image\/|\/|\.\/|\.\.\/)/i.test(text)) return false;
  if (/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(text)) return false;
  if (/^[a-z0-9_ -]+$/i.test(text)) return false;
  return /\p{Extended_Pictographic}/u.test(text);
}

export function normalizeCategory(category: CategoryLike, index = 0): NormalizedCategory {
  return {
    id: category.slug || category.id || normalizeKey(category.name) || 'category',
    label: category.name || 'Category',
    icon: iconForCategory(category.icon_name || category.name),
    image: category.image || undefined,
    bg: CATEGORY_BACKGROUNDS[index % CATEGORY_BACKGROUNDS.length],
    raw: category,
  };
}

export function normalizeProduct(product: ProductLike, vendor?: VendorLike, fallbackImage = DEFAULT_PRODUCT_IMAGE): NormalizedProduct {
  const vendorData = vendor || (typeof product.vendor === 'object' && product.vendor ? product.vendor : undefined);
  const storeId = vendorData?.id || (typeof product.vendor === 'string' ? product.vendor : '');
  const storeName = product.vendor_name || vendorData?.store_name || '';
  const category = product.category?.name || product.catalog_product?.category?.name || 'Products';
  const price = toNumber(product.price);
  const mrp = Math.max(toNumber(product.compare_price ?? product.price), price);
  const rawDiscount = toNumber(product.discount_percentage);
  const discount = rawDiscount > 0 ? `${Math.round(rawDiscount)}% OFF` : (mrp > price ? `${Math.round(((mrp - price) / mrp) * 100)}% OFF` : '');
  const catalogImage = product.catalog_product?.images?.find((image) => image.is_primary)?.image || product.catalog_product?.images?.[0]?.image;
  return {
    id: product.id || 'product',
    apiId: product.id || 'product',
    name: product.name || product.catalog_product?.name || 'Product',
    unit: product.unit || product.weight || product.catalog_product?.unit || '1 unit',
    price,
    mrp,
    discount,
    image: product.primary_image || product.images?.find((image) => image.is_primary)?.image || product.images?.[0]?.image || catalogImage || fallbackImage,
    category,
    rating: toNumber(product.average_rating),
    storeId,
    storeName,
    highlights: [product.brand, product.description].filter(Boolean).slice(0, 4) as string[],
    raw: product,
  };
}

export function normalizeVendor(vendor: VendorLike, fallbackImage = DEFAULT_STORE_IMAGE): NormalizedStore {
  const category = vendor.products?.[0]?.category?.name || vendor.description || 'Store';
  const eta = shopArrivalLabel(vendor);
  const rating = toNumber(vendor.average_rating);
  return {
    id: vendor.id || 'store',
    name: vendor.store_name || 'Store',
    category,
    rating,
    ratings: vendor.total_ratings ? String(vendor.total_ratings) : 'New',
    eta,
    distance: vendor.distance_km != null && vendor.distance_km !== '' ? `${toNumber(vendor.distance_km).toFixed(1)} km` : '',
    offer: toNumber(vendor.min_order_amount) > 0 ? `Min order Rs ${toNumber(vendor.min_order_amount)}` : '',
    delivery: vendor.is_far_delivery ? 'Scheduled delivery' : 'Express delivery',
    image: vendor.logo || fallbackImage,
    hero: vendor.banner || vendor.logo || fallbackImage,
    tags: [vendor.city, vendor.state, vendor.vehicle_type, category].filter(Boolean).slice(0, 4) as string[],
    isExpress: isFastDeliveryVendor(vendor),
    raw: vendor,
  };
}

export function discountLabel(coupon: Record<string, unknown>): string {
  if (coupon['discount_type'] === 'free_delivery') return 'Free delivery';
  if (coupon['discount_type'] === 'percentage') return `${toNumber(coupon['discount_value'])}% off`;
  const value = toNumber(coupon['discount_value'] ?? coupon['discount']);
  return value > 0 ? `Save Rs ${value}` : 'Live offer';
}

export function couponTerms(coupon: Record<string, unknown>): string {
  const minOrder = toNumber(coupon['min_order_amount']);
  return minOrder > 0 ? `Minimum order Rs ${minOrder}` : 'Apply this offer at checkout';
}

export function normalizeCoupon(coupon: Record<string, unknown>): NormalizedCoupon {
  return {
    id: String(coupon['id'] || coupon['code'] || coupon['title'] || 'coupon'),
    code: String(coupon['code'] || coupon['coupon_code'] || '').toUpperCase(),
    title: String(coupon['title'] || coupon['name'] || coupon['badge_text'] || discountLabel(coupon)),
    description: String(coupon['description'] || coupon['terms'] || couponTerms(coupon)),
    discountType: String(coupon['discount_type'] || ''),
    discountValue: toNumber(coupon['discount_value'] ?? coupon['discount']),
    minOrderAmount: toNumber(coupon['min_order_amount']),
    badgeText: String(coupon['badge_text'] || discountLabel(coupon)),
    iconName: String(coupon['icon_name'] || 'local_offer'),
    accentColor: String(coupon['accent_color'] || '#6C63FF'),
    validUntil: coupon['valid_until'] ? String(coupon['valid_until']) : null,
    raw: coupon,
  };
}

export function normalizeCustomerPath(value: string): string {
  const path = String(value || '').trim();
  if (!path || path === '/shops') return '/stores';
  if (path.startsWith('/shop/')) return path.replace('/shop/', '/store/');
  return path.startsWith('/') ? path : `/${path}`;
}

export function normalizeBanner(banner: Record<string, unknown>): NormalizedBanner {
  return {
    id: String(banner['id'] || banner['title'] || banner['cta_url'] || 'banner'),
    title: String(banner['title'] || ''),
    subtitle: String(banner['subtitle'] || ''),
    badgeText: String(banner['badge_text'] || ''),
    ctaLabel: String(banner['cta_label'] || 'Shop now'),
    ctaUrl: normalizeCustomerPath(String(banner['cta_url'] || '/stores')),
    image: banner['image'] ? String(banner['image']) : null,
    bgGradient: String(banner['bg_gradient'] || 'linear-gradient(135deg,#6c63ff,#5046e4)'),
    raw: banner,
  };
}

export function getCartTotals(items: CartLikeItem[], input: { deliveryFee?: number; handlingFee?: number; couponDiscount?: number; walletDiscount?: number; loyaltyDiscount?: number } = {}) {
  const subtotal = cartSubtotal(items);
  const mrpTotal = cartMrpTotal(items);
  const itemCount = cartItemCount(items);
  const savings = cartSavings(items, input.couponDiscount);
  const total = checkoutTotal({ subtotal, ...input });
  return { itemCount, subtotal, mrpTotal, savings, total };
}

export const getCheckoutTotal = checkoutTotal;

export function getDeliveryFee(preview: DeliveryFeePreviewLike | unknown, hasItems = true): number {
  return deliveryFeeFromPreview(preview, hasItems);
}

export function getPrimaryDeliveryQuote(preview: DeliveryFeePreviewLike | unknown): Record<string, unknown> | null {
  if (!preview || typeof preview !== 'object') return null;
  const data = preview as DeliveryFeePreviewLike;
  return data.far_delivery_quotes?.[0] || data.fees?.[0] || null;
}

export function deliveryPromiseLabel(vendor?: VendorLike | null): string {
  return vendor?.estimated_delivery_label || vendor?.far_order_eta_label || (vendor?.estimated_delivery_minutes ? `${vendor.estimated_delivery_minutes} mins` : 'Delivery time shown at checkout');
}

export function shopArrivalLabel(vendor?: VendorLike | null): string {
  return deliveryPromiseLabel(vendor);
}

export function isFastDeliveryVendor(vendor?: VendorLike | null): boolean {
  if (!vendor || vendor.is_far_delivery || vendor.within_instant_radius === false) return false;
  if (vendor.estimated_delivery_minutes != null && vendor.estimated_delivery_minutes !== '') {
    return toNumber(vendor.estimated_delivery_minutes, 9999) <= 30;
  }
  const minutes = String(vendor.estimated_delivery_label || '').match(/\d+/)?.[0];
  return minutes ? Number(minutes) <= 30 : true;
}

export function compareVendors(left: VendorLike, right: VendorLike, mode: 'nearest' | 'delivery' | 'rating' = 'nearest'): number {
  if (mode === 'rating') return toNumber(right.average_rating) - toNumber(left.average_rating);
  if (mode === 'delivery') return toNumber(left.estimated_delivery_minutes, 9999) - toNumber(right.estimated_delivery_minutes, 9999);
  return toNumber(left.distance_km, 9999) - toNumber(right.distance_km, 9999);
}

export function collectCategoryKeys(category?: CategoryLike | null): string[] {
  if (!category) return [];
  return [category.id, category.slug, category.name, ...(category.children || []).flatMap((child) => collectCategoryKeys(child))]
    .map(normalizeKey)
    .filter(Boolean);
}

export function productMatchesCategory(product: ProductLike, selectedCategory: string, categories: CategoryLike[] = []): boolean {
  if (selectedCategory === 'all') return true;
  const selected = findCategoryBySlug(categories, selectedCategory);
  const selectedKeys = selected ? collectCategoryKeys(selected) : [normalizeKey(selectedCategory)];
  const productKeys = collectCategoryKeys(product.category);
  return selectedKeys.some((key) => productKeys.includes(key));
}

export function findCategoryBySlug(categories: CategoryLike[], slug: string): CategoryLike | null {
  const target = normalizeKey(slug);
  for (const category of categories) {
    if (normalizeKey(category.slug) === target) return category;
    const child = findCategoryBySlug(category.children || [], slug);
    if (child) return child;
  }
  return null;
}

export function searchProducts(products: ProductLike[], term: string): ProductLike[] {
  const query = normalizeKey(term);
  if (!query) return [];
  return products
    .map((product, index) => ({ product, index, score: productSearchScore(product, query) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map((item) => item.product);
}

export function searchVendors(vendors: VendorLike[], term: string): VendorLike[] {
  const query = normalizeKey(term);
  if (!query) return [];
  return vendors.filter((vendor) => `${vendor.store_name || ''} ${vendor.description || ''} ${vendor.city || ''} ${vendor.products?.map((product) => product.name).join(' ') || ''}`.toLowerCase().includes(query));
}

export function productSearchScore(product: ProductLike, term: string): number {
  const query = normalizeKey(term);
  if (!query) return 0;
  const productName = normalizeKey(product.name);
  const categoryName = normalizeKey(product.category?.name);
  const categorySlug = normalizeKey(product.category?.slug);
  let score = 0;
  if (productName === query) score += 120;
  else if (productName.startsWith(query)) score += 100;
  else if (productName.includes(query)) score += 85;
  if (categoryName === query || categorySlug === query) score += 75;
  else if (categoryName.includes(query) || categorySlug.includes(query)) score += 55;
  for (const token of query.split(/\s+/).filter(Boolean)) {
    if (productName.includes(token)) score += 18;
    if (categoryName.includes(token) || categorySlug.includes(token)) score += 12;
  }
  return score;
}

export function visibleCategoryTree(vendors: VendorLike[], catalogCategories: CategoryLike[] = []): CategoryLike[] {
  const keys = new Set<string>();
  const categoryMap = new Map<string, { category: CategoryLike; count: number; firstIndex: number }>();
  vendors.forEach((vendor, vendorIndex) => {
    (vendor.products || []).forEach((product, productIndex) => {
      const category = product.category;
      if (!category || toNumber(product.stock) <= 0) return;
      collectCategoryKeys(category).forEach((key) => keys.add(key));
      if (category.parent) keys.add(normalizeKey(category.parent));
      if (category.parent_name) keys.add(normalizeKey(category.parent_name));
      const key = category.id || category.slug || category.name || `${vendor.id || 'vendor'}-${productIndex}`;
      const current = categoryMap.get(key);
      if (current) current.count += 1;
      else categoryMap.set(key, { category, count: 1, firstIndex: vendorIndex });
    });
  });
  if (catalogCategories.length) {
    return catalogCategories
      .map((category) => {
        const children = (category.children || []).filter((child) => collectCategoryKeys(child).some((key) => keys.has(key)));
        const selfVisible = [category.id, category.slug, category.name].map(normalizeKey).some((key) => keys.has(key));
        return selfVisible || children.length ? { ...category, children } : null;
      })
      .filter(Boolean) as CategoryLike[];
  }
  return Array.from(categoryMap.values())
    .sort((left, right) => right.count - left.count || left.firstIndex - right.firstIndex || String(left.category.name || '').localeCompare(String(right.category.name || '')))
    .map((item) => item.category);
}

export function hasProductOffer(product: ProductLike): boolean {
  return toNumber(product.compare_price) > toNumber(product.price);
}

export function productDiscountLabel(product: ProductLike): string {
  if (!hasProductOffer(product)) return '';
  return `${Math.round(((toNumber(product.compare_price) - toNumber(product.price)) / toNumber(product.compare_price)) * 100)}% OFF`;
}

export function hasVendorOffer(vendor: VendorLike): boolean {
  return !!vendor.is_featured || (vendor.products || []).some(hasProductOffer);
}

export function vendorOfferLabel(vendor: VendorLike): string {
  return (vendor.products || []).map(productDiscountLabel).find(Boolean) || (vendor.is_featured ? 'Featured' : '');
}

export function vendorRatingLabel(vendor: VendorLike): string {
  return toNumber(vendor.total_ratings) > 0 ? toNumber(vendor.average_rating).toFixed(1) : '';
}

export interface ProductDtoLike extends ProductLike {
  slug?: string;
  tax_rate?: unknown;
  sku?: string;
  min_order_quantity?: unknown;
  is_available?: boolean;
  in_stock?: boolean;
}

export interface CartItemDtoLike {
  id?: string;
  product?: ProductDtoLike | null;
  quantity?: unknown;
  subtotal?: unknown;
}

export interface CartDtoLike {
  id?: string;
  items?: CartItemDtoLike[];
  total_items?: unknown;
  total_amount?: unknown;
}

export interface AddressDtoLike {
  id?: string;
  label?: string;
  full_name?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  landmark?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  is_default?: boolean;
}

export interface CustomerAddressLike {
  id?: string;
  label?: string;
  name?: string;
  line?: string;
  phone?: string;
  isDefault?: boolean;
  city?: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  raw?: AddressDtoLike;
}

export interface OrderItemDtoLike {
  id?: string;
  product?: string | ProductDtoLike | null;
  product_name?: string;
  name?: string;
  product_price?: unknown;
  price?: unknown;
  quantity?: unknown;
  subtotal?: unknown;
  product_image?: string | null;
}

export interface OrderDtoLike {
  id?: string;
  order_number?: string;
  vendor?: string;
  vendor_info?: { id?: string } | null;
  status?: string;
  payment_method?: string;
  is_payment_verified?: boolean;
  total?: unknown;
  total_amount?: unknown;
  amount?: unknown;
  items?: OrderItemDtoLike[];
  placed_at?: string;
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
  raw: unknown;
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
  deliveryQuotes: Record<string, unknown>[];
  farDeliveryQuotes: Record<string, unknown>[];
  primaryQuote: Record<string, unknown> | null;
  etaLabel: string;
  instantRadiusKm: number;
  instantRadiusLabel: string;
}

const UNKNOWN_CATEGORY: CategoryLike = { id: 'unknown', name: 'Products', slug: 'products', image: null, icon_name: 'category' };

export function normalizeProductDto(product: ProductDtoLike | null | undefined): Record<string, unknown> {
  const source = product || {};
  const category = source.category && typeof source.category === 'object' ? source.category : UNKNOWN_CATEGORY;
  const images = Array.isArray(source.images) ? source.images : [];
  return {
    ...source,
    id: source.id || 'product',
    name: source.name || source.catalog_product?.name || 'Product',
    description: source.description || '',
    price: toNumber(source.price),
    compare_price: source.compare_price === undefined || source.compare_price === null ? null : toNumber(source.compare_price),
    stock: toNumber(source.stock),
    unit: source.unit || source.weight || source.catalog_product?.unit || '1 unit',
    category,
    primary_image: source.primary_image || images.find((image) => image.is_primary)?.image || images[0]?.image || null,
    average_rating: toNumber(source.average_rating),
    total_ratings: toNumber(source.total_ratings),
  };
}

export function normalizeVendorDto(vendor: VendorLike | null | undefined): Record<string, unknown> {
  const source = vendor || {};
  return {
    ...source,
    id: source.id || 'vendor',
    store_name: source.store_name || 'Store',
    description: source.description || '',
    banner: source.banner || source.logo || null,
    logo: source.logo || null,
    average_rating: toNumber(source.average_rating),
    total_ratings: toNumber(source.total_ratings),
    products: Array.isArray(source.products) ? source.products.map((product) => normalizeProductDto(product)) : [],
  };
}

export function normalizeCart(cart: CartDtoLike | null | undefined): Record<string, unknown> {
  const source = cart || {};
  const items = Array.isArray(source.items) ? source.items.map((item) => ({
    ...item,
    id: item.id || 'cart-item',
    product: normalizeProductDto(item.product),
    quantity: toNumber(item.quantity),
    subtotal: toNumber(item.subtotal),
  })) : [];
  const totalItems = toNumber(source.total_items) || items.reduce((sum, item) => sum + toNumber(item.quantity), 0);
  return {
    ...source,
    id: source.id || 'cart',
    items,
    total_items: totalItems,
    total_amount: toNumber(source.total_amount),
  };
}

export function normalizeOrderItem(item: OrderItemDtoLike, order?: OrderDtoLike): CustomerOrderItemView {
  const product = item.product && typeof item.product === 'object' ? item.product : null;
  const price = toNumber(item.product_price ?? item.price ?? product?.price);
  return {
    id: typeof item.product === 'string' ? item.product : item.id || product?.id || 'order-item',
    name: item.product_name || item.name || product?.name || 'Product',
    unit: `Qty ${toNumber(item.quantity, 1) || 1}`,
    price,
    mrp: price,
    discount: '',
    image: item.product_image || product?.primary_image || product?.images?.find((image) => image.is_primary)?.image || product?.images?.[0]?.image || DEFAULT_PRODUCT_IMAGE,
    category: 'Order item',
    rating: 0,
    storeId: order?.vendor || order?.vendor_info?.id || '',
    raw: item,
  };
}

export function getOrderStatusMeta(status: string): { status: 'Active' | 'Delivered' | 'Cancelled'; label: string; tone: 'active' | 'success' | 'danger'; color: string } {
  const key = normalizeKey(status);
  if (key === 'delivered') return { status: 'Delivered', label: 'Delivered', tone: 'success', color: '#22C55E' };
  if (key === 'cancelled' || key === 'canceled') return { status: 'Cancelled', label: 'Cancelled', tone: 'danger', color: '#EF4444' };
  return { status: 'Active', label: statusLabel(status || 'active'), tone: 'active', color: '#6C2BFF' };
}

export function formatCustomerDate(value: unknown, locale = 'en-IN'): string {
  const date = value ? new Date(String(value)) : new Date();
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(locale);
}

export function formatCustomerTime(value: unknown, locale = 'en-IN'): string {
  const date = value ? new Date(String(value)) : new Date();
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

export function normalizeOrder(order: OrderDtoLike | null | undefined): CustomerOrderView {
  const source = order || {};
  const status = getOrderStatusMeta(source.status || '');
  return {
    id: source.id || source.order_number || 'order',
    date: formatCustomerDate(source.placed_at),
    time: formatCustomerTime(source.placed_at),
    amount: toNumber(source.total ?? source.total_amount ?? source.amount),
    items: (source.items || []).map((item) => normalizeOrderItem(item, source)),
    status: status.status,
    payment: `${source.payment_method || 'Payment'} - ${source.is_payment_verified ? 'Paid' : 'Pending'}`,
    raw: source,
  };
}

export function normalizeOrderDto(order: OrderDtoLike | null | undefined): Record<string, unknown> {
  const source = order || {};
  return {
    ...source,
    id: source.id || source.order_number || 'order',
    subtotal: toNumber((source as Record<string, unknown>)['subtotal']),
    delivery_fee: toNumber((source as Record<string, unknown>)['delivery_fee']),
    discount: toNumber((source as Record<string, unknown>)['discount']),
    total: toNumber(source.total ?? source.total_amount ?? source.amount),
    items: Array.isArray(source.items) ? source.items.map((item) => ({
      ...item,
      quantity: toNumber(item.quantity),
      subtotal: toNumber(item.subtotal),
    })) : [],
  };
}

export function normalizeAddress(address: AddressDtoLike | null | undefined): CustomerAddressLike {
  const source = address || {};
  const label = addressDisplayLabel(source);
  return {
    id: source.id || '',
    label,
    name: source.full_name || label,
    line: [source.address_line1, source.address_line2, source.landmark, source.city, source.state, source.postal_code].filter(Boolean).join(', '),
    phone: source.phone || '',
    isDefault: !!source.is_default,
    city: source.city,
    state: source.state,
    pincode: source.postal_code,
    landmark: source.landmark,
    latitude: source.latitude == null || source.latitude === '' ? null : toNumber(source.latitude),
    longitude: source.longitude == null || source.longitude === '' ? null : toNumber(source.longitude),
    raw: source,
  };
}

export function addressDisplayLabel(address: AddressDtoLike): string {
  const label = String(address.label || '').toLowerCase();
  if (label === 'work') return 'Office';
  if (label === 'home') return 'Home';
  return toTitle(label || address.landmark || 'Other');
}

export function createAddressPayload(address: CustomerAddressLike): Record<string, unknown> {
  const label = String(address.label || '').toLowerCase() === 'office'
    ? 'work'
    : String(address.label || '').toLowerCase() === 'home'
      ? 'home'
      : 'other';
  return {
    label,
    full_name: address.name || 'Customer',
    phone: address.phone || '',
    address_line1: address.line || '',
    address_line2: '',
    landmark: address.landmark || '',
    city: address.city || address.raw?.city || '',
    state: address.state || address.raw?.state || '',
    postal_code: address.pincode || address.raw?.postal_code || '',
    latitude: address.latitude ?? null,
    longitude: address.longitude ?? null,
    is_default: true,
  };
}

export function getCouponDiscount(coupon: Record<string, unknown> | null | undefined): number {
  if (!coupon) return 0;
  return toNumber(coupon['discount'] ?? coupon['discount_amount'] ?? coupon['discount_value']);
}

export function getDeliveryPreviewSummary(preview: DeliveryFeePreviewLike | unknown): DeliveryPreviewSummary {
  const data = preview && typeof preview === 'object' ? preview as DeliveryFeePreviewLike : {};
  const deliveryQuotes = Array.isArray(data.fees) ? data.fees : [];
  const farDeliveryQuotes = Array.isArray(data.far_delivery_quotes) ? data.far_delivery_quotes : [];
  const primaryQuote = getPrimaryDeliveryQuote(data);
  const instantRadiusKm = toNumber(primaryQuote?.['instant_radius_km']);
  return {
    deliveryFee: getDeliveryFee(data),
    requiresFarDeliveryConfirmation: !!data.requires_far_delivery_confirmation,
    deliveryQuotes,
    farDeliveryQuotes,
    primaryQuote,
    etaLabel: String(primaryQuote?.['estimated_delivery_label'] || primaryQuote?.['far_order_eta_label'] || 'ETA unavailable'),
    instantRadiusKm,
    instantRadiusLabel: instantRadiusKm ? `${instantRadiusKm.toFixed(Number.isInteger(instantRadiusKm) ? 0 : 1)} km` : 'the instant delivery radius',
  };
}

export function getCheckoutSummary(input: {
  subtotal?: unknown;
  cartTotal?: unknown;
  deliveryFee?: unknown;
  handlingFee?: unknown;
  couponDiscount?: unknown;
  walletDiscount?: unknown;
  loyaltyDiscount?: unknown;
  walletBalance?: unknown;
  itemCount?: unknown;
}): CheckoutSummary {
  const subtotal = toNumber(input.subtotal ?? input.cartTotal);
  const deliveryFee = toNumber(input.deliveryFee);
  const handlingFee = toNumber(input.handlingFee);
  const couponDiscount = toNumber(input.couponDiscount);
  const walletDiscount = toNumber(input.walletDiscount);
  const loyaltyDiscount = toNumber(input.loyaltyDiscount);
  const discount = couponDiscount + walletDiscount + loyaltyDiscount;
  const totalBeforeWallet = Math.max(subtotal + deliveryFee + handlingFee - couponDiscount - loyaltyDiscount, 0);
  const walletBalance = toNumber(input.walletBalance);
  const maxWalletUsable = Math.min(walletBalance, totalBeforeWallet);
  return {
    subtotal,
    deliveryFee,
    handlingFee,
    couponDiscount,
    walletDiscount,
    loyaltyDiscount,
    discount,
    total: Math.max(subtotal + deliveryFee + handlingFee - discount, 0),
    maxWalletUsable,
    recommendedSavings: Math.max(couponDiscount + loyaltyDiscount + maxWalletUsable, 0),
    itemCount: toNumber(input.itemCount),
  };
}

export function createCheckoutPayload(input: {
  addressId: string;
  paymentMethod: string;
  couponCode?: string | null;
  confirmFarDelivery?: boolean;
  scheduledFor?: string | null;
  paymentProof?: Record<string, unknown>;
}): Record<string, unknown> {
  const selectedPayment = input.paymentMethod || 'cod';
  const paymentMethod = selectedPayment.startsWith('razorpay') || selectedPayment === 'upi' ? 'razorpay' : selectedPayment;
  return {
    delivery_address_id: input.addressId,
    payment_method: paymentMethod,
    coupon_code: input.couponCode || undefined,
    confirm_far_delivery: !!input.confirmFarDelivery,
    scheduled_for: input.scheduledFor || undefined,
    ...(input.paymentProof || {}),
  };
}
