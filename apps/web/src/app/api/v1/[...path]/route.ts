import { randomUUID } from 'node:crypto';
import { apiErrorResponse } from '@/server/api/errors';
import { getApiMode } from '@/server/api/mode';
import { handleMockRequest } from '@/server/api/mock-repository';
import { proxyRequest } from '@/server/api/proxy';
import { shouldHybridFallback } from '@/server/api/hybrid';

export const dynamic = 'force-dynamic';

async function dispatch(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const requestId = request.headers.get('x-request-id') || randomUUID();
  const { path: segments } = await context.params;
  const path = `/${segments.join('/')}`;
  try {
    const mode = getApiMode();
    if (mode === 'mock') return handleMockRequest(request, path, requestId);
    const proxied = await proxyRequest(request, path, requestId);
    if (mode === 'hybrid' && shouldHybridFallback(request.method, path, proxied.status)) {
      return handleMockRequest(request, path, requestId);
    }
    return proxied;
  } catch (cause) {
    return apiErrorResponse(
      500,
      cause instanceof Error ? cause.message : 'Unexpected API boundary failure.',
      requestId,
    );
  }
}

export const GET = dispatch;
export const POST = dispatch;
export const PUT = dispatch;
export const PATCH = dispatch;
export const DELETE = dispatch;
