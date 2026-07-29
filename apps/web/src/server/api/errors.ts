import { NextResponse } from 'next/server';
import type { ApiErrorPayload } from '@/contracts/api';

type ApiErrorCode = ApiErrorPayload['error']['code'];

const codeByStatus: Record<number, ApiErrorPayload['error']['code']> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  429: 'RATE_LIMIT',
  502: 'UPSTREAM_ERROR',
  503: 'UPSTREAM_UNAVAILABLE',
};

export function apiErrorResponse(
  status: number,
  message: string,
  requestId: string,
  details?: unknown,
  code?: ApiErrorCode,
) {
  return NextResponse.json<ApiErrorPayload>(
    {
      error: {
        code: code ?? codeByStatus[status] ?? 'INTERNAL_ERROR',
        message,
        status,
        requestId,
        timestamp: new Date().toISOString(),
        ...(details === undefined ? {} : { details }),
      },
    },
    { status, headers: { 'x-request-id': requestId } },
  );
}
