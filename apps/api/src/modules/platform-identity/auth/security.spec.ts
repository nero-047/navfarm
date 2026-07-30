/**
 * NAVFarm Phase 2 — Security Tests
 *
 * Covers:
 *   1. Expired / invalid onboarding access token
 *   2. Onboarding token company-binding enforcement
 *   3. Cross-tenant onboarding token rejection
 *   4. JWT tenant mismatch (token tenant ≠ CLS resolved tenant)
 *   5. Cross-company user access (COMPANY_ADMIN trying another company)
 *   6. Tenant boundary enforcement on user creation
 *   7. RolesGuard permission enforcement for missing user context
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ClsService } from 'nestjs-cls';

import { OnboardingAccessGuard } from '../../../common/guards/onboarding-access.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserService } from '../user/user.service';
import { RolesGuard } from '../../../common/guards/roles.guard';

// ─── Constants ────────────────────────────────────────────────────────────────

const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const COMPANY_X = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const COMPANY_Y = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const DEV_SECRET = 'navfarm-development-only-secret';

/** Minimal ExecutionContext that exposes a fake HTTP request. */
function makeContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

// ─── 1 & 2. OnboardingAccessGuard ────────────────────────────────────────────

describe('OnboardingAccessGuard', () => {
  let guard: OnboardingAccessGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingAccessGuard,
        {
          provide: JwtService,
          useValue: new JwtService({ secret: DEV_SECRET }),
        },
        {
          provide: ClsService,
          useValue: { get: jest.fn().mockReturnValue(TENANT_A) },
        },
      ],
    }).compile();

    guard = module.get(OnboardingAccessGuard);
    jwtService = module.get(JwtService);
  });

  it('rejects a request with no Authorization header', async () => {
    const ctx = makeContext({ headers: {} });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a malformed Bearer token', async () => {
    const ctx = makeContext({ headers: { authorization: 'Bearer not.a.valid.jwt' } });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects an expired onboarding token', async () => {
    const token = jwtService.sign(
      { purpose: 'ONBOARDING_SETUP', tenantId: TENANT_A, companyId: COMPANY_X },
      { expiresIn: '1ms' },
    );
    await new Promise(r => setTimeout(r, 10));
    const ctx = makeContext({ headers: { authorization: `Bearer ${token}` }, params: {}, body: {} });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a token with the wrong purpose claim', async () => {
    const token = jwtService.sign({ purpose: 'NORMAL_SESSION', tenantId: TENANT_A, companyId: COMPANY_X });
    const ctx = makeContext({ headers: { authorization: `Bearer ${token}` }, params: {}, body: {} });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a token missing the companyId claim', async () => {
    const token = jwtService.sign({ purpose: 'ONBOARDING_SETUP', tenantId: TENANT_A });
    const ctx = makeContext({ headers: { authorization: `Bearer ${token}` }, params: {}, body: {} });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  // ─── 3. Cross-tenant rejection ──────────────────────────────────────────────

  it('rejects a valid token when its tenantId differs from the CLS context (cross-tenant)', async () => {
    // Token was issued for TENANT_B but the middleware resolved TENANT_A
    const token = jwtService.sign({ purpose: 'ONBOARDING_SETUP', tenantId: TENANT_B, companyId: COMPANY_X });
    const ctx = makeContext({ headers: { authorization: `Bearer ${token}` }, params: {}, body: {} });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('rejects when body company_id differs from token companyId', async () => {
    const token = jwtService.sign({ purpose: 'ONBOARDING_SETUP', tenantId: TENANT_A, companyId: COMPANY_X });
    const ctx = makeContext({
      headers: { authorization: `Bearer ${token}` },
      params: {},
      body: { company_id: COMPANY_Y },
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('rejects when URL param companyId differs from token companyId', async () => {
    const token = jwtService.sign({ purpose: 'ONBOARDING_SETUP', tenantId: TENANT_A, companyId: COMPANY_X });
    const ctx = makeContext({
      headers: { authorization: `Bearer ${token}` },
      params: { companyId: COMPANY_Y },
      body: {},
    });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('passes and sets req.onboarding when token is fully valid', async () => {
    const token = jwtService.sign({ purpose: 'ONBOARDING_SETUP', tenantId: TENANT_A, companyId: COMPANY_X });
    const request: Record<string, unknown> = {
      headers: { authorization: `Bearer ${token}` },
      params: {},
      body: {},
    };
    const ctx = makeContext(request);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request['onboarding']).toEqual({ tenantId: TENANT_A, companyId: COMPANY_X });
  });
});

// ─── 4. JwtStrategy — tenant mismatch ────────────────────────────────────────

describe('JwtStrategy — tenant isolation', () => {
  const mockUser = {
    user_id: 'user-1',
    tenant_id: TENANT_A,
    company_id: COMPANY_X,
    email: 'admin@tenant-a.com',
    user_type: 'TENANT_ADMIN',
    is_active: true,
  };

  function makeStrategy(tenantIdInCls: string | undefined): JwtStrategy {
    const tenantDb = tenantIdInCls
      ? {
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([mockUser]),
        }
      : undefined;

    const cls = {
      get: jest.fn((key: string) => {
        if (key === 'tenantId') return tenantIdInCls;
        if (key === 'tenantDb') return tenantDb;
        return undefined;
      }),
    } as unknown as ClsService;

    const configService = {
      get: (key: string) => {
        if (key === 'JWT_SECRET') return DEV_SECRET;
        if (key === 'NODE_ENV') return 'test';
        return undefined;
      },
    } as unknown as ConfigService;

    return new JwtStrategy(configService, cls);
  }

  it('rejects when JWT tenantId does not match the CLS-resolved tenant', async () => {
    const strategy = makeStrategy(TENANT_A);
    await expect(
      strategy.validate({ sub: 'user-1', tenantId: TENANT_B }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects when the CLS has no tenant context (connection not established)', async () => {
    const strategy = makeStrategy(undefined);
    await expect(
      strategy.validate({ sub: 'user-1', tenantId: TENANT_A }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('accepts a token whose tenantId matches the CLS tenant and returns the user', async () => {
    const strategy = makeStrategy(TENANT_A);
    const result = await strategy.validate({ sub: 'user-1', tenantId: TENANT_A });
    expect(result.tenantId).toBe(TENANT_A);
    expect(result.userId).toBe('user-1');
  });
});

// ─── 5. UserService — cross-company access enforcement ───────────────────────

describe('UserService — COMPANY_ADMIN cross-company scope', () => {
  const userInCompanyX = {
    user_id: 'user-x',
    tenant_id: TENANT_A,
    company_id: COMPANY_X,
    email: 'u@company-x.com',
    user_type: 'STAFF',
    is_active: true,
    full_name: 'User X',
  };

  const companyAdminActor = {
    userId: 'admin-1',
    tenantId: TENANT_A,
    companyId: COMPANY_X,
    userType: 'COMPANY_ADMIN',
  };

  async function buildService(queryResult: unknown[] = [userInCompanyX]) {
    const db = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(queryResult),
      innerJoin: jest.fn().mockReturnThis(),
      offset: jest.fn().mockResolvedValue(queryResult),
    };
    const cls = {
      get: jest.fn((key: string) => {
        if (key === 'tenantId') return TENANT_A;
        if (key === 'tenantDb') return db;
        return undefined;
      }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: ClsService, useValue: cls },
      ],
    }).compile();
    return module.get<UserService>(UserService);
  }

  it('allows COMPANY_ADMIN to read a user in their own company', async () => {
    const service = await buildService();
    const result = await service.findById('user-x', companyAdminActor);
    expect(result.user_id).toBe('user-x');
  });

  it('throws ForbiddenException when COMPANY_ADMIN reads a user from a different company', async () => {
    const service = await buildService();
    const crossActor = { ...companyAdminActor, companyId: COMPANY_Y };
    await expect(service.findById('user-x', crossActor)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when COMPANY_ADMIN calls findByCompany for another company', async () => {
    // assertCompanyInActiveTenant returns a valid row so the lookup passes,
    // then assertCompanyAdminScope throws because COMPANY_X ≠ COMPANY_Y
    const companyRow = { companyId: COMPANY_Y };
    const service = await buildService([companyRow]);
    await expect(service.findByCompany(COMPANY_Y, companyAdminActor)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when COMPANY_ADMIN tries to create a user in another company', async () => {
    const service = await buildService();
    const dto = {
      tenant_id: TENANT_A,
      company_id: COMPANY_Y,
      full_name: 'Intruder',
      email: 'intruder@example.com',
      password: 'password123',
      user_type: 'STAFF' as const,
    };
    await expect(service.create(dto as any, companyAdminActor)).rejects.toThrow(ForbiddenException);
  });
});

// ─── 6. UserService — tenant boundary ────────────────────────────────────────

describe('UserService — tenant boundary on user creation', () => {
  async function buildService() {
    const db = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    };
    const cls = {
      get: jest.fn((key: string) => {
        if (key === 'tenantId') return TENANT_A;
        if (key === 'tenantDb') return db;
        return undefined;
      }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService, { provide: ClsService, useValue: cls }],
    }).compile();
    return module.get<UserService>(UserService);
  }

  it('throws ForbiddenException when dto.tenant_id differs from CLS tenant', async () => {
    const service = await buildService();
    const dto = {
      tenant_id: TENANT_B,   // wrong tenant in body
      company_id: COMPANY_X,
      full_name: 'Cross Tenant User',
      email: 'cross@example.com',
      password: 'password123',
      user_type: 'STAFF' as const,
    };
    const actor = { userId: 'a', tenantId: TENANT_A, companyId: COMPANY_X, userType: 'TENANT_ADMIN' };
    await expect(service.create(dto as any, actor)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when actor.tenantId differs from CLS tenant', async () => {
    const service = await buildService();
    const dto = {
      tenant_id: TENANT_A,
      company_id: COMPANY_X,
      full_name: 'Valid Name',
      email: 'valid@example.com',
      password: 'password123',
      user_type: 'STAFF' as const,
    };
    // Actor from a completely different tenant
    const alienActor = { userId: 'a', tenantId: TENANT_B, companyId: COMPANY_X, userType: 'TENANT_ADMIN' };
    await expect(service.create(dto as any, alienActor)).rejects.toThrow(ForbiddenException);
  });
});

// ─── 7. RolesGuard — user context and permission enforcement ─────────────────

describe('RolesGuard — permission enforcement', () => {
  const viewPermission = { moduleCode: 'RBAC', resource: 'USER', action: 'view' };

  function makeGuard(permissionToReturn: object | null, dbQueryResult: unknown[] = []) {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(permissionToReturn),
    };
    const db = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue(dbQueryResult),
    };
    const cls = {
      get: jest.fn((key: string) => (key === 'tenantDb' ? db : undefined)),
    };
    return new RolesGuard(reflector as any, cls as unknown as ClsService);
  }

  it('allows access when no @RequirePermission is set on the route', async () => {
    const guard = makeGuard(null);
    const ctx = makeContext({ user: { userId: 'u', userType: 'STAFF' } });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('throws ForbiddenException when user context is missing and a permission is required', async () => {
    const guard = makeGuard(viewPermission);
    const ctx = makeContext({ user: undefined });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('short-circuits to true for SYSTEM_ADMIN without a DB lookup', async () => {
    const guard = makeGuard(viewPermission);
    const ctx = makeContext({ user: { userId: 'sa', userType: 'SYSTEM_ADMIN' } });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('short-circuits to true for COMPANY_ADMIN without a DB lookup', async () => {
    const guard = makeGuard(viewPermission);
    const ctx = makeContext({ user: { userId: 'ca', userType: 'COMPANY_ADMIN', companyId: COMPANY_X } });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('throws ForbiddenException when a STAFF user has no matching role permissions', async () => {
    // empty DB result = no permissions assigned
    const guard = makeGuard(viewPermission, []);
    const ctx = makeContext({ user: { userId: 'staff-1', userType: 'STAFF' } });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });
});
