import { z } from 'zod';
import {
  apiErrorSchema, permissionSchema, responseSchemaFor,
} from './api';
import { masterListResponseSchema } from './phase3';
import {
  batchTransitionActionSchema, workflowStatusSchema,
} from '../modules/farm-demo/operational-contracts';

describe('frozen API contract primitives', () => {
  it('accepts the v1 error envelope fields', () => {
    expect(apiErrorSchema.parse({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Review the submitted fields.',
        status: 422,
        requestId: 'req-1',
        timestamp: '2026-07-27T10:00:00.000Z',
        fieldErrors: { email: ['Enter a valid email address.'] },
        details: { schema: 'CreateTenant' },
      },
    }).error.fieldErrors?.email).toEqual(['Enter a valid email address.']);
  });

  it('keeps permissions and lifecycle enums compatible with Phase 7.1 behavior', () => {
    expect(permissionSchema.options).toEqual(expect.arrayContaining([
      'tenant.manage',
      'company.manage',
      'batches.create',
      'operations.create',
      'quality.manage',
      'traceability.view',
      'finance.manage',
    ]));
    expect(workflowStatusSchema.options).toEqual([
      'DRAFT', 'APPROVED', 'ACTIVE', 'PAUSED', 'QC_HOLD',
      'READY_TO_CLOSE', 'CLOSED', 'CANCELLED',
    ]);
    expect(batchTransitionActionSchema.options).toEqual([
      'APPROVE', 'START', 'PAUSE', 'RESUME', 'CANCEL', 'CLOSE',
    ]);
  });

  it('validates paged master lists by resource-specific record schema', () => {
    const valid = masterListResponseSchema.safeParse({
      resource: 'uoms',
      records: [{
        id: 'uom-kg',
        companyId: 'company-1',
        code: 'KG',
        name: 'Kilogram',
        symbol: 'kg',
        decimalPlaces: 4,
        status: 'ACTIVE',
        referencedBy: [],
        audit: {
          createdAt: '2026-07-27T10:00:00.000Z',
          createdBy: 'seed',
          updatedAt: '2026-07-27T10:00:00.000Z',
          updatedBy: 'seed',
        },
      }],
      page: 1,
      pageSize: 20,
      total: 1,
    });
    expect(valid.success).toBe(true);

    const invalid = masterListResponseSchema.safeParse({
      resource: 'uoms',
      records: [{ id: 'missing-uom-fields' }],
      page: 1,
      pageSize: 20,
      total: 1,
    });
    expect(invalid.success).toBe(false);
  });

  it('registers runtime response schemas for required contract route groups', () => {
    const routes: Array<[string, string, z.ZodType | undefined]> = [
      ['POST', '/auth/login', responseSchemaFor('POST', '/auth/login')],
      ['GET', '/platform/tenants', responseSchemaFor('GET', '/platform/tenants')],
      ['GET', '/companies/company-1/setup/status', responseSchemaFor('GET', '/companies/company-1/setup/status')],
      ['POST', '/companies/company-1/masters/items/import/validate', responseSchemaFor('POST', '/companies/company-1/masters/items/import/validate')],
      ['GET', '/companies/company-1/accounting/readiness', responseSchemaFor('GET', '/companies/company-1/accounting/readiness')],
    ];
    expect(routes.map(([, , schema]) => Boolean(schema))).toEqual([true, true, true, true, true]);
  });
});
