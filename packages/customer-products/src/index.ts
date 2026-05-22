export interface ProductSearchQuery {
  query: string;
  lat?: number;
  lng?: number;
  categoryId?: string;
  limit?: number;
}

export interface ProductLike {
  id: string;
  name: string;
  category?: { id?: string; slug?: string; name?: string } | string | null;
  vendor?: string | { id?: string; store_name?: string } | null;
  price?: number | string;
  is_available?: boolean;
  stock?: number | string;
  total_orders?: number | string;
}

export interface RelatedProductResult<T = ProductLike> {
  storeId: string;
  products: T[];
  source: 'same_store' | 'other_store';
}

export type RecommendationReason =
  | 'previously_bought'
  | 'popular_in_store'
  | 'frequently_bought_together'
  | 'vendor_promoted'
  | 'seasonal'
  | 'related_category'
  | 'offer';

export interface RecommendedProduct<T = ProductLike> {
  product: T;
  reason: RecommendationReason;
  score: number;
}

export interface RecommendationResponseItem<T = unknown> {
  product?: T;
  reason?: RecommendationReason | string;
  score?: number | string;
  store_id?: string;
  store_name?: string;
}

export function sameStoreRelatedProducts<T extends ProductLike>(
  product: T,
  candidates: T[],
  limit = 8,
): RelatedProductResult<T> {
  const storeId = productStoreId(product);
  const categoryKey = productCategoryKey(product);
  const products = candidates
    .filter((candidate) => candidate.id !== product.id && productStoreId(candidate) === storeId)
    .map((candidate) => ({ product: candidate, score: relatedScore(candidate, categoryKey) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((item) => item.product);
  return { storeId, products, source: 'same_store' };
}

export function rankRecommendedProducts<T extends ProductLike>(products: T[], previousProductIds: string[] = []): RecommendedProduct<T>[] {
  return products
    .map((product) => {
      const previouslyBought = previousProductIds.includes(product.id);
      return {
        product,
        reason: previouslyBought ? 'previously_bought' as const : 'popular_in_store' as const,
        score: (previouslyBought ? 1000 : 0) + Number(product.total_orders || 0),
      };
    })
    .sort((left, right) => right.score - left.score);
}

export function normalizeRecommendationResponse<T>(
  response: unknown,
  mapProduct: (product: unknown, context?: { storeId?: string; storeName?: string }) => T,
): RecommendedProduct<T>[] {
  const record = response && typeof response === 'object' ? response as Record<string, unknown> : {};
  const rawItems = Array.isArray(record['results'])
    ? record['results']
    : Array.isArray(response)
      ? response
      : [];
  return rawItems
    .map((item, index) => {
      const source = item && typeof item === 'object' ? item as RecommendationResponseItem : {};
      const rawProduct = source.product ?? item;
      if (!rawProduct) return null;
      const product = mapProduct(rawProduct, {
        storeId: source.store_id ? String(source.store_id) : undefined,
        storeName: source.store_name ? String(source.store_name) : undefined,
      });
      return {
        product,
        reason: normalizeRecommendationReason(source.reason),
        score: Number(source.score ?? (1000 - index)),
      };
    })
    .filter((item): item is RecommendedProduct<T> => !!item);
}

export function productStoreId(product: ProductLike): string {
  if (typeof product.vendor === 'string') return product.vendor;
  return String(product.vendor?.id || '');
}

function productCategoryKey(product: ProductLike): string {
  if (typeof product.category === 'string') return product.category.toLowerCase();
  return String(product.category?.slug || product.category?.id || product.category?.name || '').toLowerCase();
}

function relatedScore(product: ProductLike, categoryKey: string): number {
  let score = Number(product.total_orders || 0);
  if (categoryKey && productCategoryKey(product) === categoryKey) score += 100;
  if (product.is_available !== false && Number(product.stock ?? 1) > 0) score += 10;
  return score;
}

function normalizeRecommendationReason(value: unknown): RecommendationReason {
  const reason = String(value || '');
  const allowed: RecommendationReason[] = [
    'previously_bought',
    'popular_in_store',
    'frequently_bought_together',
    'vendor_promoted',
    'seasonal',
    'related_category',
    'offer',
  ];
  return allowed.includes(reason as RecommendationReason) ? reason as RecommendationReason : 'popular_in_store';
}
