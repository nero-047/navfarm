import { BadRequestException, SetMetadata } from '@nestjs/common';
import type { RequiredPermission } from './require-permission.decorator';

export const CODE_PREVIEW_PERMISSION_KEY = 'require_code_preview_permission';
export const RequireCodePreviewPermission = () => SetMetadata(CODE_PREVIEW_PERMISSION_KEY, true);

/** Explicit controller permission mapping. Never derive a permission from an
 * unchecked query value, and never grant Number Series management access. */
const MASTERS: Record<string, [string, string]> = {
  UOM: ['MASTER_DATA', 'UOM'], STAGE: ['PRODUCTION', 'STAGE'],
  LOCATION: ['MASTER_DATA', 'LOCATION'], LOCATION_TYPE: ['MASTER_DATA', 'LOCATION'],
  BREED: ['MASTER_DATA', 'BREED'], SPECIES: ['MASTER_DATA', 'SPECIES'],
  ITEM: ['MASTER_DATA', 'ITEM'], ITEM_TYPE: ['MASTER_DATA', 'ITEM_TYPE'],
  ITEM_CATEGORY: ['MASTER_DATA', 'ITEM_CATEGORY'], ITEM_ATTRIBUTE: ['MASTER_DATA', 'ITEM_ATTRIBUTE'],
  SUPPLIER: ['MASTER_DATA', 'SUPPLIER'], CUSTOMER: ['MASTER_DATA', 'CUSTOMER'],
  REASON: ['MASTER_DATA', 'REASON'], RESOURCE: ['MASTER_DATA', 'RESOURCE'], DISEASE: ['MASTER_DATA', 'DISEASE'],
  FEED_FORMULA: ['MASTER_DATA', 'FEED_FORMULA'], COST_CENTER: ['MASTER_DATA', 'COST_CENTER'],
  GL_ACCOUNT: ['MASTER_DATA', 'GL_ACCOUNT'], ANIMAL: ['PIGGERY', 'ANIMAL'],
};

export function codePreviewPermissions(master: unknown): RequiredPermission[] {
  if (typeof master !== 'string' || !Object.hasOwn(MASTERS, master)) {
    throw new BadRequestException('Select a supported master for code preview.');
  }
  const [moduleCode, resource] = MASTERS[master];
  return [
    { moduleCode: 'SYSTEM', resource: 'NUMBER_SERIES', action: 'view' },
    { moduleCode, resource, action: 'create' },
  ];
}
