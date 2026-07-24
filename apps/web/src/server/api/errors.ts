import { NextResponse } from 'next/server';
import type { ApiErrorPayload } from '@/contracts/api';

const codeByStatus: Record<number, ApiErrorPayload['error']['code']> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  502: 'UPSTREAM_ERROR',
  503: 'UPSTREAM_UNAVAILABLE',
};

export function apiErrorResponse(
  status: number,
  message: string,
  requestId: string,
  details?: unknown,
) {
  return NextResponse.json<ApiErrorPayload>(
    {
      error: {
        code: codeByStatus[status] ?? 'INTERNAL_ERROR',
        message,
        status,
        requestId,
        ...(details === undefined ? {} : { details }),
      },
    },
    { status, headers: { 'x-request-id': requestId } },
  );
}
