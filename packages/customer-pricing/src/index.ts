export interface CartItem {
  quantity: number;
  price: number;
  mrp?: number;
  taxRatePercent?: number;
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

export function calculateItemSubtotal(items: CartItem[]): number {
  return roundMoney(items.reduce((sum, item) => sum + toNumber(item.price) * toNumber(item.quantity), 0));
}

export function calculateDiscountTotal(input: { productDiscount?: number; couponDiscount?: CouponDiscount | number }): number {
  return roundMoney(toNumber(input.productDiscount) + couponDiscountAmount(input.couponDiscount));
}

export function calculateTax(input: { taxableAmount: number; taxConfig?: TaxConfig }): number {
  return roundMoney(toNumber(input.taxableAmount) * toNumber(input.taxConfig?.taxRatePercent) / 100);
}

export function calculatePlatformFeeDisplay(feeConfig?: FeeConfig): number {
  return roundMoney(feeConfig?.platformFee || 0);
}

export function calculateDeliveryFeeDisplay(deliveryFee?: number): number {
  return roundMoney(deliveryFee || 0);
}

export function calculateFinalPayableDisplay(input: PricingInput): PricingResult {
  const itemSubtotal = calculateItemSubtotal(input.items);
  const deliveryFee = calculateDeliveryFeeDisplay(input.deliveryFee);
  const platformFee = calculatePlatformFeeDisplay(input.feeConfig);
  const packagingFee = roundMoney(input.feeConfig?.packagingFee || 0);
  const smallCartFee = itemSubtotal > 0 && itemSubtotal < toNumber(input.feeConfig?.smallCartThreshold)
    ? roundMoney(input.feeConfig?.smallCartFee || 0)
    : 0;
  const surgeFee = roundMoney(input.feeConfig?.surgeFee || 0);
  const productDiscount = roundMoney(input.productDiscount || calculateProductDiscount(input.items));
  const couponDiscount = couponDiscountAmount(input.couponDiscount);
  const taxableAmount = itemSubtotal
    + (input.taxConfig?.taxableIncludesDelivery ? deliveryFee : 0)
    + (input.taxConfig?.taxableIncludesPlatformFee ? platformFee : 0);
  const tax = calculateTax({ taxableAmount, taxConfig: input.taxConfig });
  const beforeRounding = Math.max(0, itemSubtotal - couponDiscount + deliveryFee + platformFee + packagingFee + smallCartFee + tax + surgeFee);
  const finalPayableAmount = applyRounding(beforeRounding, input.feeConfig?.roundingMode || 'nearest_rupee');
  return {
    displayOnly: true,
    breakup: {
      itemSubtotal,
      productDiscount,
      couponDiscount,
      deliveryFee,
      platformFee,
      packagingFee,
      smallCartFee,
      tax,
      surgeFee,
      roundingAdjustment: roundMoney(finalPayableAmount - beforeRounding),
      finalPayableAmount,
    },
  };
}

function calculateProductDiscount(items: CartItem[]): number {
  return roundMoney(items.reduce((sum, item) => {
    const mrp = toNumber(item.mrp ?? item.price);
    return sum + Math.max(0, mrp - toNumber(item.price)) * toNumber(item.quantity);
  }, 0));
}

function couponDiscountAmount(discount?: CouponDiscount | number): number {
  if (typeof discount === 'number') return roundMoney(discount);
  return roundMoney(discount?.amount || 0);
}

function applyRounding(value: number, mode: FeeConfig['roundingMode']): number {
  if (mode === 'none') return roundMoney(value);
  if (mode === 'ceil_rupee') return Math.ceil(value);
  if (mode === 'floor_rupee') return Math.floor(value);
  return Math.round(value);
}

function roundMoney(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

function toNumber(value: unknown): number {
  const next = Number(value ?? 0);
  return Number.isFinite(next) ? next : 0;
}
