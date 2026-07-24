import { NextResponse } from 'next/server';
import { apiErrorResponse } from './errors';

export async function proxyRequest(request: Request, path: string, requestId: string): Promise<NextResponse> {
  const upstreamBase = process.env.NAVFARM_API_UPSTREAM_URL;
  if (!upstreamBase) {
    return apiErrorResponse(503, 'NAVFARM_API_UPSTREAM_URL is not configured.', requestId);
  }
  const url = `${upstreamBase.replace(/\/$/, '')}/api/v1${path}${new URL(request.url).search}`;
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.set('x-request-id', requestId);
  try {
    const upstream = await fetch(url, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
      redirect: 'manual',
    });
    const contentType = upstream.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await upstream.json().catch(() => null)
      : await upstream.text();
    if (!upstream.ok) {
      const legacy = payload as { message?: string | string[]; error?: string } | null;
      const candidate = legacy?.message ?? legacy?.error;
      const message = Array.isArray(candidate)
        ? candidate.join(', ')
        : candidate || `Upstream request failed (${upstream.status}).`;
      return apiErrorResponse(upstream.status, message, requestId, payload);
    }
    if (upstream.status === 204) return new NextResponse(null, { status: 204 });
    return contentType.includes('application/json')
      ? NextResponse.json(payload, { status: upstream.status, headers: { 'x-request-id': requestId } })
      : new NextResponse(String(payload), {
          status: upstream.status,
          headers: { 'content-type': contentType, 'x-request-id': requestId },
        });
  } catch (cause) {
    return apiErrorResponse(
      503,
      'NAVFarm upstream API is unavailable.',
      requestId,
      cause instanceof Error ? cause.message : cause,
    );
  }
}
