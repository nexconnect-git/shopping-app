export type ValidationResult = string | null;
export type ValidationErrorMap = Record<string, string>;

export const MAX_CART_QUANTITY = 99;

export function compact(value: string | null | undefined): string {
  return (value || '').trim();
}

export function digitsOnly(value: string | null | undefined): string {
  return compact(value).replace(/\D/g, '');
}

export function validateRequired(value: string | null | undefined, label: string): ValidationResult {
  return compact(value) ? null : `${label} is required.`;
}

export function validateMinLength(value: string | null | undefined, label: string, min: number): ValidationResult {
  return compact(value).length >= min ? null : `${label} must be at least ${min} characters.`;
}

export function validateEmail(value: string | null | undefined, required = false): ValidationResult {
  const email = compact(value);
  if (!email) return required ? 'Email is required.' : null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : 'Enter a valid email address.';
}

export function validatePhone(value: string | null | undefined): ValidationResult {
  const phone = digitsOnly(value);
  if (!phone) return 'Phone number is required.';
  return phone.length >= 10 && phone.length <= 15 ? null : 'Enter a valid phone number.';
}

export function validateOtp(value: string | null | undefined): ValidationResult {
  const otp = digitsOnly(value);
  if (!otp) return 'OTP is required.';
  return otp.length >= 4 && otp.length <= 8 ? null : 'Enter a valid OTP.';
}

export function validatePincode(value: string | null | undefined): ValidationResult {
  const pincode = digitsOnly(value);
  if (!pincode) return 'PIN code is required.';
  return /^[1-9][0-9]{5}$/.test(pincode) ? null : 'Enter a valid 6-digit PIN code.';
}

export function validateLatitude(value: number | string | null | undefined): ValidationResult {
  if (value === null || value === undefined || value === '') return 'Latitude is required.';
  const latitude = Number(value);
  if (!Number.isFinite(latitude)) return 'Latitude is required.';
  return latitude >= -90 && latitude <= 90 ? null : 'Latitude must be between -90 and 90.';
}

export function validateLongitude(value: number | string | null | undefined): ValidationResult {
  if (value === null || value === undefined || value === '') return 'Longitude is required.';
  const longitude = Number(value);
  if (!Number.isFinite(longitude)) return 'Longitude is required.';
  return longitude >= -180 && longitude <= 180 ? null : 'Longitude must be between -180 and 180.';
}

export function validateGeoCoordinates(value: {
  latitude?: number | string | null;
  longitude?: number | string | null;
} | null | undefined): ValidationErrorMap {
  return collectFieldErrors({
    latitude: validateLatitude(value?.latitude),
    longitude: validateLongitude(value?.longitude),
  });
}

export function validateQuantity(quantity: number): ValidationResult {
  if (!Number.isInteger(quantity) || quantity < 1) return 'Quantity must be at least 1.';
  if (quantity > MAX_CART_QUANTITY) return `Quantity cannot be more than ${MAX_CART_QUANTITY}.`;
  return null;
}

export function validateMoney(value: string | number | null | undefined, label: string, required = false): ValidationResult {
  const raw = typeof value === 'number' ? String(value) : compact(value);
  if (!raw) return required ? `${label} is required.` : null;
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0) return `${label} must be a valid amount.`;
  return null;
}

export function validateCode(value: string | null | undefined, label: string): ValidationResult {
  const code = compact(value);
  if (!code) return `${label} is required.`;
  return /^[A-Za-z0-9_-]{3,32}$/.test(code) ? null : `${label} must be 3-32 letters or numbers.`;
}

export function firstValidationError(...results: ValidationResult[]): ValidationResult {
  return results.find(Boolean) || null;
}

export function collectFieldErrors(fields: Record<string, ValidationResult>): ValidationErrorMap {
  return Object.entries(fields).reduce<ValidationErrorMap>((errors, [key, error]) => {
    if (error) errors[key] = error;
    return errors;
  }, {});
}

export function hasValidationErrors(errors: ValidationErrorMap): boolean {
  return Object.keys(errors).length > 0;
}

export function validateCustomerAddress(address: Record<string, unknown> | null | undefined): ValidationErrorMap {
  const line = address?.['address_line1'] ?? address?.['line'] ?? '';
  const postalCode = address?.['postal_code'] ?? address?.['pincode'] ?? '';
  const latitude = address?.['latitude'];
  const longitude = address?.['longitude'];
  return collectFieldErrors({
    full_name: validateRequired(String(address?.['full_name'] ?? address?.['name'] ?? ''), 'Receiver name'),
    phone: validatePhone(String(address?.['phone'] ?? '')),
    address_line1: validateRequired(String(line), 'House, street or area'),
    city: validateRequired(String(address?.['city'] ?? ''), 'City'),
    state: validateRequired(String(address?.['state'] ?? ''), 'State'),
    postal_code: validatePincode(String(postalCode)),
    label: validateAddressType(String(address?.['label'] ?? address?.['type'] ?? '')),
    latitude: validateLatitude(latitude as number | string | null | undefined),
    longitude: validateLongitude(longitude as number | string | null | undefined),
  });
}

export function isCustomerAddressComplete(address: Record<string, unknown> | null | undefined): boolean {
  return !hasValidationErrors(validateCustomerAddress(address));
}

export function validateAddressType(value: string | null | undefined): ValidationResult {
  const normalized = compact(value).toLowerCase();
  if (!normalized) return 'Address type is required.';
  return ['home', 'work', 'other'].includes(normalized) ? null : 'Address type must be home, work, or other.';
}

export function validatePaymentSelection(value: string | null | undefined): ValidationResult {
  return compact(value) ? null : 'Select a payment method.';
}

export function validateCouponCode(value: string | null | undefined): ValidationResult {
  return validateCode(value, 'Coupon code');
}

export function validateScheduleSlot(slot: Record<string, unknown> | null | undefined): ValidationErrorMap {
  return collectFieldErrors({
    id: validateRequired(String(slot?.['id'] ?? ''), 'Delivery slot'),
    startAt: validateRequired(String(slot?.['startAt'] ?? slot?.['start_at'] ?? ''), 'Slot start time'),
    endAt: validateRequired(String(slot?.['endAt'] ?? slot?.['end_at'] ?? ''), 'Slot end time'),
  });
}

export function validateCartStoreLock(input: {
  existingStoreId?: string | null;
  incomingStoreId?: string | null;
  existingStoreName?: string | null;
  incomingStoreName?: string | null;
}): { allowed: boolean; conflict?: { message: string; existingStoreName: string; incomingStoreName: string } } {
  const existingStoreId = compact(input.existingStoreId || undefined);
  const incomingStoreId = compact(input.incomingStoreId || undefined);
  if (!existingStoreId || !incomingStoreId || existingStoreId === incomingStoreId) {
    return { allowed: true };
  }
  const existingStoreName = compact(input.existingStoreName || undefined) || 'the current store';
  const incomingStoreName = compact(input.incomingStoreName || undefined) || 'this store';
  return {
    allowed: false,
    conflict: {
      existingStoreName,
      incomingStoreName,
      message: `Your cart has items from ${existingStoreName}. Do you want to clear the cart and add items from ${incomingStoreName}?`,
    },
  };
}

export function validateCheckoutInput(input: {
  isAuthenticated?: boolean;
  cartItems?: unknown[];
  selectedAddress?: Record<string, unknown> | null;
  selectedPaymentMethod?: string | null;
  serviceability?: { isServiceable?: boolean; reason?: string } | null;
  codUpiConfirmed?: boolean;
}): { valid: boolean; errors: ValidationErrorMap } {
  const errors: ValidationErrorMap = {};
  if (!input.isAuthenticated) errors['auth'] = 'Please sign in before placing your order.';
  if (!input.cartItems?.length) errors['cart'] = 'Your cart is empty.';
  if (!input.selectedAddress) {
    errors['address'] = 'Select a delivery address before checkout.';
  } else {
    Object.assign(errors, prefixErrors('address.', validateCustomerAddress(input.selectedAddress)));
  }
  const paymentError = validatePaymentSelection(input.selectedPaymentMethod);
  if (paymentError) errors['payment'] = paymentError;
  if (input.serviceability && input.serviceability.isServiceable === false) {
    errors['serviceability'] = input.serviceability.reason || 'Selected address is not serviceable.';
  }
  if (input.selectedPaymentMethod === 'cod' && !input.codUpiConfirmed) {
    errors['codUpiConfirmed'] = 'Confirm UPI payment at delivery before placing a COD order.';
  }
  return { valid: !hasValidationErrors(errors), errors };
}

function prefixErrors(prefix: string, errors: ValidationErrorMap): ValidationErrorMap {
  return Object.entries(errors).reduce<ValidationErrorMap>((next, [key, value]) => {
    next[`${prefix}${key}`] = value;
    return next;
  }, {});
}
