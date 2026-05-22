export interface CustomerErrorMessage {
  code: string;
  message: string;
}

export const CUSTOMER_ERROR_MESSAGES: Record<string, string> = {
  address_not_serviceable: 'This address is outside the selected store delivery area.',
  cart_store_conflict: 'Your cart has items from another store. Clear the cart to add this item.',
  checkout_price_changed: 'Your order total changed. Please review the updated price before placing the order.',
  coupon_invalid: 'This coupon cannot be applied to your current cart.',
  delivery_fee_changed: 'Delivery fee changed for the selected address. Please review the updated total.',
  different_state_address: 'This address is in a different state and cannot be used for this order.',
  email_unavailable: 'Email service is temporarily unavailable. Please try again in a few minutes.',
  filter_no_results: 'No products matched these filters. Try clearing one or two filters.',
  invalid_email: 'Enter a valid email address.',
  invalid_phone: 'Enter a valid mobile number.',
  otp_expired: 'This OTP has expired. Please request a new one.',
  otp_send_failed: 'We could not send the OTP email. Please try again.',
  otp_too_many_attempts: 'Too many OTP attempts. Please request a new code.',
  otp_wrong: 'The OTP is incorrect. Please check the code and try again.',
  payment_method_unavailable: 'This payment method is unavailable for the current order.',
  store_search_no_results: 'No products were found in this store.',
  validation_failed: 'Please check the highlighted fields and try again.'
};

const RAW_ERROR_MATCHES: Array<[RegExp, string]> = [
  [/email.*required|invalid email/i, 'invalid_email'],
  [/phone.*required|invalid phone|mobile/i, 'invalid_phone'],
  [/otp.*expired/i, 'otp_expired'],
  [/too many|maximum.*attempt/i, 'otp_too_many_attempts'],
  [/otp|code/i, 'otp_wrong'],
  [/serviceable|delivery area/i, 'address_not_serviceable'],
  [/different state|state lock/i, 'different_state_address'],
  [/price.*changed|total.*changed|mismatch/i, 'checkout_price_changed'],
  [/coupon|offer/i, 'coupon_invalid'],
  [/payment.*unavailable|gateway/i, 'payment_method_unavailable'],
  [/email.*service|smtp|mail/i, 'email_unavailable']
];

export function messageForCustomerError(code: string, fallback = 'Something went wrong. Please try again.'): string {
  return CUSTOMER_ERROR_MESSAGES[code] ?? fallback;
}

export function mapCustomerError(error: unknown, fallback = 'Something went wrong. Please try again.'): CustomerErrorMessage {
  const candidate = extractErrorCode(error);
  if (candidate && CUSTOMER_ERROR_MESSAGES[candidate]) {
    return { code: candidate, message: CUSTOMER_ERROR_MESSAGES[candidate] };
  }

  const rawMessage = extractErrorMessage(error);
  for (const [pattern, code] of RAW_ERROR_MATCHES) {
    if (pattern.test(rawMessage)) {
      return { code, message: CUSTOMER_ERROR_MESSAGES[code] ?? fallback };
    }
  }

  return { code: candidate || 'unknown_error', message: fallback };
}

function extractErrorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  const record = error as Record<string, unknown>;
  const nested = record['error'] && typeof record['error'] === 'object' ? record['error'] as Record<string, unknown> : null;
  return String(record['code'] || record['error_code'] || nested?.['code'] || nested?.['error_code'] || '').trim();
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (!error || typeof error !== 'object') return '';
  const record = error as Record<string, unknown>;
  const nested = record['error'] && typeof record['error'] === 'object' ? record['error'] as Record<string, unknown> : null;
  return String(record['detail'] || record['message'] || record['error'] || nested?.['detail'] || nested?.['message'] || '').trim();
}
