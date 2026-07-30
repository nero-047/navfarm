import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';
import { resolveJwtSecret } from '../../../../config/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly cls: ClsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: resolveJwtSecret(config),
    });
  }

  async validate(payload: any) {
    const db = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    const activeTenantId = this.cls.get<string>('tenantId');
    if (!db || !activeTenantId) {
      throw new UnauthorizedException('Tenant database connection context not established.');
    }

    if (!payload?.tenantId || payload.tenantId !== activeTenantId) {
      throw new UnauthorizedException('Access token does not match the active tenant workspace.');
    }

    const [user] = await db
      .select()
      .from(schema.userMaster)
      .where(and(
        eq(schema.userMaster.user_id, payload.sub),
        eq(schema.userMaster.tenant_id, activeTenantId),
      ))
      .limit(1);

    if (!user || !user.is_active) {
      throw new UnauthorizedException('User is not authorized or active.');
    }

    return {
      userId: user.user_id,
      email: user.email,
      tenantId: user.tenant_id,
      companyId: user.company_id,
      userType: user.user_type,
    };
  }
}
