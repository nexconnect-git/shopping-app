export interface CartStoreLock {
  storeId: string;
  storeName: string;
}

export interface StoreCartConflict {
  existingStore: CartStoreLock;
  incomingStore: CartStoreLock;
  message: string;
}

export interface AddToCartValidationResult {
  allowed: boolean;
  conflict?: StoreCartConflict;
}

export interface CartItemLike {
  storeId?: string | null;
  storeName?: string | null;
  quantity?: number | string | null;
}

export function getCartStoreLock(items: CartItemLike[]): CartStoreLock | null {
  const first = items.find((item) => item.storeId);
  if (!first?.storeId) return null;
  return {
    storeId: String(first.storeId),
    storeName: String(first.storeName || 'Current store'),
  };
}

export function validateAddToCartStoreLock(
  currentItems: CartItemLike[],
  incoming: CartStoreLock,
): AddToCartValidationResult {
  const existing = getCartStoreLock(currentItems);
  if (!existing || existing.storeId === incoming.storeId) return { allowed: true };
  return {
    allowed: false,
    conflict: {
      existingStore: existing,
      incomingStore: incoming,
      message: `Your cart has items from ${existing.storeName}. Do you want to clear the cart and add items from ${incoming.storeName}?`,
    },
  };
}

export function cartItemCount(items: CartItemLike[]): number {
  return items.reduce((sum, item) => sum + toNumber(item.quantity), 0);
}

function toNumber(value: unknown): number {
  const next = Number(value ?? 0);
  return Number.isFinite(next) ? next : 0;
}
