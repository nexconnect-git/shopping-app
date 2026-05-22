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
  description: string;
  enabled: boolean;
  reasonUnavailable?: string;
  requiresConfirmation?: boolean;
}

export interface PaymentEligibilityResult {
  methods: AvailablePaymentMethod[];
  hasAvailableMethod: boolean;
  reasonUnavailable?: string;
}

export function getPaymentMethodMeta(id: string): AvailablePaymentMethod {
  const methods: Record<string, Omit<AvailablePaymentMethod, 'id' | 'enabled'>> = {
    cod: {
      label: 'UPI at Delivery',
      description: 'Confirm now and pay the delivery partner using UPI at delivery.',
      requiresConfirmation: true,
    },
    razorpay_upi: { label: 'UPI', description: 'Pay securely with your UPI app.' },
    razorpay_card: { label: 'Card', description: 'Credit and debit cards via Razorpay.' },
    razorpay_wallet: { label: 'Wallet', description: 'Supported wallets via Razorpay.' },
    razorpay_netbanking: { label: 'Net banking', description: 'Pay from supported banks.' },
    razorpay: { label: 'Online payment', description: 'Cards, UPI, net banking, and wallets.' },
  };
  const meta = methods[id] || { label: titleCase(id.replace(/_/g, ' ')), description: 'Payment method' };
  return { id, enabled: true, ...meta };
}

export function normalizeAvailablePaymentMethods(response: unknown): PaymentEligibilityResult {
  const record = (response && typeof response === 'object' ? response : {}) as Record<string, unknown>;
  const rawMethods = Array.isArray(record['methods'])
    ? record['methods']
    : Array.isArray(record['enabled_payment_methods'])
      ? record['enabled_payment_methods']
      : [];
  const methods = rawMethods.map((method) => {
    if (typeof method === 'string') return getPaymentMethodMeta(method);
    const item = method as Record<string, unknown>;
    return {
      ...getPaymentMethodMeta(String(item['id'] || item['key'] || '')),
      label: String(item['label'] || item['name'] || getPaymentMethodMeta(String(item['id'] || item['key'] || '')).label),
      description: String(item['description'] || getPaymentMethodMeta(String(item['id'] || item['key'] || '')).description),
      enabled: item['enabled'] !== false,
      reasonUnavailable: item['reasonUnavailable'] ? String(item['reasonUnavailable']) : item['reason_unavailable'] ? String(item['reason_unavailable']) : undefined,
    };
  });
  return {
    methods,
    hasAvailableMethod: methods.some((method) => method.enabled),
    reasonUnavailable: methods.some((method) => method.enabled) ? undefined : 'No checkout payment methods are available right now.',
  };
}

export function isWalletFeatureEnabled(value: unknown): boolean {
  const methods = Array.isArray(value)
    ? value
    : normalizeAvailablePaymentMethods(value).methods;
  return methods.some((method) => {
    const id = typeof method === 'string' ? method : String((method as AvailablePaymentMethod).id || '');
    const enabled = typeof method === 'string' ? true : (method as AvailablePaymentMethod).enabled !== false;
    return enabled && id.toLowerCase().includes('wallet');
  });
}

export function isMembershipFeatureEnabled(config: unknown): boolean {
  const record = config && typeof config === 'object' ? config as Record<string, unknown> : {};
  const explicit = record['membership_enabled'] ?? record['membershipEnabled'] ?? record['customer_membership_enabled'];
  if (explicit === undefined || explicit === null) return false;
  return explicit === true || String(explicit).toLowerCase() === 'true' || String(explicit) === '1';
}

function titleCase(value: string): string {
  return value.split(/\s+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}
