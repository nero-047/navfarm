import { SetMetadata } from '@nestjs/common';

export interface RequiredPermission {
  moduleCode: string;
  resource: string;
  action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' | 'print';
}

export const REQUIRE_PERMISSION_KEY = 'require_permission';
export const RequirePermission = (moduleCode: string, resource: string, action: RequiredPermission['action']) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, { moduleCode, resource, action });
