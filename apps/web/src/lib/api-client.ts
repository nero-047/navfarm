import { apiErrorSchema, responseSchemaFor, unwrapApiPayload } from '../contracts/api';

export const API_BASE_URL = '/api/v1';

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

export type ApiOptions = Omit<RequestInit, 'body'> & { body?: unknown };

export interface NavfarmApiClient {
  request<T>(path: string, options?: ApiOptions): Promise<T>;
  get<T>(path: string, options?: ApiOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T>;
  put<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T>;
  delete<T>(path: string, options?: ApiOptions): Promise<T>;
}

function errorFromPayload(payload: unknown, status: number): ApiError {
  const parsed = apiErrorSchema.safeParse(payload);
  if (parsed.success) {
    const value = parsed.data.error;
    return new ApiError(value.message, value.status, value.code, value.details, value.requestId);
  }
  const legacy = payload as { message?: string | string[]; error?: string } | null;
  const candidate = legacy?.message ?? legacy?.error;
  return new ApiError(
    Array.isArray(candidate) ? candidate.join(', ') : candidate || `Request failed (${status}).`,
    status,
    'UPSTREAM_ERROR',
    payload,
  );
}

export function createApiClient(fetcher?: typeof fetch, baseUrl = API_BASE_URL): NavfarmApiClient {
  const request = async <T>(path: string, options: ApiOptions = {}): Promise<T> => {
    const activeFetcher = fetcher ?? globalThis.fetch;
    if (!activeFetcher) throw new ApiError('Fetch is unavailable in this runtime.', 500, 'CONFIGURATION_ERROR');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const { body, ...init } = options;
    const headers = new Headers(init.headers);
    if (!(body instanceof FormData)) headers.set('Content-Type', 'application/json');
    const response = await activeFetcher(`${baseUrl}${normalizedPath}`, {
      ...init,
      credentials: 'include',
      headers,
      body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
    });
    const contentType = response.headers?.get?.('content-type') || '';
    const payload = response.status === 204
      ? null
      : contentType.includes('application/json') || !response.headers
        ? await response.json().catch(() => null)
        : await response.blob();
    if (!response.ok) throw errorFromPayload(payload, response.status);
    const unwrapped = unwrapApiPayload(payload);
    const schema = responseSchemaFor(init.method || 'GET', normalizedPath.split('?')[0]);
    if (!schema) return unwrapped as T;
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
  };
  return {
    request,
    get: <T>(path: string, options?: ApiOptions) => request<T>(path, { ...options, method: 'GET' }),
    post: <T>(path: string, body?: unknown, options?: ApiOptions) => request<T>(path, { ...options, method: 'POST', body }),
    put: <T>(path: string, body?: unknown, options?: ApiOptions) => request<T>(path, { ...options, method: 'PUT', body }),
    patch: <T>(path: string, body?: unknown, options?: ApiOptions) => request<T>(path, { ...options, method: 'PATCH', body }),
    delete: <T>(path: string, options?: ApiOptions) => request<T>(path, { ...options, method: 'DELETE' }),
  };
}

export const api = createApiClient();
export const apiRequest = api.request;

// Kept as no-op compatibility exports while legacy imports migrate. Session
// identity is exclusively held by the same-origin HTTP-only cookie.
export const AUTH_STORAGE = {} as const;
export function persistAuthSession() { return undefined; }
export function clearAuthSession() { return undefined; }
