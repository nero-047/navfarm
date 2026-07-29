import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class RoleService {
  constructor(
    private readonly cls: ClsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async createRole(companyId: string, roleCode: string, roleName: string, description?: string) {
    const existing = await this.db
      .select()
      .from(schema.roleMaster)
      .where(and(eq(schema.roleMaster.company_id, companyId), eq(schema.roleMaster.role_code, roleCode.toUpperCase())))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`Role with code '${roleCode}' already exists for this company.`);
    }

    const roleId = randomUUID();
    await this.db
      .insert(schema.roleMaster)
      .values({
        role_id: roleId,
        company_id: companyId,
        role_code: roleCode.toUpperCase(),
        role_name: roleName,
        role_description: description,
        is_system_role: false,
      });

    try {
      await this.auditLogService.log({
        tenantId: this.cls.get('tenantId'),
        companyId: companyId,
        action: 'CREATE_ROLE',
        entityName: 'ROLE',
        entityId: roleId,
        newValues: { roleCode, roleName, description }
      });
    } catch (e) {
      console.error('Failed to log CREATE_ROLE audit event:', e);
    }

    const [role] = await this.db
      .select()
      .from(schema.roleMaster)
      .where(eq(schema.roleMaster.role_id, roleId))
      .limit(1);

    return role;
  }

  async assignRoleToUser(userId: string, roleId: string, assignedBy: string) {
    const role = await this.db
      .select()
      .from(schema.roleMaster)
      .where(eq(schema.roleMaster.role_id, roleId))
      .limit(1);

    if (role.length === 0) {
      throw new NotFoundException(`Role with ID '${roleId}' not found.`);
    }

    return this.db.transaction(async (tx) => {
      await tx
        .delete(schema.userRoleAssignment)
        .where(eq(schema.userRoleAssignment.user_id, userId));

      const assignId = randomUUID();
      await tx
        .insert(schema.userRoleAssignment)
        .values({
          assign_id: assignId,
          user_id: userId,
          role_id: roleId,
          assigned_by: assignedBy,
        });

      const [assignment] = await tx
        .select()
        .from(schema.userRoleAssignment)
        .where(eq(schema.userRoleAssignment.assign_id, assignId))
        .limit(1);

      return assignment;
    });
  }

  async updateRolePermissions(roleId: string, permissions: Array<{
    module_code: string;
    resource: string;
    can_view?: boolean;
    can_create?: boolean;
    can_edit?: boolean;
    can_delete?: boolean;
    can_approve?: boolean;
    can_export?: boolean;
    can_print?: boolean;
  }>) {
    const role = await this.db
      .select()
      .from(schema.roleMaster)
      .where(eq(schema.roleMaster.role_id, roleId))
      .limit(1);

    if (role.length === 0) {
      throw new NotFoundException(`Role with ID '${roleId}' not found.`);
    }

    return this.db.transaction(async (tx) => {
      // 1. Delete old permission rows
      await tx.delete(schema.rolePermissions).where(eq(schema.rolePermissions.role_id, roleId));

      // 2. Insert new permission rows
      if (permissions.length > 0) {
        const insertRows = permissions.map((p) => ({
          perm_id: randomUUID(),
          role_id: roleId,
          module_code: p.module_code,
          resource: p.resource,
          can_view: p.can_view || false,
          can_create: p.can_create || false,
          can_edit: p.can_edit || false,
          can_delete: p.can_delete || false,
          can_approve: p.can_approve || false,
          can_export: p.can_export || false,
          can_print: p.can_print || false,
        }));

        await tx.insert(schema.rolePermissions).values(insertRows);
      }

      try {
        await this.auditLogService.log({
          tenantId: this.cls.get('tenantId'),
          companyId: role[0]?.company_id || undefined,
          action: 'UPDATE_PERMISSIONS',
          entityName: 'ROLE',
          entityId: roleId,
          newValues: { permissionsCount: permissions.length },
        }, tx);
      } catch (e) {
        console.error('Failed to log UPDATE_PERMISSIONS audit event:', e);
      }

      return { success: true, message: 'Permissions updated successfully.' };
    });
  }

  async getRolePermissions(roleId: string) {
    const role = await this.db
      .select()
      .from(schema.roleMaster)
      .where(eq(schema.roleMaster.role_id, roleId))
      .limit(1);

    if (role.length === 0) {
      throw new NotFoundException(`Role with ID '${roleId}' not found.`);
    }

    return this.db
      .select()
      .from(schema.rolePermissions)
      .where(eq(schema.rolePermissions.role_id, roleId));
  }

  async getCompanyRoles(companyId: string) {
    return this.db
      .select()
      .from(schema.roleMaster)
      .where(eq(schema.roleMaster.company_id, companyId));
  }

  async updateRole(roleId: string, data: { roleName?: string; description?: string; isActive?: boolean }) {
    const [role] = await this.db
      .select()
      .from(schema.roleMaster)
      .where(eq(schema.roleMaster.role_id, roleId))
      .limit(1);

    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found.`);
    }

    const updateData: Record<string, any> = {};
    if (data.roleName !== undefined) updateData.role_name = data.roleName;
    if (data.description !== undefined) updateData.role_description = data.description;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    if (Object.keys(updateData).length > 0) {
      await this.db
        .update(schema.roleMaster)
        .set(updateData)
        .where(eq(schema.roleMaster.role_id, roleId));
    }

    const [updated] = await this.db
      .select()
      .from(schema.roleMaster)
      .where(eq(schema.roleMaster.role_id, roleId))
      .limit(1);

    return updated;
  }

  async deleteRole(roleId: string) {
    const [role] = await this.db
      .select()
      .from(schema.roleMaster)
      .where(eq(schema.roleMaster.role_id, roleId))
      .limit(1);

    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found.`);
    }

    if (role.is_system_role) {
      throw new BadRequestException('System roles cannot be deleted.');
    }

    // Check if any active assignments exist
    const assignments = await this.db
      .select()
      .from(schema.userRoleAssignment)
      .where(and(
        eq(schema.userRoleAssignment.role_id, roleId),
        eq(schema.userRoleAssignment.is_active, true),
      ))
      .limit(1);

    if (assignments.length > 0) {
      throw new BadRequestException(
        'Role has active user assignments. Revoke all assignments before deleting this role.'
      );
    }

    // Delete permissions first, then the role (cascade handles permissions but explicit is cleaner)
    await this.db.delete(schema.rolePermissions).where(eq(schema.rolePermissions.role_id, roleId));
    await this.db.delete(schema.roleMaster).where(eq(schema.roleMaster.role_id, roleId));

    return { success: true, message: `Role '${role.role_code}' deleted successfully.` };
  }

  async unassignRole(assignId: string) {
    const [assignment] = await this.db
      .select()
      .from(schema.userRoleAssignment)
      .where(eq(schema.userRoleAssignment.assign_id, assignId))
      .limit(1);

    if (!assignment) {
      throw new NotFoundException(`Role assignment with ID '${assignId}' not found.`);
    }

    await this.db
      .update(schema.userRoleAssignment)
      .set({ is_active: false })
      .where(eq(schema.userRoleAssignment.assign_id, assignId));

    return { success: true, message: 'Role unassigned successfully.' };
  }

  async getUserAssignments(userId: string) {
    return this.db
      .select({
        assign_id: schema.userRoleAssignment.assign_id,
        user_id: schema.userRoleAssignment.user_id,
        role_id: schema.userRoleAssignment.role_id,
        is_active: schema.userRoleAssignment.is_active,
        assigned_at: schema.userRoleAssignment.assigned_at,
        role_code: schema.roleMaster.role_code,
        role_name: schema.roleMaster.role_name,
      })
      .from(schema.userRoleAssignment)
      .leftJoin(
        schema.roleMaster,
        eq(schema.userRoleAssignment.role_id, schema.roleMaster.role_id),
      )
      .where(eq(schema.userRoleAssignment.user_id, userId));
  }
}
