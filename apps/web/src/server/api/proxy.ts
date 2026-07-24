import { NextResponse } from 'next/server';
import { apiErrorResponse } from './errors';

const RESPONSE_HEADERS = [
  'content-type', 'content-disposition', 'cache-control', 'etag',
  'last-modified', 'location', 'retry-after', 'www-authenticate',
];

export async function proxyRequest(request: Request, path: string, requestId: string): Promise<NextResponse> {
  const upstreamBase = process.env.NAVFARM_API_UPSTREAM_URL;
  if (!upstreamBase) return apiErrorResponse(503, 'NAVFARM_API_UPSTREAM_URL is not configured.', requestId);
  const timeoutMs = Number(process.env.NAVFARM_API_TIMEOUT_MS || 15_000);
  const url = `${upstreamBase.replace(/\/$/, '')}/api/v1${path}${new URL(request.url).search}`;
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');
  headers.set('x-request-id', requestId);
  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    });
    const responseHeaders = new Headers({ 'x-request-id': requestId });
    for (const name of RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    const getSetCookie = (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
    const cookies = getSetCookie ? getSetCookie.call(upstream.headers) : [];
    for (const cookie of cookies) responseHeaders.append('set-cookie', cookie);
    const bytes = upstream.status === 204 ? null : await upstream.arrayBuffer();
    if (upstream.ok) return new NextResponse(bytes, { status: upstream.status, headers: responseHeaders });

    const contentType = upstream.headers.get('content-type') || '';
    let details: unknown = bytes ? new TextDecoder().decode(bytes) : null;
    if (contentType.includes('application/json') && typeof details === 'string') {
      details = JSON.parse(details || 'null');
    }
    const legacy = details as { message?: string | string[]; error?: string } | null;
    const candidate = legacy?.message ?? legacy?.error;
    const message = Array.isArray(candidate) ? candidate.join(', ') : candidate || `Upstream request failed (${upstream.status}).`;
    const normalized = apiErrorResponse(upstream.status, message, requestId, details);
    for (const cookie of cookies) normalized.headers.append('set-cookie', cookie);
    const authenticate = upstream.headers.get('www-authenticate');
    if (authenticate) normalized.headers.set('www-authenticate', authenticate);
    return normalized;
  } catch (cause) {
    const timedOut = cause instanceof Error && (cause.name === 'TimeoutError' || cause.name === 'AbortError');
    return apiErrorResponse(
      503,
      timedOut ? 'NAVFarm upstream API timed out.' : 'NAVFarm upstream API is unavailable.',
      requestId,
      cause instanceof Error ? cause.message : cause,
    );
  }
}
