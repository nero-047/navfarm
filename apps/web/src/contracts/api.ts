import { z } from 'zod';

export const apiErrorCodeSchema = z.enum([
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'VALIDATION_ERROR',
  'UPSTREAM_ERROR',
  'UPSTREAM_UNAVAILABLE',
  'CONFIGURATION_ERROR',
  'INTERNAL_ERROR',
]);

export const apiErrorSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    status: z.number().int(),
    requestId: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ApiErrorPayload = z.infer<typeof apiErrorSchema>;

export const companySchema = z.object({
  company_id: z.string(),
  tenant_id: z.string(),
  company_code: z.string(),
  company_name: z.string(),
  company_display_name: z.string().nullable().optional(),
  industry_type: z.string(),
  onboarding_status: z.string(),
  is_active: z.boolean(),
}).passthrough();

export const nobSchema = z.object({
  nob_id: z.string(),
  nob_code: z.string(),
  nob_name: z.string(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
}).passthrough();

export const languageSchema = z.object({
  lang_id: z.string(),
  lang_code: z.string(),
  lang_name: z.string(),
}).passthrough();

export const currencySchema = z.object({
  currency_id: z.string(),
  currency_code: z.string(),
  currency_name: z.string(),
  symbol: z.string().optional(),
}).passthrough();

export const authSessionSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  mfa_required: z.boolean().optional(),
  user: z.object({
    userId: z.string(),
    fullName: z.string(),
    name: z.string().optional(),
    email: z.string(),
    userType: z.string(),
    companyId: z.string(),
    tenantId: z.string(),
    companies: z.array(z.unknown()).default([]),
    permissions: z.array(z.unknown()).default([]),
  }).passthrough(),
});

export const demoStateResponseSchema = z.object({
  state: z.unknown().nullable(),
});

export const successSchema = z.object({ success: z.boolean() }).passthrough();

export type RuntimeContract = {
  method: string;
  pattern: RegExp;
  response: z.ZodType;
};

/**
 * Shared by the browser client and the Next.js API boundary. Routes not yet
 * modeled remain usable during migration, but these core contracts are always
 * runtime validated.
 */
export const runtimeContracts: RuntimeContract[] = [
  { method: 'POST', pattern: /^\/auth\/(login|refresh)$/, response: authSessionSchema },
  { method: 'GET', pattern: /^\/company\/tenant\/[^/]+$/, response: z.array(companySchema) },
  { method: 'POST', pattern: /^\/company$/, response: companySchema },
  { method: 'GET', pattern: /^\/setup\/wizard\/nobs$/, response: z.array(nobSchema) },
  { method: 'GET', pattern: /^\/language$/, response: z.array(languageSchema) },
  { method: 'GET', pattern: /^\/currency$/, response: z.array(currencySchema) },
  { method: 'GET', pattern: /^\/demo\/companies\/[^/]+\/state$/, response: demoStateResponseSchema },
  { method: 'PUT', pattern: /^\/demo\/companies\/[^/]+\/state$/, response: successSchema },
];

export function responseSchemaFor(method: string, path: string): z.ZodType | undefined {
  return runtimeContracts.find(
    (contract) => contract.method === method.toUpperCase() && contract.pattern.test(path),
  )?.response;
}

export function unwrapApiPayload(payload: unknown): unknown {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    Object.keys(payload).every((key) => key === 'data' || key === 'meta')
  ) {
    return (payload as { data: unknown }).data;
  }
  return payload;
}
