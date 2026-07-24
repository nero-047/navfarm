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

export const platformRoleSchema = z.enum(['SYSTEM_ADMIN', 'PLATFORM_SUPPORT']);
export const companyRoleSchema = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'FARM_MANAGER',
  'ACCOUNTANT',
  'AUDITOR',
  'SUPERVISOR',
  'VIEWER',
  'CUSTOM',
]);
export const permissionSchema = z.enum([
  'platform.manage',
  'tenant.view',
  'tenant.manage',
  'company.view',
  'company.manage',
  'users.view',
  'users.manage',
  'roles.view',
  'roles.manage',
  'batches.view',
  'batches.create',
  'batches.approve',
  'operations.create',
  'costs.view',
  'finance.view',
  'finance.manage',
  'quality.view',
  'quality.manage',
  'traceability.view',
  'resources.view',
  'resources.manage',
  'reports.export',
  'audit.view',
  'notifications.manage',
]);

export const sessionUserSchema = z.object({
  userId: z.string(),
  fullName: z.string(),
  name: z.string().optional(),
  email: z.string().email(),
  platformRole: platformRoleSchema.nullable(),
  language: z.string(),
  timezone: z.string(),
  emailVerified: z.boolean(),
  mfaEnabled: z.boolean(),
  userType: z.enum(['SYSTEM_ADMIN', 'TENANT_ADMIN', 'COMPANY_ADMIN', 'STANDARD_USER']),
  companyId: z.string(),
  tenantId: z.string(),
  companies: z.array(z.object({
    company_id: z.string(),
    company_name: z.string(),
    is_primary: z.boolean(),
  })).default([]),
  permissions: z.array(z.unknown()).default([]),
}).passthrough();

export const tenantMembershipSchema = z.object({
  tenantId: z.string(),
  tenantName: z.string(),
  status: z.enum(['ACTIVE', 'SUSPENDED']),
  role: z.enum(['TENANT_ADMIN', 'TENANT_MEMBER']),
});

export const companyMembershipSchema = z.object({
  companyId: z.string(),
  tenantId: z.string(),
  companyName: z.string(),
  companySlug: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  onboardingStatus: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
  role: companyRoleSchema,
  permissions: z.array(permissionSchema),
  enabledModules: z.array(z.string()),
});

export const authSessionSchema = z.object({
  user: sessionUserSchema,
  tenants: z.array(tenantMembershipSchema),
  companies: z.array(companyMembershipSchema),
  activeTenantId: z.string().nullable(),
  activeCompanyId: z.string().nullable(),
  expiresAt: z.string(),
  mfaRequired: z.boolean().optional(),
  challengeId: z.string().optional(),
});
export type AuthSession = z.infer<typeof authSessionSchema>;
export type Permission = z.infer<typeof permissionSchema>;
export type CompanyRole = z.infer<typeof companyRoleSchema>;

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
  { method: 'POST', pattern: /^\/auth\/(login|mfa\/verify|mfa\/recovery)$/, response: authSessionSchema },
  { method: 'GET', pattern: /^\/auth\/session$/, response: authSessionSchema },
  { method: 'PUT', pattern: /^\/auth\/context$/, response: authSessionSchema },
  { method: 'PATCH', pattern: /^\/users\/me$/, response: authSessionSchema },
  { method: 'POST', pattern: /^\/auth\/(logout|forgot-password|reset-password|accept-invitation|verify-email|mfa\/setup)$/, response: successSchema },
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
