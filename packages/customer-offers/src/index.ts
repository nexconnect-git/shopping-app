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

export interface CouponDiscount {
  code?: string;
  amount: number;
  type?: 'percentage' | 'fixed' | 'free_delivery';
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

export function normalizeCouponValidationResult(raw: unknown, code = ''): CouponValidationResult {
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const valid = Boolean(record['valid'] ?? !record['error']);
  const normalizedCode = String(record['code'] || code).toUpperCase();
  return {
    valid,
    code: normalizedCode,
    discount: record['discount'] || record['discount_amount']
      ? { code: normalizedCode, amount: toNumber(record['discount'] ?? record['discount_amount']) }
      : undefined,
    message: record['message'] ? String(record['message']) : undefined,
    rejectionReason: !valid ? String(record['error'] || record['rejectionReason'] || record['rejection_reason'] || 'Coupon is not valid for this order.') : undefined,
  };
}

export function couponDisplayCode(value: unknown): string {
  const record = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return String(record['code'] || record['coupon_code'] || '').toUpperCase();
}

function toNumber(value: unknown): number {
  const next = Number(value ?? 0);
  return Number.isFinite(next) ? next : 0;
}
