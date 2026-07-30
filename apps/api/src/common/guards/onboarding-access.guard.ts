import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClsService } from 'nestjs-cls';

interface OnboardingTokenPayload {
  purpose?: string;
  tenantId?: string;
  companyId?: string;
}

/**
 * Authorizes the unauthenticated portion of setup without treating it as a
 * normal user session. The token is issued only after step 1 creates a company
 * and is bound to that exact company and tenant.
 */
@Injectable()
export class OnboardingAccessGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly cls: ClsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers?.authorization;

    if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('A valid onboarding access token is required.');
    }

    let payload: OnboardingTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<OnboardingTokenPayload>(authorization.slice(7));
    } catch {
      throw new UnauthorizedException('The onboarding access token is invalid or expired.');
    }

    if (payload.purpose !== 'ONBOARDING_SETUP' || !payload.tenantId || !payload.companyId) {
      throw new UnauthorizedException('A valid onboarding access token is required.');
    }

    const activeTenantId = this.cls.get<string>('tenantId');
    if (!activeTenantId || activeTenantId !== payload.tenantId) {
      throw new ForbiddenException('The onboarding token does not match the active tenant workspace.');
    }

    const requestedCompanyId = request.params?.companyId ?? request.body?.company_id ?? request.body?.companyId;
    if (requestedCompanyId && requestedCompanyId !== payload.companyId) {
      throw new ForbiddenException('The onboarding token does not grant access to this company.');
    }

    request.onboarding = {
      tenantId: payload.tenantId,
      companyId: payload.companyId,
    };
    return true;
  }
}
