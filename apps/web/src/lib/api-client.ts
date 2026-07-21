export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2877/api/v1';

export const AUTH_STORAGE = {
  user: 'navfarm_auth_user',
  accessToken: 'navfarm_access_token',
  refreshToken: 'navfarm_refresh_token',
  tenantId: 'navfarm_tenant_id',
} as const;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  tenantId?: string | null;
  retry?: boolean;
};

function stored(key: string): string | null {
  return typeof window === 'undefined' ? null : localStorage.getItem(key);
}

function errorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const candidate = (payload as { message?: unknown; error?: unknown }).message ??
    (payload as { error?: unknown }).error;
  if (Array.isArray(candidate)) return candidate.join(', ');
  return typeof candidate === 'string' ? candidate : fallback;
}

function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE.user);
  localStorage.removeItem(AUTH_STORAGE.accessToken);
  localStorage.removeItem(AUTH_STORAGE.refreshToken);
  localStorage.removeItem(AUTH_STORAGE.tenantId);
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = stored(AUTH_STORAGE.refreshToken);
    if (!refreshToken) throw new ApiError('Your session has expired.', 401);
    const headers = new Headers({ 'Content-Type': 'application/json' });
    const tenantId = stored(AUTH_STORAGE.tenantId);
    if (tenantId) headers.set('x-tenant-id', tenantId);
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.access_token) {
      clearSession();
      throw new ApiError(errorMessage(payload, 'Your session has expired.'), response.status, payload);
    }
    localStorage.setItem(AUTH_STORAGE.accessToken, payload.access_token);
    if (payload.refresh_token) {
      localStorage.setItem(AUTH_STORAGE.refreshToken, payload.refresh_token);
    }
    return payload.access_token as string;
  })().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, tenantId = stored(AUTH_STORAGE.tenantId), retry = true, ...init } = options;
  const headers = new Headers(init.headers);
  if (!(body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const token = stored(AUTH_STORAGE.accessToken);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (tenantId) headers.set('x-tenant-id', tenantId);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401 && token && retry && path !== '/auth/refresh') {
    const refreshed = await refreshAccessToken();
    headers.set('Authorization', `Bearer ${refreshed}`);
    return apiRequest<T>(path, { ...options, headers, retry: false });
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(errorMessage(payload, `Request failed (${response.status}).`), response.status, payload);
  }
  return payload as T;
}

export const api = {
  get: <T>(path: string, options?: ApiOptions) => apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: ApiOptions) => apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: ApiOptions) => apiRequest<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: ApiOptions) => apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: ApiOptions) => apiRequest<T>(path, { ...options, method: 'DELETE' }),
};

export function persistAuthSession(session: {
  access_token: string;
  refresh_token: string;
  user: unknown;
}) {
  localStorage.setItem(AUTH_STORAGE.accessToken, session.access_token);
  localStorage.setItem(AUTH_STORAGE.refreshToken, session.refresh_token);
  localStorage.setItem(AUTH_STORAGE.user, JSON.stringify(session.user));
  const tenantId = (session.user as { tenantId?: string }).tenantId;
  if (tenantId) localStorage.setItem(AUTH_STORAGE.tenantId, tenantId);
}

export function clearAuthSession() {
  clearSession();
}
