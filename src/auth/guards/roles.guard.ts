import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import type { RoleEnum } from '../../@common/enums/role.enum'
import type { CurrentUserPayload } from '../decorators/current-user.decorator'
import { ROLES_KEY } from '../decorators/roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      RoleEnum[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()])
    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const { user } = context
      .switchToHttp()
      .getRequest<{ user: CurrentUserPayload }>()
    if (!user.roles.some((role) => requiredRoles.includes(role))) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este recurso.'
      )
    }
    return true
  }
}
