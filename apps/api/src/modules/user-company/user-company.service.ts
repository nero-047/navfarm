import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import { sql } from 'drizzle-orm';
import * as schema from '../../core/database/schema';

@Injectable()
export class UserCompanyService {
  private readonly logger = new Logger(UserCompanyService.name);

  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) throw new Error('Tenant database connection context not established.');
    return tenantDb;
  }

  /**
   * Ensure the user_company_assignments table exists in the current tenant DB.
   * Safe to call on every request — DDL runs only if the table is missing.
   */
  private async ensureTable(): Promise<void> {
    try {
      await this.db.execute(sql`
        CREATE TABLE IF NOT EXISTS \`user_company_assignments\` (
          \`assign_id\`   varchar(36)  NOT NULL,
          \`user_id\`     varchar(36)  NOT NULL,
          \`company_id\`  varchar(36)  NOT NULL,
          \`is_primary\`  tinyint(1)   NOT NULL DEFAULT 0,
          \`is_active\`   tinyint(1)   NOT NULL DEFAULT 1,
          \`assigned_by\` varchar(36)  NOT NULL,
          \`assigned_at\` datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`assign_id\`),
          UNIQUE KEY \`uq_user_company\` (\`user_id\`, \`company_id\`),
          CONSTRAINT \`uca_user_fk\`    FOREIGN KEY (\`user_id\`)    REFERENCES \`user_master\`    (\`user_id\`)    ON DELETE CASCADE,
          CONSTRAINT \`uca_company_fk\` FOREIGN KEY (\`company_id\`) REFERENCES \`company_master\` (\`company_id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

      // Backfill: give every existing user at least their home company
      await this.db.execute(sql`
        INSERT IGNORE INTO \`user_company_assignments\`
          (\`assign_id\`, \`user_id\`, \`company_id\`, \`is_primary\`, \`is_active\`, \`assigned_by\`)
        SELECT UUID(), \`user_id\`, \`company_id\`, 1, 1, \`user_id\`
        FROM   \`user_master\`
        WHERE  \`company_id\` IS NOT NULL
          AND  \`company_id\` != '00000000-0000-0000-0000-000000000000'
      `);
    } catch (err: any) {
      this.logger.warn('ensureTable warning (non-fatal):', err?.message);
    }
  }

  /** Assign a user to an additional company */
  async assignUserToCompany(
    userId: string,
    companyId: string,
    assignedBy: string,
    isPrimary = false,
  ) {
    await this.ensureTable();

    // Validate user exists
    const [user] = await this.db
      .select()
      .from(schema.userMaster)
      .where(eq(schema.userMaster.user_id, userId))
      .limit(1);
    if (!user) throw new NotFoundException(`User '${userId}' not found.`);

    // Validate company exists
    const [company] = await this.db
      .select()
      .from(schema.companyMaster)
      .where(eq(schema.companyMaster.company_id, companyId))
      .limit(1);
    if (!company) throw new NotFoundException(`Company '${companyId}' not found.`);

    // Check for duplicate
    const [existing] = await this.db
      .select()
      .from(schema.userCompanyAssignments)
      .where(
        and(
          eq(schema.userCompanyAssignments.user_id, userId),
          eq(schema.userCompanyAssignments.company_id, companyId),
        ),
      )
      .limit(1);

    if (existing) {
      if (!existing.is_active) {
        // Re-activate
        await this.db
          .update(schema.userCompanyAssignments)
          .set({ is_active: true, is_primary: isPrimary, assigned_by: assignedBy })
          .where(eq(schema.userCompanyAssignments.assign_id, existing.assign_id));
        return { message: 'Company assignment re-activated.', assign_id: existing.assign_id };
      }
      throw new ConflictException('User is already assigned to this company.');
    }

    // If setting as primary, unset current primary
    if (isPrimary) {
      await this.db
        .update(schema.userCompanyAssignments)
        .set({ is_primary: false })
        .where(eq(schema.userCompanyAssignments.user_id, userId));
    }

    const assignId = randomUUID();
    await this.db.insert(schema.userCompanyAssignments).values({
      assign_id:   assignId,
      user_id:     userId,
      company_id:  companyId,
      is_primary:  isPrimary,
      is_active:   true,
      assigned_by: assignedBy,
    });

    return {
      message:      'User assigned to company successfully.',
      assign_id:    assignId,
      company_name: company.company_name,
    };
  }

  /** Remove (soft-delete) a user from a company */
  async removeUserFromCompany(assignId: string) {
    await this.ensureTable();

    const [assignment] = await this.db
      .select()
      .from(schema.userCompanyAssignments)
      .where(eq(schema.userCompanyAssignments.assign_id, assignId))
      .limit(1);

    if (!assignment) throw new NotFoundException(`Assignment '${assignId}' not found.`);

    // Count remaining active assignments for this user
    const remaining = await this.db
      .select()
      .from(schema.userCompanyAssignments)
      .where(
        and(
          eq(schema.userCompanyAssignments.user_id, assignment.user_id),
          eq(schema.userCompanyAssignments.is_active, true),
        ),
      );

    if (remaining.length <= 1) {
      throw new BadRequestException(
        'Cannot remove the last company assignment. A user must belong to at least one company.',
      );
    }

    await this.db
      .update(schema.userCompanyAssignments)
      .set({ is_active: false })
      .where(eq(schema.userCompanyAssignments.assign_id, assignId));

    return { message: 'User removed from company.' };
  }

  /** Get all companies a user is assigned to */
  async getUserCompanies(userId: string) {
    await this.ensureTable();

    try {
      const rows = await this.db
        .select({
          assign_id:    schema.userCompanyAssignments.assign_id,
          company_id:   schema.companyMaster.company_id,
          company_name: schema.companyMaster.company_name,
          company_code: schema.companyMaster.company_code,
          is_primary:   schema.userCompanyAssignments.is_primary,
          is_active:    schema.userCompanyAssignments.is_active,
          assigned_at:  schema.userCompanyAssignments.assigned_at,
        })
        .from(schema.userCompanyAssignments)
        .innerJoin(
          schema.companyMaster,
          eq(schema.userCompanyAssignments.company_id, schema.companyMaster.company_id),
        )
        .where(
          and(
            eq(schema.userCompanyAssignments.user_id, userId),
            eq(schema.userCompanyAssignments.is_active, true),
          ),
        );
      return rows;
    } catch (err: any) {
      this.logger.error('getUserCompanies error:', err?.message);
      return [];
    }
  }

  /** Get all users assigned to a company (via the junction table) */
  async getCompanyMembers(companyId: string) {
    await this.ensureTable();

    try {
      const rows = await this.db
        .select({
          assign_id:  schema.userCompanyAssignments.assign_id,
          user_id:    schema.userMaster.user_id,
          full_name:  schema.userMaster.full_name,
          email:      schema.userMaster.email,
          user_type:  schema.userMaster.user_type,
          is_primary: schema.userCompanyAssignments.is_primary,
          is_active:  schema.userMaster.is_active,
        })
        .from(schema.userCompanyAssignments)
        .innerJoin(
          schema.userMaster,
          eq(schema.userCompanyAssignments.user_id, schema.userMaster.user_id),
        )
        .where(
          and(
            eq(schema.userCompanyAssignments.company_id, companyId),
            eq(schema.userCompanyAssignments.is_active, true),
          ),
        );
      return rows;
    } catch (err: any) {
      this.logger.error('getCompanyMembers error:', err?.message);
      return [];
    }
  }
}
