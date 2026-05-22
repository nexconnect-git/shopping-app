export type AddressLabel = 'home' | 'work' | 'other';

export interface CustomerAddress {
  id?: string;
  label: AddressLabel;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  landmark?: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number | string | null;
  longitude: number | string | null;
  is_default?: boolean;
  delivery_instructions?: string;
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

export function normalizeAddress(address: Record<string, unknown> | null | undefined): CustomerAddressView {
  const source = address || {};
  const line = stringValue(source['address_line1'] ?? source['line']);
  const addressLine2 = stringValue(source['address_line2']);
  const city = stringValue(source['city']);
  const state = stringValue(source['state']);
  const pincode = stringValue(source['postal_code'] ?? source['pincode']);
  return {
    id: stringValue(source['id']),
    label: titleCase(stringValue(source['label'] ?? 'home')),
    name: stringValue(source['full_name'] ?? source['name']) || 'Customer',
    line: [line, addressLine2, city, state, pincode].filter(Boolean).join(', '),
    phone: stringValue(source['phone']),
    isDefault: Boolean(source['is_default'] ?? source['isDefault']),
    city,
    state,
    pincode,
    landmark: stringValue(source['landmark']),
    latitude: nullableNumber(source['latitude']),
    longitude: nullableNumber(source['longitude']),
    raw: address,
  };
}

export function createAddressPayload(address: Partial<CustomerAddress> | CustomerAddressView): Record<string, unknown> {
  const source = address as Record<string, unknown>;
  return {
    label: normalizeAddressLabel(stringValue(source['label']) || 'home'),
    full_name: stringValue(source['full_name'] ?? source['name']),
    phone: stringValue(source['phone']).replace(/\D/g, ''),
    address_line1: stringValue(source['address_line1'] ?? source['line']),
    address_line2: stringValue(source['address_line2']),
    landmark: stringValue(source['landmark']),
    city: stringValue(source['city']),
    state: stringValue(source['state']),
    postal_code: stringValue(source['postal_code'] ?? source['pincode']),
    latitude: nullableNumber(source['latitude']),
    longitude: nullableNumber(source['longitude']),
    is_default: Boolean(source['is_default'] ?? source['isDefault']),
  };
}

export function addressDisplayLabel(address: Partial<CustomerAddress> | CustomerAddressView | null | undefined): string {
  if (!address) return 'Address';
  const label = stringValue((address as Record<string, unknown>)['label']).toLowerCase();
  if (label === 'home') return 'Home';
  if (label === 'work') return 'Work';
  return stringValue((address as Record<string, unknown>)['name'] ?? (address as Record<string, unknown>)['full_name']) || 'Saved place';
}

export function normalizeAddressLabel(value: string): AddressLabel {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'work') return 'work';
  if (normalized === 'other') return 'other';
  return 'home';
}

function stringValue(value: unknown): string {
  return String(value ?? '').trim();
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function titleCase(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value;
}
