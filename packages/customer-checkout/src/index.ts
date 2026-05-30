export const COD_UPI_CONFIRMATION_MESSAGE = 'Cash is not accepted at delivery. Even if you choose COD, you must pay the delivery partner using UPI at the time of delivery.';

export interface CheckoutAddressLike {
  label?: string | null;
  line?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  postal_code?: string | null;
}

export interface DeliveryFeeChangeInput {
  currentFee: number;
  nextFee: number;
  currentAddress?: CheckoutAddressLike | null;
  nextAddress?: CheckoutAddressLike | null;
}

export interface CheckoutConfirmationCopy {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  tone: 'warning' | 'danger' | 'default';
}

export interface DeliverySlotLike {
  id?: string | number | null;
  label?: string | null;
  name?: string | null;
  start?: string | null;
  end?: string | null;
  scheduled_for?: string | null;
  scheduledFor?: string | null;
  available?: boolean | null;
}

export interface NormalizedDeliverySlot {
  id: string;
  name: string;
  type: string;
  time: string;
  price: string;
  scheduledFor?: string;
}

export interface PaymentMethodLike {
  id?: string | null;
  key?: string | null;
  method?: string | null;
  label?: string | null;
  name?: string | null;
  description?: string | null;
  subtitle?: string | null;
  icon?: string | null;
  icon_name?: string | null;
  isDefault?: boolean | null;
}

export interface CheckoutPaymentMeta {
  id: string;
  label: string;
  description: string;
  icon: string;
  isDefault?: boolean;
}

export interface UpiAppMeta {
  name: string;
  logo: string;
  className: string;
}

export interface TrackingCoordinateLike {
  lat?: number | string | null;
  lng?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export interface TrackingCoordinate {
  lat: number;
  lng: number;
}

export const DEFAULT_UPI_APPS: UpiAppMeta[] = [
  { name: 'Google Pay', logo: 'GPay', className: 'gpay' },
  { name: 'PhonePe', logo: 'PhonePe', className: 'phonepe' },
  { name: 'Paytm', logo: 'Paytm', className: 'paytm' },
  { name: 'Amazon Pay', logo: 'Amazon', className: 'amazonpay' },
  { name: 'BHIM', logo: 'BHIM', className: 'bhim' },
  { name: 'Other UPI', logo: 'UPI', className: 'upi' },
];

export interface CheckoutPayloadInput {
  addressId: string;
  paymentMethod: string;
  couponCode?: string;
  notes?: string;
  walletAmount?: number;
  loyaltyPoints?: number;
  confirmFarDelivery?: boolean;
  codUpiConfirmed?: boolean;
  scheduledFor?: string | null;
}

export function createCheckoutPayload(input: CheckoutPayloadInput): Record<string, unknown> {
  const selectedPayment = input.paymentMethod || 'cod';
  const paymentMethod = checkoutPaymentMethodForBackend(selectedPayment);
  return {
    delivery_address_id: input.addressId,
    payment_method: paymentMethod,
    payment_rail: selectedPayment,
    coupon_code: input.couponCode || '',
    notes: input.notes || '',
    wallet_amount: input.walletAmount || 0,
    loyalty_points: input.loyaltyPoints || 0,
    confirm_far_delivery: Boolean(input.confirmFarDelivery),
    cod_upi_confirmed: paymentMethod === 'cod' ? Boolean(input.codUpiConfirmed) : undefined,
    scheduled_for: input.scheduledFor || undefined,
  };
}

export function requiresCodUpiConfirmation(paymentMethod: string): boolean {
  return paymentMethod === 'cod';
}

export function checkoutPaymentMethodForBackend(selectedPayment: string): string {
  const key = String(selectedPayment || '').toLowerCase();
  return key.startsWith('razorpay') || key === 'upi' ? 'razorpay' : key || 'cod';
}

export function normalizeCheckoutPaymentMethod(method: string | PaymentMethodLike, isDefault = false): CheckoutPaymentMeta {
  const record = typeof method === 'string' ? {} : method;
  const id = typeof method === 'string'
    ? method
    : String(record.id || record.key || record.method || '').toLowerCase();
  const meta = paymentMethodMeta(id);
  return {
    ...meta,
    label: String(record.label || record.name || meta.label),
    description: String(record.description || record.subtitle || meta.description),
    icon: String(record.icon || record.icon_name || meta.icon),
    isDefault,
  };
}

export function paymentMethodMeta(id: string): CheckoutPaymentMeta {
  const key = String(id || '').toLowerCase();
  if (key.includes('upi')) return { id, label: 'UPI', description: 'Pay securely with your UPI app', icon: 'UPI' };
  if (key.includes('card')) return { id, label: 'Credit or Debit Card', description: 'Processed through Razorpay', icon: 'CC' };
  if (key.includes('wallet')) return { id, label: 'Wallet', description: 'Supported payment wallets', icon: 'WL' };
  if (key.includes('netbanking') || key.includes('bank')) return { id, label: 'Net Banking', description: 'All major banks supported', icon: 'NB' };
  if (key === 'cod') return { id, label: 'Cash on Delivery', description: 'Pay using UPI at delivery', icon: '₹' };
  if (key.includes('razorpay')) return { id, label: 'Online Payment', description: 'Cards, UPI, wallets and net banking', icon: 'RZ' };
  return { id: key || id, label: id || 'Payment method', description: 'Payment availability is set by admin', icon: '₹' };
}

export function isUpiPaymentMethod(id: string): boolean {
  const key = String(id || '').toLowerCase();
  return key === 'upi' || key.includes('upi');
}

export function paymentPanelTitle(id: string): string {
  const key = String(id || '').toLowerCase();
  if (isUpiPaymentMethod(key)) return 'Pay with UPI';
  if (key.includes('card')) return 'Pay with card';
  if (key.includes('wallet')) return 'Pay with wallet';
  if (key.includes('netbanking') || key.includes('bank')) return 'Pay with net banking';
  if (key === 'cod') return 'Pay at delivery';
  return 'Payment details';
}

export function paymentIconFor(id: string): string {
  const key = String(id || '').toLowerCase();
  if (key.includes('upi')) return 'UPI';
  if (key.includes('card')) return 'CC';
  if (key.includes('wallet')) return 'WL';
  if (key.includes('netbanking') || key.includes('bank')) return 'NB';
  if (key === 'cod') return '₹';
  if (key.includes('razorpay')) return 'RZ';
  return '₹';
}

export function paymentMethodToOnlineGroup(id: string): 'razorpay' | 'cod' | string {
  const key = String(id || '').toLowerCase();
  return key.startsWith('razorpay_') || key === 'upi' ? 'razorpay' : key;
}

export function formatCheckoutAddress(address?: CheckoutAddressLike | null): string {
  if (!address) return 'Current address';
  return [
    address.label,
    address.line || address.address_line1,
    address.city,
    address.state,
    address.pincode || address.postal_code,
  ].filter(Boolean).join(', ') || 'Selected address';
}

export function buildDeliveryFeeChangeConfirmation(input: DeliveryFeeChangeInput): CheckoutConfirmationCopy {
  const currentFee = normalizeMoney(input.currentFee);
  const nextFee = normalizeMoney(input.nextFee);
  const difference = normalizeMoney(nextFee - currentFee);
  const trend = difference > 0 ? 'increased' : difference < 0 ? 'decreased' : 'changed';
  return {
    title: 'Delivery fee changed',
    message: [
      'Changing delivery address may update your bill because the new address is in a different delivery zone or farther from the selected store.',
      '',
      `Previous address: ${formatCheckoutAddress(input.currentAddress)}`,
      `New address: ${formatCheckoutAddress(input.nextAddress)}`,
      '',
      `Previous delivery fee: Rs ${formatMoneyNumber(currentFee)}`,
      `New delivery fee: Rs ${formatMoneyNumber(nextFee)}`,
      `Fee ${trend}: Rs ${formatMoneyNumber(Math.abs(difference))}`,
      '',
      'Your final order total will be recalculated by the backend before placement. Continue with this address?',
    ].join('\n'),
    confirmText: 'Use this address',
    cancelText: 'Cancel',
    tone: 'warning',
  };
}

export function fastestDeliveryWindow(now = new Date(), minutes = 25): string {
  return formatTimeRange(now, new Date(now.getTime() + minutes * 60000));
}

export function offsetDeliveryWindow(startMinutes: number, endMinutes: number, now = new Date()): string {
  return formatTimeRange(new Date(now.getTime() + startMinutes * 60000), new Date(now.getTime() + endMinutes * 60000));
}

export function normalizeDeliverySlot(slot: DeliverySlotLike, index = 0): NormalizedDeliverySlot {
  const scheduledFor = String(slot.start || slot.scheduledFor || slot.scheduled_for || slot.id || '');
  return {
    id: String(slot.id || slot.start || slot.label || `slot-${index}`),
    name: String(slot.label || slot.name || 'Scheduled slot'),
    type: 'Scheduled delivery',
    time: slotTimeLabel(slot.start || slot.scheduledFor || slot.scheduled_for || undefined, slot.end || undefined),
    price: 'Calculated live',
    scheduledFor: scheduledFor || undefined,
  };
}

export function defaultDeliverySlots(now = new Date()): NormalizedDeliverySlot[] {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(now);
  dayAfter.setDate(dayAfter.getDate() + 2);
  return [
    { id: 'fastest', name: 'Fastest available', type: 'Express Delivery', time: fastestDeliveryWindow(now), price: 'Calculated live' },
    { id: 'priority', name: 'Priority slot', type: 'Next available window', time: offsetDeliveryWindow(30, 60, now), price: 'Calculated live' },
    { id: 'tomorrow-morning', name: 'Tomorrow', type: 'Scheduled delivery', time: '08:00 AM - 12:00 PM', price: 'Calculated live' },
    { id: 'tomorrow-afternoon', name: 'Tomorrow afternoon', type: 'Scheduled delivery', time: '12:00 PM - 04:00 PM', price: 'Calculated live' },
    {
      id: 'day-after',
      name: dayAfter.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }),
      type: 'Scheduled delivery',
      time: '09:00 AM - 01:00 PM',
      price: 'Calculated live',
    },
  ];
}

export function mergeBackendDeliverySlots(slots: DeliverySlotLike[], now = new Date()): NormalizedDeliverySlot[] {
  const backendSlots = slots
    .filter((slot) => slot.available !== false)
    .slice(0, 6)
    .map((slot, index) => normalizeDeliverySlot(slot, index));
  return [
    { id: 'fastest', name: 'Fastest available', type: 'Express Delivery', time: fastestDeliveryWindow(now), price: 'Calculated live' },
    ...backendSlots,
  ];
}

export function slotTimeLabel(start?: string | null, end?: string | null): string {
  if (!start) return '';
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;
  if (Number.isNaN(startDate.getTime())) return '';
  const startText = startDate.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const endText = endDate && !Number.isNaN(endDate.getTime())
    ? endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  return endText ? `${startText} - ${endText}` : startText;
}

export function shouldShowDeliveryPartner(partner: unknown): boolean {
  if (!partner || typeof partner !== 'object') return false;
  const record = partner as Record<string, unknown>;
  return Boolean(record['id'] || record['name'] || record['phone']);
}

export function toTrackingCoordinate(value: TrackingCoordinateLike | null | undefined): TrackingCoordinate | null {
  const lat = Number(value?.lat ?? value?.latitude);
  const lng = Number(value?.lng ?? value?.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

export function trackingCurrentCoordinate(input: {
  driver?: TrackingCoordinateLike | null;
  destination?: TrackingCoordinateLike | null;
  vendor?: TrackingCoordinateLike | null;
}): TrackingCoordinate | null {
  return toTrackingCoordinate(input.driver) || toTrackingCoordinate(input.destination) || toTrackingCoordinate(input.vendor);
}

export function canSubmitCheckout(input: {
  isAuthenticated: boolean;
  hasCartItems: boolean;
  hasValidAddress: boolean;
  hasPaymentMethod: boolean;
  isServiceable?: boolean;
  paymentMethod?: string;
  codUpiConfirmed?: boolean;
}): boolean {
  if (!input.isAuthenticated || !input.hasCartItems || !input.hasValidAddress || !input.hasPaymentMethod) return false;
  if (input.isServiceable === false) return false;
  if (input.paymentMethod === 'cod' && !input.codUpiConfirmed) return false;
  return true;
}

function formatTimeRange(start: Date, end: Date): string {
  return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function normalizeMoney(value: number): number {
  return Number(Number(value || 0).toFixed(2));
}

function formatMoneyNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
