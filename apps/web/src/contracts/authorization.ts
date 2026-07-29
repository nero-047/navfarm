import { z } from 'zod';

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

export const workspaceRoleSchema = z.enum(['MANAGER', 'OPERATOR', 'VIEWER']);

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
  'masters.view',
  'masters.manage',
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
  'traceability.manage',
  'resources.view',
  'resources.manage',
  'reports.export',
  'audit.view',
  'notifications.manage',
  'workspaces.view',
  'workspaces.manage',
  'batches.close',
]);

export type Permission = z.infer<typeof permissionSchema>;
export type CompanyRole = z.infer<typeof companyRoleSchema>;
