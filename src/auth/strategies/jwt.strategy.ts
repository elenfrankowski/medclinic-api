import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

import { requireEnv } from '../../@common/config/env'
import type { RoleEnum } from '../../@common/enums/role.enum'
import type { CurrentUserPayload } from '../decorators/current-user.decorator'

interface JwtPayload {
  sub: number
  roles: RoleEnum[]
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireEnv('JWT_SECRET')
    })
  }

  validate(payload: JwtPayload): CurrentUserPayload {
    return { userId: payload.sub, roles: payload.roles }
  }
}
