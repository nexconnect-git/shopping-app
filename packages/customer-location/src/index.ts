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

export interface AddressWithCoordinates {
  id?: string;
  label?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  city?: string;
  state?: string;
  postal_code?: string;
  postalCode?: string;
  is_default?: boolean;
}

export interface LocationQueryInput {
  lat?: number | string | null;
  lng?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  state?: string | null;
  city?: string | null;
  postal_code?: string | null;
  postalCode?: string | null;
}

export function hasGeoCoordinates(value: Partial<GeoCoordinates> | null | undefined): value is GeoCoordinates {
  return isValidLatitude(value?.latitude) && isValidLongitude(value?.longitude);
}

export function isValidLatitude(value: unknown): boolean {
  const latitude = Number(value);
  return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90;
}

export function isValidLongitude(value: unknown): boolean {
  const longitude = Number(value);
  return Number.isFinite(longitude) && longitude >= -180 && longitude <= 180;
}

export function distanceKmBetween(from: GeoCoordinates, to: GeoCoordinates): number {
  const radiusKm = 6371;
  const toRad = (value: number) => value * Math.PI / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function selectNearbySavedAddress<T extends AddressWithCoordinates>(
  coordinates: GeoCoordinates,
  addresses: T[],
  radiusKm = 0.5,
): T | null {
  const candidates = addresses
    .map((address) => {
      const latitude = Number(address.latitude);
      const longitude = Number(address.longitude);
      if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) return null;
      return {
        address,
        distance: distanceKmBetween(coordinates, { latitude, longitude }),
      };
    })
    .filter((item): item is { address: T; distance: number } => !!item)
    .sort((left, right) => left.distance - right.distance);
  return candidates.find((item) => item.distance <= radiusKm)?.address || null;
}

export function buildLocationContext(input: {
  coordinates?: GeoCoordinates | null;
  address?: AddressWithCoordinates | null;
  label?: string;
  source?: LocationSource;
  permissionGranted?: boolean;
  isTemporary?: boolean;
}): LocationContext {
  const coordinates = input.coordinates || coordinatesFromAddress(input.address);
  return {
    coordinates,
    addressId: input.address?.id,
    label: input.label || input.address?.label || (coordinates ? 'Selected location' : 'Location not selected'),
    city: input.address?.city,
    state: input.address?.state,
    postalCode: input.address?.postalCode || input.address?.postal_code,
    source: input.source || (input.address ? 'saved_address' : coordinates ? 'manual' : 'unknown'),
    permissionGranted: input.permissionGranted,
    isTemporary: input.isTemporary,
  };
}

export function buildCustomerLocationQuery(input?: LocationQueryInput | null): Record<string, string | number> {
  const source = input || {};
  const latitude = Number(source.lat ?? source.latitude);
  const longitude = Number(source.lng ?? source.longitude);
  const query: Record<string, string | number> = {};
  if (isValidLatitude(latitude) && isValidLongitude(longitude)) {
    query['lat'] = latitude;
    query['lng'] = longitude;
  }
  if (source.state) query['state'] = source.state;
  if (source.city) query['city'] = source.city;
  const postalCode = source.postal_code || source.postalCode;
  if (postalCode) query['postal_code'] = postalCode;
  return query;
}

function coordinatesFromAddress(address?: AddressWithCoordinates | null): GeoCoordinates | null {
  const latitude = Number(address?.latitude);
  const longitude = Number(address?.longitude);
  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) return null;
  return { latitude, longitude };
}
