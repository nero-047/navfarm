import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, sql } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../core/database/schema';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from './dto/user.dto';

const toMysqlTimestamp = (date: Date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
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

  async create(dto: CreateUserDto) {
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
    await this.db.insert(schema.userMaster).values({
      user_id: userId,
      company_id: dto.company_id,
      tenant_id: dto.tenant_id,
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

    return this.findById(userId);
  }

  async findById(id: string) {
    const [user] = await this.db
      .select()
      .from(schema.userMaster)
      .where(eq(schema.userMaster.user_id, id))
      .limit(1);

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found.`);
    }

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
      .where(eq(schema.userMaster.email, email.toLowerCase()))
      .limit(1);

    return user || null;
  }

  async findAll(query: QueryUserDto) {
    const conditions: any[] = [];

    if (query.companyId) {
      conditions.push(eq(schema.userMaster.company_id, query.companyId));
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

  async findByCompany(companyId: string) {
    return this.findAll({ companyId });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findById(id);

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

    return this.findById(id);
  }

  async deactivate(id: string) {
    const user = await this.findById(id);

    await this.db
      .update(schema.userMaster)
      .set({
        is_active: false,
      })
      .where(eq(schema.userMaster.user_id, id));

    return this.findById(id);
  }

  async remove(id: string) {
    const user = await this.findById(id);

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
