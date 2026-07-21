import { Injectable, NestMiddleware, BadRequestException, ForbiddenException, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ClsService } from 'nestjs-cls';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, or } from 'drizzle-orm';
import { MASTER_CONNECTION } from '../../core/database/database.module';
import { ConnectionManagerService } from '../../core/database/connection-manager.service';
import * as masterSchema from '../../core/database/master-schema';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly cls: ClsService,
    @Inject(MASTER_CONNECTION)
    private readonly masterDb: MySql2Database<typeof masterSchema>,
    private readonly connectionManager: ConnectionManagerService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;
    const path = req.originalUrl.split('?')[0];
    const apiPrefix = `/${(process.env.API_PREFIX || 'api/v1').replace(/^\/+|\/+$/g, '')}`;

    // 1. Bypass non-API routes (e.g., Swagger docs, favicon, root)
    if (!path.startsWith(apiPrefix) || path === `${apiPrefix}/health`) {
      return next();
    }

    // 2. Decode JWT if present to check for SYSTEM_ADMIN permissions or extract tenantId
    let isSystemAdmin = false;
    let tokenTenantId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload) {
            if (payload.userType === 'SYSTEM_ADMIN') {
              isSystemAdmin = true;
            }
            if (payload.tenantId) {
              tokenTenantId = payload.tenantId;
            }
          }
        }
      } catch (err) {
        // Ignore token anomalies, let Passport JWT strategy handle validation later
      }
    }

    // 3. Bypass public authentication and onboarding wizard steps
    const isPublic = 
      path.includes('/auth/login') || 
      path.includes('/auth/register-admin') || 
      path.includes('/tenant') ||
      path.includes('/plan') ||
      path.includes('/setup/wizard');

    const effectiveTenantId = tenantId || tokenTenantId;

    if (!effectiveTenantId && !isPublic && !isSystemAdmin) {
      throw new BadRequestException('x-tenant-id header is missing');
    }
    
    // Default to the system tenant ID if no custom tenant header is supplied
    const activeTenantId = effectiveTenantId || '00000000-0000-0000-0000-000000000000';

    if (activeTenantId) {
      // Resolve tenant connection credentials from master database by ID or Subdomain Code
      const [tenant] = await this.masterDb
        .select()
        .from(masterSchema.tenantMaster)
        .where(
          or(
            eq(masterSchema.tenantMaster.tenant_id, activeTenantId),
            eq(masterSchema.tenantMaster.tenant_code, activeTenantId.toLowerCase())
          )
        )
        .limit(1);

      if (!tenant) {
        throw new BadRequestException(`Tenant connection context for '${activeTenantId}' not found.`);
      }

      if (!tenant.is_active) {
        throw new ForbiddenException('Tenant account is suspended or inactive. Please contact system support.');
      }

      const tenantDb = await this.connectionManager.getTenantConnection(tenant);

      // Store in AsyncLocalStorage
      const resolvedTenantId = tenant.tenant_id;
      this.cls.set('tenantId', resolvedTenantId);
      this.cls.set('tenantDb', tenantDb);
      req['tenantId'] = resolvedTenantId;
    }
    
    next();
  }
}
