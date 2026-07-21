import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class SystemAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.userType !== 'SYSTEM_ADMIN') {
      throw new UnauthorizedException('Access denied. Platform Administrator privileges required.');
    }

    return true;
  }
}
