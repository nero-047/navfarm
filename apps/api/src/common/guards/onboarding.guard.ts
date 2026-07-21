import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class OnboardingGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cls: ClsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const path = req.path;

    // Check if the current route is part of setup wizard, authentication, or tenant signup
    const isPublicOrSetup = 
      path.includes('/auth/') || 
      path.includes('/tenant/') || 
      path.includes('/setup/');

    if (isPublicOrSetup) {
      return true;
    }

    const tenantId = this.cls.get('tenantId');
    if (!tenantId) {
      return true;
    }

    // Dynamic database check will be wired here once Database connections are initialized
    return true;
  }
}
