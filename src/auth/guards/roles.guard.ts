import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { RoleEnum } from '../../@common/enums/role.enum'
import { ROLES_KEY } from '../decorators/roles.decorator'

interface RequestUser {
  role: RoleEnum
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesPermitidas = this.reflector.getAllAndOverride<
      RoleEnum[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()])
    if (!rolesPermitidas || rolesPermitidas.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest<{ user: RequestUser }>()
    if (!rolesPermitidas.includes(request.user.role)) {
      throw new ForbiddenException(
        'Você não tem permissão para acessar este recurso.'
      )
    }
    return true
  }
}
