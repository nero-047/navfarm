import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, sql } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from './dto/user.dto';

const toMysqlTimestamp = (date: Date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

type UserActor = {
  userId?: string;
  tenantId?: string;
  companyId?: string | null;
  userType?: string;
};

@Injectable()
export class UserService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  private get activeTenantId(): string {
    const tenantId = this.cls.get<string>('tenantId');
    if (!tenantId) {
      throw new ForbiddenException('Tenant context is required for user management.');
    }
    return tenantId;
  }

  private async assertCompanyInActiveTenant(companyId: string) {
    const [company] = await this.db
      .select({ companyId: schema.companyMaster.company_id })
      .from(schema.companyMaster)
      .where(and(
        eq(schema.companyMaster.company_id, companyId),
        eq(schema.companyMaster.tenant_id, this.activeTenantId),
      ))
      .limit(1);

    if (!company) {
      throw new NotFoundException(`Company with ID '${companyId}' not found in the active tenant.`);
    }
  }

  private assertCompanyAdminScope(actor: UserActor | undefined, companyId: string | null) {
    if (actor?.userType !== 'COMPANY_ADMIN') {
      return;
    }
    if (!actor.companyId || actor.companyId !== companyId) {
      throw new ForbiddenException('Company Administrators can manage users only in their assigned company.');
    }
  }

  async create(dto: CreateUserDto, actor: UserActor) {
    const tenantId = this.activeTenantId;
    if (dto.tenant_id !== tenantId || (actor.tenantId && actor.tenantId !== tenantId)) {
      throw new ForbiddenException('Users can only be created in the active tenant workspace.');
    }
    await this.assertCompanyInActiveTenant(dto.company_id);
    this.assertCompanyAdminScope(actor, dto.company_id);

    const existing = await this.db
      .select()
      .from(schema.userMaster)
      .where(eq(schema.userMaster.email, dto.email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`User with email '${dto.email}' already exists.`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const userId = randomUUID();
    await this.db.transaction(async (tx) => {
      await tx.insert(schema.userMaster).values({
        user_id: userId,
        company_id: dto.company_id,
        tenant_id: tenantId,
        full_name: dto.full_name,
        email: dto.email.toLowerCase(),
        phone: dto.phone || null,
        password_hash: passwordHash,
        user_type: dto.user_type || 'STAFF',
        employee_id: dto.employee_id || null,
        department: dto.department || null,
        designation: dto.designation || null,
        timezone_pref_id: dto.timezone_pref_id || null,
      });
      await tx.insert(schema.userCompanyAssignments).values({
        user_id: userId,
        company_id: dto.company_id,
        is_primary: true,
        assigned_by: actor.userId || userId,
      });
    });

    return this.findById(userId, actor);
  }

  async findById(id: string, actor?: UserActor) {
    const [user] = await this.db
      .select()
      .from(schema.userMaster)
      .where(and(
        eq(schema.userMaster.user_id, id),
        eq(schema.userMaster.tenant_id, this.activeTenantId),
      ))
      .limit(1);

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found.`);
    }
    this.assertCompanyAdminScope(actor, user.company_id);

    const roles = await this.db
      .select({
        role_id: schema.roleMaster.role_id,
        role_code: schema.roleMaster.role_code,
        role_name: schema.roleMaster.role_name,
      })
      .from(schema.userRoleAssignment)
      .innerJoin(
        schema.roleMaster,
        eq(schema.userRoleAssignment.role_id, schema.roleMaster.role_id),
      )
      .where(
        and(
          eq(schema.userRoleAssignment.user_id, id),
          eq(schema.userRoleAssignment.is_active, true),
        ),
      );

    return { ...user, roles };
  }

  async findByEmail(email: string) {
    const [user] = await this.db
      .select()
      .from(schema.userMaster)
      .where(and(
        eq(schema.userMaster.email, email.toLowerCase()),
        eq(schema.userMaster.tenant_id, this.activeTenantId),
      ))
      .limit(1);

    return user || null;
  }

  async findAll(query: QueryUserDto, actor?: UserActor) {
    const conditions: any[] = [eq(schema.userMaster.tenant_id, this.activeTenantId)];

    if (query.companyId) {
      this.assertCompanyAdminScope(actor, query.companyId);
      conditions.push(eq(schema.userMaster.company_id, query.companyId));
    } else if (actor?.userType === 'COMPANY_ADMIN') {
      this.assertCompanyAdminScope(actor, actor.companyId || null);
      conditions.push(eq(schema.userMaster.company_id, actor.companyId!));
    }
    if (query.userType) {
      conditions.push(eq(schema.userMaster.user_type, query.userType));
    }
    if (query.isActive !== undefined) {
      conditions.push(eq(schema.userMaster.is_active, query.isActive));
    }
    if (query.search) {
      conditions.push(
        or(
          like(schema.userMaster.full_name, `%${query.search}%`),
          like(schema.userMaster.email, `%${query.search}%`),
        ),
      );
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    const users = await this.db
      .select({
        user_id: schema.userMaster.user_id,
        company_id: schema.userMaster.company_id,
        tenant_id: schema.userMaster.tenant_id,
        full_name: schema.userMaster.full_name,
        email: schema.userMaster.email,
        phone: schema.userMaster.phone,
        user_type: schema.userMaster.user_type,
        employee_id: schema.userMaster.employee_id,
        department: schema.userMaster.department,
        designation: schema.userMaster.designation,
        is_active: schema.userMaster.is_active,
        last_login_at: schema.userMaster.last_login_at,
        created_at: schema.userMaster.created_at,
      })
      .from(schema.userMaster)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset);

    // Enrich each user with their role assignments
    const enriched = await Promise.all(
      users.map(async (user) => {
        const roles = await this.db
          .select({
            role_id: schema.roleMaster.role_id,
            role_code: schema.roleMaster.role_code,
            role_name: schema.roleMaster.role_name,
          })
          .from(schema.userRoleAssignment)
          .innerJoin(
            schema.roleMaster,
            eq(schema.userRoleAssignment.role_id, schema.roleMaster.role_id),
          )
          .where(
            and(
              eq(schema.userRoleAssignment.user_id, user.user_id),
              eq(schema.userRoleAssignment.is_active, true),
            ),
          );
        return { ...user, roles };
      }),
    );

    return enriched;
  }

  async findByCompany(companyId: string, actor?: UserActor) {
    await this.assertCompanyInActiveTenant(companyId);
    this.assertCompanyAdminScope(actor, companyId);
    return this.findAll({ companyId }, actor);
  }

  async update(id: string, dto: UpdateUserDto, actor?: UserActor) {
    await this.findById(id, actor);

    const updates: any = {};
    if (dto.full_name !== undefined) updates.full_name = dto.full_name;
    if (dto.phone !== undefined) updates.phone = dto.phone;
    if (dto.user_type !== undefined) updates.user_type = dto.user_type;
    if (dto.employee_id !== undefined) updates.employee_id = dto.employee_id;
    if (dto.department !== undefined) updates.department = dto.department;
    if (dto.designation !== undefined) updates.designation = dto.designation;
    if (dto.timezone_pref_id !== undefined) updates.timezone_pref_id = dto.timezone_pref_id;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;

    if (Object.keys(updates).length > 0) {
      await this.db
        .update(schema.userMaster)
        .set(updates)
        .where(eq(schema.userMaster.user_id, id));
    }

    return this.findById(id, actor);
  }

  async deactivate(id: string, actor?: UserActor) {
    await this.findById(id, actor);

    await this.db
      .update(schema.userMaster)
      .set({
        is_active: false,
      })
      .where(eq(schema.userMaster.user_id, id));

    return this.findById(id, actor);
  }

  async remove(id: string, actor?: UserActor) {
    await this.findById(id, actor);

    await this.db
      .update(schema.userMaster)
      .set({
        is_active: false,
        deleted_at: toMysqlTimestamp() as any,
      })
      .where(eq(schema.userMaster.user_id, id));

    return { deleted: true, user_id: id };
  }
}
