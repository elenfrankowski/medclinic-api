import { createParamDecorator, ExecutionContext } from '@nestjs/common'

import type { RoleEnum } from '../../@common/enums/role.enum'

export interface CurrentUserPayload {
  userId: number
  roles: RoleEnum[]
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUserPayload => {
    const request = context
      .switchToHttp()
      .getRequest<{ user: CurrentUserPayload }>()
    return request.user
  }
)
