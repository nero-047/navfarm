import * as crypto from 'crypto';
import * as schema from '../../../core/database/schema';

/**
 * Seeds the four starter roles (SUPER_ADMIN, MANAGER, ACCOUNTANT, OPERATOR)
 * for a company. Called from every path that can make a company "real" —
 * CompanyService.create() and the setup wizard's step 1 (which often
 * updates the tenant's placeholder company in place rather than inserting
 * a new row, so a create()-only hook would miss it). Idempotent: callers
 * check roleMaster is empty for the company before invoking this.
 *
 * tx is typed loosely because Drizzle's MySqlTransaction generic differs
 * slightly by call site; both callers only need insert(), which both the
 * transaction and the base db connection expose identically.
 *
 * Returns the seeded role ids so a caller can, e.g., assign the company's
 * creating user to SUPER_ADMIN.
 */
export async function seedDefaultCompanyRoles(
  tx: any,
  companyId: string,
): Promise<{ superAdminRoleId: string; managerRoleId: string; accountantRoleId: string; operatorRoleId: string }> {
  const superAdminRoleId = crypto.randomUUID();
  await tx.insert(schema.roleMaster).values({
    role_id: superAdminRoleId,
    company_id: companyId,
    role_code: 'SUPER_ADMIN',
    role_name: 'Super Administrator',
    role_description: 'Full administrative control over all company scopes',
    is_system_role: true,
  });
  await tx.insert(schema.rolePermissions).values({
    role_id: superAdminRoleId,
    module_code: 'ALL',
    resource: 'ALL',
    can_view: true,
    can_create: true,
    can_edit: true,
    can_delete: true,
    can_approve: true,
    can_export: true,
    can_print: true,
  });

  const managerRoleId = crypto.randomUUID();
  await tx.insert(schema.roleMaster).values({
    role_id: managerRoleId,
    company_id: companyId,
    role_code: 'MANAGER',
    role_name: 'Manager',
    role_description: 'General operational management and supervisor permissions',
    is_system_role: true,
  });
  await tx.insert(schema.rolePermissions).values([
    { role_id: managerRoleId, module_code: 'POULTRY', resource: 'BATCH_CONTROL', can_view: true, can_create: true, can_edit: true, can_delete: false, can_approve: true, can_export: true, can_print: true },
    { role_id: managerRoleId, module_code: 'POULTRY', resource: 'FEED_LOGS', can_view: true, can_create: true, can_edit: true, can_delete: false, can_approve: true, can_export: true, can_print: true },
    { role_id: managerRoleId, module_code: 'ACCOUNTING', resource: 'LEDGER', can_view: true, can_create: true, can_edit: true, can_delete: false, can_approve: false, can_export: true, can_print: true },
    { role_id: managerRoleId, module_code: 'FINANCE', resource: 'VALUATION', can_view: true, can_create: true, can_edit: true, can_delete: false, can_approve: false, can_export: true, can_print: true },
    { role_id: managerRoleId, module_code: 'COMPANY', resource: 'SETTINGS', can_view: true, can_create: false, can_edit: false, can_delete: false, can_approve: false, can_export: false, can_print: false },
  ]);

  const accountantRoleId = crypto.randomUUID();
  await tx.insert(schema.roleMaster).values({
    role_id: accountantRoleId,
    company_id: companyId,
    role_code: 'ACCOUNTANT',
    role_name: 'Accountant',
    role_description: 'Accounting, ledgers, and financial valuation reports',
    is_system_role: true,
  });
  await tx.insert(schema.rolePermissions).values([
    { role_id: accountantRoleId, module_code: 'ACCOUNTING', resource: 'LEDGER', can_view: true, can_create: true, can_edit: true, can_delete: true, can_approve: true, can_export: true, can_print: true },
    { role_id: accountantRoleId, module_code: 'FINANCE', resource: 'VALUATION', can_view: true, can_create: true, can_edit: true, can_delete: false, can_approve: true, can_export: true, can_print: true },
  ]);

  const operatorRoleId = crypto.randomUUID();
  await tx.insert(schema.roleMaster).values({
    role_id: operatorRoleId,
    company_id: companyId,
    role_code: 'OPERATOR',
    role_name: 'Operator',
    role_description: 'Daily operational tasks and farming log entry submissions',
    is_system_role: true,
  });
  await tx.insert(schema.rolePermissions).values([
    { role_id: operatorRoleId, module_code: 'POULTRY', resource: 'FEED_LOGS', can_view: true, can_create: true, can_edit: false, can_delete: false, can_approve: false, can_export: true, can_print: true },
    { role_id: operatorRoleId, module_code: 'POULTRY', resource: 'BATCH_CONTROL', can_view: true, can_create: false, can_edit: false, can_delete: false, can_approve: false, can_export: true, can_print: true },
  ]);

  return { superAdminRoleId, managerRoleId, accountantRoleId, operatorRoleId };
}
