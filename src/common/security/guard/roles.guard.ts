import { ROLES_KEY } from '@common/security/decorator/roles.decorator';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Role } from '@domain/enums/role.enums';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest<any>();
    const { user, roles } = request;
    if (!user || !roles) {
      console.error('User or roles not found in request:', user, roles);
      throw new UnauthorizedException('User or roles not found in request');
    }
    return requiredRoles.some((role) => roles.includes(role));
  }
}
