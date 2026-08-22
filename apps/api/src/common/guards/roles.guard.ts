import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../core/database/schema';
import { REQUIRE_PERMISSION_KEY, RequiredPermission } from '../decorators/require-permission.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cls: ClsService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User session context missing.');
    }

    // Scope enforcement runs for every request this guard sees, independent of
    // @RequirePermission — the client-supplied active-company/area headers are
    // otherwise never validated against what the user is actually assigned to.
    await this.enforceScope(request, user);

    const requiredPermission = this.reflector.getAllAndOverride<RequiredPermission>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true;
    }

    if (user.userType === 'SYSTEM_ADMIN' || user.userType === 'COMPANY_ADMIN' || user.userType === 'TENANT_ADMIN') {
      return true;
    }

    // Query active permissions assigned to the user
    const userPermissions = await this.db
      .select({
        moduleCode: schema.rolePermissions.module_code,
        resource: schema.rolePermissions.resource,
        canView: schema.rolePermissions.can_view,
        canCreate: schema.rolePermissions.can_create,
        canEdit: schema.rolePermissions.can_edit,
        canDelete: schema.rolePermissions.can_delete,
        canApprove: schema.rolePermissions.can_approve,
        canExport: schema.rolePermissions.can_export,
        canPrint: schema.rolePermissions.can_print,
      })
      .from(schema.userRoleAssignment)
      .innerJoin(schema.roleMaster, eq(schema.userRoleAssignment.role_id, schema.roleMaster.role_id))
      .innerJoin(schema.rolePermissions, eq(schema.roleMaster.role_id, schema.rolePermissions.role_id))
      .where(
        and(
          eq(schema.userRoleAssignment.user_id, user.userId),
          eq(schema.userRoleAssignment.is_active, true),
          eq(schema.roleMaster.is_active, true)
        )
      );

    const hasMatch = userPermissions.some((perm) => {
      const matchesModule = perm.moduleCode === 'ALL' || perm.moduleCode === requiredPermission.moduleCode;
      const matchesResource = perm.resource === 'ALL' || perm.resource === requiredPermission.resource;

      if (!matchesModule || !matchesResource) {
        return false;
      }

      switch (requiredPermission.action) {
        case 'view': return perm.canView;
        case 'create': return perm.canCreate;
        case 'edit': return perm.canEdit;
        case 'delete': return perm.canDelete;
        case 'approve': return perm.canApprove;
        case 'export': return perm.canExport;
        case 'print': return perm.canPrint;
        default: return false;
      }
    });

    if (!hasMatch) {
      throw new ForbiddenException('Insufficient permissions to execute this request.');
    }

    return true;
  }

  /**
   * Validates the x-active-company-id / x-active-operational-area-id headers
   * against what the user is actually assigned to. Client-supplied headers
   * are otherwise trusted at face value by every downstream handler.
   */
  private async enforceScope(request: any, user: any): Promise<void> {
    if (user.userType === 'SYSTEM_ADMIN') return;

    const activeCompanyId = request.headers['x-active-company-id'] as string | undefined;
    if (activeCompanyId) {
      if (user.userType === 'TENANT_ADMIN') {
        const [company] = await this.db
          .select({ tenant_id: schema.companyMaster.tenant_id })
          .from(schema.companyMaster)
          .where(eq(schema.companyMaster.company_id, activeCompanyId))
          .limit(1);
        if (!company || company.tenant_id !== user.tenantId) {
          throw new ForbiddenException('Not authorized for this company.');
        }
      } else if (activeCompanyId !== user.companyId) {
        const [assignment] = await this.db
          .select({ id: schema.userCompanyAssignments.assign_id })
          .from(schema.userCompanyAssignments)
          .where(
            and(
              eq(schema.userCompanyAssignments.user_id, user.userId),
              eq(schema.userCompanyAssignments.company_id, activeCompanyId),
              eq(schema.userCompanyAssignments.is_active, true),
            ),
          )
          .limit(1);
        if (!assignment) {
          throw new ForbiddenException('Not authorized for this company.');
        }
      }
    }

    const activeAreaId = request.headers['x-active-operational-area-id'] as string | undefined;
    if (activeAreaId && user.userType !== 'TENANT_ADMIN' && user.userType !== 'COMPANY_ADMIN') {
      const [assignment] = await this.db
        .select({ id: schema.userOperationalAreaAssignment.assignment_id })
        .from(schema.userOperationalAreaAssignment)
        .where(
          and(
            eq(schema.userOperationalAreaAssignment.user_id, user.userId),
            eq(schema.userOperationalAreaAssignment.area_id, activeAreaId),
          ),
        )
        .limit(1);
      if (!assignment) {
        throw new ForbiddenException('Not authorized for this operational area.');
      }
    }
  }
}
