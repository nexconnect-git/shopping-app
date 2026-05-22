export interface AuthSessionState<User = unknown> {
  isAuthenticated: boolean;
  user?: User | null;
  accessTokenExpiresAt?: number;
  refreshTokenExpiresAt?: number;
  accountStatus?: 'active' | 'suspended' | 'pending' | 'rejected';
}

export interface TokenStorageAdapter {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(tokens: { access?: string; refresh?: string | null }): Promise<void>;
  clearTokens(): Promise<void>;
}

export interface AuthHttpAdapter<Response = unknown> {
  refresh(refreshToken: string): Promise<Response>;
  profile(): Promise<unknown>;
}

export function parseJwtExpiry(token: string | null | undefined): number | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as { exp?: number };
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | null | undefined, skewMs = 30_000, nowMs = Date.now()): boolean {
  const expiry = parseJwtExpiry(token);
  if (!expiry) return true;
  return expiry - skewMs <= nowMs;
}

export function shouldClearSession(input: { manualLogout?: boolean; accountStatus?: string; refreshRejected?: boolean }): boolean {
  return Boolean(input.manualLogout || input.refreshRejected || ['suspended', 'rejected'].includes(String(input.accountStatus || '').toLowerCase()));
}

export function isAccountActive(status: string | null | undefined): boolean {
  return !['suspended', 'rejected'].includes(String(status || 'active').toLowerCase());
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + (4 - normalized.length % 4) % 4, '=');
  if (typeof atob === 'function') return atob(padded);
  const buffer = (globalThis as unknown as { Buffer?: { from(value: string, encoding: string): { toString(encoding: string): string } } }).Buffer;
  if (buffer) return buffer.from(padded, 'base64').toString('utf8');
  throw new Error('No base64 decoder is available.');
}
