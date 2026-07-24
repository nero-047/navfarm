import { apiErrorSchema, responseSchemaFor, unwrapApiPayload } from '../contracts/api';

export const API_BASE_URL = '/api/v1';

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
    readonly code = 'INTERNAL_ERROR',
    readonly details?: unknown,
    readonly requestId?: string,
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

export interface NavfarmApiClient {
  request<T>(path: string, options?: ApiOptions): Promise<T>;
  get<T>(path: string, options?: ApiOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T>;
  put<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T>;
  delete<T>(path: string, options?: ApiOptions): Promise<T>;
}

function stored(key: string): string | null {
  return typeof window === 'undefined' ? null : localStorage.getItem(key);
}

function clearSession() {
  if (typeof window === 'undefined') return;
  for (const key of [
    ...Object.values(AUTH_STORAGE),
    'user',
    'access_token',
    'refresh_token',
    'tenant_id',
    'active_company_id',
  ]) {
    localStorage.removeItem(key);
  }
}

function errorFromPayload(payload: unknown, status: number): ApiError {
  const parsed = apiErrorSchema.safeParse(payload);
  if (parsed.success) {
    const value = parsed.data.error;
    return new ApiError(value.message, value.status, value.code, value.details, value.requestId);
  }
  const legacy = payload as { message?: string | string[]; error?: string } | null;
  const candidate = legacy?.message ?? legacy?.error;
  const message = Array.isArray(candidate)
    ? candidate.join(', ')
    : candidate || `Request failed (${status}).`;
  return new ApiError(message, status, 'UPSTREAM_ERROR', payload);
}

export function createApiClient(
  fetcher?: typeof fetch,
  baseUrl = API_BASE_URL,
): NavfarmApiClient {
  let refreshPromise: Promise<string> | null = null;

  const request = async <T>(path: string, options: ApiOptions = {}): Promise<T> => {
    const activeFetcher = fetcher ?? globalThis.fetch;
    if (!activeFetcher) {
      throw new ApiError('Fetch is unavailable in this runtime.', 500, 'CONFIGURATION_ERROR');
    }
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const {
      body,
      tenantId = stored(AUTH_STORAGE.tenantId),
      retry = true,
      ...init
    } = options;
    const headers = new Headers(init.headers);
    if (!(body instanceof FormData)) headers.set('Content-Type', 'application/json');
    const token = stored(AUTH_STORAGE.accessToken);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (tenantId) headers.set('x-tenant-id', tenantId);
    const activeCompanyId = stored('active_company_id');
    if (activeCompanyId) headers.set('x-active-company-id', activeCompanyId);

    const response = await activeFetcher(`${baseUrl}${normalizedPath}`, {
      ...init,
      headers,
      body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = response.status === 204 ? null : await response.json().catch(() => null);

    if (response.status === 401 && token && retry && normalizedPath !== '/auth/refresh') {
      refreshPromise ??= (async () => {
        const refreshToken = stored(AUTH_STORAGE.refreshToken);
        if (!refreshToken) throw new ApiError('Your session has expired.', 401, 'UNAUTHORIZED');
        const refreshResponse = await activeFetcher(`${baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        const refreshPayload = unwrapApiPayload(await refreshResponse.json().catch(() => null));
        if (!refreshResponse.ok) {
          clearSession();
          throw errorFromPayload(refreshPayload, refreshResponse.status);
        }
        const refreshSchema = responseSchemaFor('POST', '/auth/refresh');
        if (!refreshSchema) throw new ApiError('Refresh contract is not registered.', 500);
        const parsed = refreshSchema.safeParse(refreshPayload);
        if (!parsed.success) throw new ApiError('Invalid refresh response.', 502, 'UPSTREAM_ERROR', parsed.error.flatten());
        const session = parsed.data as { access_token: string; refresh_token?: string };
        localStorage.setItem(AUTH_STORAGE.accessToken, session.access_token);
        if (session.refresh_token) localStorage.setItem(AUTH_STORAGE.refreshToken, session.refresh_token);
        return session.access_token;
      })().finally(() => {
        refreshPromise = null;
      });
      const refreshed = await refreshPromise;
      headers.set('Authorization', `Bearer ${refreshed}`);
      return request<T>(normalizedPath, { ...options, headers, retry: false });
    }

    if (!response.ok) throw errorFromPayload(payload, response.status);
    const unwrapped = unwrapApiPayload(payload);
    const schema = responseSchemaFor(init.method || 'GET', normalizedPath);
    if (schema) {
      const parsed = schema.safeParse(unwrapped);
      if (!parsed.success) {
        throw new ApiError(
          `Response contract failed for ${init.method || 'GET'} ${normalizedPath}.`,
          502,
          'UPSTREAM_ERROR',
          parsed.error.flatten(),
        );
      }
      return parsed.data as T;
    }
    return unwrapped as T;
  };

  return {
    request,
    get: <T>(path: string, options?: ApiOptions) => request<T>(path, { ...options, method: 'GET' }),
    post: <T>(path: string, body?: unknown, options?: ApiOptions) =>
      request<T>(path, { ...options, method: 'POST', body }),
    put: <T>(path: string, body?: unknown, options?: ApiOptions) =>
      request<T>(path, { ...options, method: 'PUT', body }),
    patch: <T>(path: string, body?: unknown, options?: ApiOptions) =>
      request<T>(path, { ...options, method: 'PATCH', body }),
    delete: <T>(path: string, options?: ApiOptions) =>
      request<T>(path, { ...options, method: 'DELETE' }),
  };
}

export const api = createApiClient();
export const apiRequest = api.request;

export function persistAuthSession(session: {
  access_token: string;
  refresh_token: string;
  user: unknown;
}) {
  localStorage.setItem(AUTH_STORAGE.accessToken, session.access_token);
  localStorage.setItem(AUTH_STORAGE.refreshToken, session.refresh_token);
  localStorage.setItem(AUTH_STORAGE.user, JSON.stringify(session.user));
  localStorage.setItem('access_token', session.access_token);
  localStorage.setItem('refresh_token', session.refresh_token);
  localStorage.setItem('user', JSON.stringify(session.user));
  const user = session.user as { tenantId?: string; companyId?: string; company_id?: string };
  const companyId = user.companyId ?? user.company_id;
  if (companyId) localStorage.setItem('active_company_id', companyId);
  if (user.tenantId) {
    localStorage.setItem(AUTH_STORAGE.tenantId, user.tenantId);
    localStorage.setItem('tenant_id', user.tenantId);
  }
}

export function clearAuthSession() {
  clearSession();
}
