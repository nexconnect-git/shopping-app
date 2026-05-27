export interface SearchTerm {
  raw: string;
  value: string;
  index: number;
}

export interface GeoFilterLocation {
  lat?: number | string | null;
  lng?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  state?: string | null;
  city?: string | null;
  postal_code?: string | null;
  postalCode?: string | null;
}

export interface CustomerFilterState {
  query?: string | null;
  category?: string | null;
  minPrice?: number | string | null;
  maxPrice?: number | string | null;
  availableOnly?: boolean | null;
  maxDistanceKm?: number | string | null;
  minRating?: number | string | null;
  deliveryTimeMinutes?: number | string | null;
  offersOnly?: boolean | null;
  vegOnly?: boolean | null;
  storeType?: string | null;
  sort?: string | null;
}

export interface StoreDiscoveryQueryOptions {
  page?: number | string | null;
  pageSize?: number | string | null;
  fallbackToState?: boolean;
}

export interface StoreDiscoveryQueryPlan {
  primary: Record<string, string | number | boolean>;
  fallback?: Record<string, string | number | boolean>;
}

export interface StoreSelectionTarget {
  storeId: string;
  searchQuery?: string;
  matchedCategory?: string;
}

export interface MultiSearchQuery {
  raw: string;
  terms: SearchTerm[];
  mode: 'any' | 'all';
}

export interface MatchedProduct<TProduct = unknown> {
  term: string;
  product: TProduct;
}

export interface MissingProduct {
  term: string;
  reason?: string;
}

export interface StoreMultiSearchResult<TStore = unknown, TProduct = unknown> {
  store: TStore;
  matchingProducts: TProduct[];
  matchedTerms: string[];
  missingTerms: string[];
  matchedCount: number;
  totalTerms: number;
  available?: boolean;
  distanceKm?: number | null;
  estimatedDeliveryMinutes?: number | null;
  minPrice?: number | null;
}

const NUMBER_FIELDS = new Set(['minPrice', 'maxPrice', 'maxDistanceKm', 'minRating', 'deliveryTimeMinutes']);

export function parseMultiSearchQuery(query: string | null | undefined): SearchTerm[] {
  const seen = new Set<string>();
  return String(query ?? '')
    .split(',')
    .map((part, index) => ({ raw: part, value: part.trim().replace(/\s+/g, ' '), index }))
    .filter((term) => {
      if (!term.value) return false;
      const key = term.value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function createMultiSearchQuery(query: string | null | undefined, mode: 'any' | 'all' = 'any'): MultiSearchQuery {
  return {
    raw: String(query ?? ''),
    terms: parseMultiSearchQuery(query),
    mode
  };
}

export function buildProductFilterQuery(
  filters: CustomerFilterState = {},
  location: GeoFilterLocation = {}
): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {};
  const terms = parseMultiSearchQuery(filters.query);
  if (terms.length) {
    params['q'] = terms.map((term) => term.value).join(',');
  }

  for (const [key, value] of Object.entries(filters)) {
    if (key === 'query' || value === undefined || value === null || value === '') continue;
    if (typeof value === 'boolean') {
      if (value) params[key] = true;
      continue;
    }
    if (NUMBER_FIELDS.has(key)) {
      const numberValue = Number(value);
      if (Number.isFinite(numberValue)) params[key] = numberValue;
      continue;
    }
    params[key] = String(value);
  }

  const latitude = Number(location.latitude ?? location.lat);
  const longitude = Number(location.longitude ?? location.lng);
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    params['lat'] = latitude;
    params['lng'] = longitude;
  }
  if (location.state) params['state'] = location.state;
  if (location.city) params['city'] = location.city;
  const postalCode = location.postal_code ?? location.postalCode;
  if (postalCode) params['postal_code'] = postalCode;

  return params;
}

export function buildStoreDiscoveryQueryPlan(
  filters: CustomerFilterState = {},
  location: GeoFilterLocation = {},
  options: StoreDiscoveryQueryOptions = {}
): StoreDiscoveryQueryPlan {
  const primary = buildProductFilterQuery(filters, location);
  const page = Number(options.page);
  const pageSize = Number(options.pageSize);
  if (Number.isFinite(page) && page > 0) primary['page'] = page;
  if (Number.isFinite(pageSize) && pageSize > 0) primary['page_size'] = pageSize;

  const fallbackToState = options.fallbackToState !== false;
  const hasPreciseLocation = primary['lat'] !== undefined && primary['lng'] !== undefined;
  if (hasPreciseLocation) {
    delete primary['city'];
    delete primary['postal_code'];
  }
  const state = location.state || primary['state'];
  if (!fallbackToState || !hasPreciseLocation || !state) return { primary };

  const fallback = { ...primary };
  delete fallback['lat'];
  delete fallback['lng'];
  delete fallback['city'];
  delete fallback['postal_code'];
  fallback['state'] = String(state);
  return { primary, fallback };
}

export function matchedCountLabel(matchedCount: number, totalTerms: number): string {
  const safeTotal = Math.max(0, totalTerms);
  const safeMatched = Math.max(0, Math.min(matchedCount, safeTotal));
  return `${safeMatched} of ${safeTotal} items available`;
}

export function buildStoreSelectionTarget(
  store: { id?: string | number | null; apiId?: string | number | null; raw?: { id?: string | number | null } | null } | null | undefined,
  context: { searchQuery?: string | null; matchedCategory?: string | null } = {}
): StoreSelectionTarget | null {
  const storeId = String(store?.id || store?.apiId || store?.raw?.id || '').trim();
  if (!storeId) return null;
  return {
    storeId,
    ...(context.searchQuery ? { searchQuery: String(context.searchQuery).trim() } : {}),
    ...(context.matchedCategory ? { matchedCategory: String(context.matchedCategory).trim() } : {})
  };
}
