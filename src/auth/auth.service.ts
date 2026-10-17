import { Inject, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import type { AccessTokenDto } from './dtos/access-token.dto'
import type { LoginDto } from './dtos/login.dto'
import { DomainError } from '../@common/errors/domain-error'
import { comparePassword } from '../@common/utils/hash.util'
import {
  USER_REPOSITORY,
  type UserRepository
} from '../users/repositories/user.repository'

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService
  ) {}

  async login(dto: LoginDto): Promise<AccessTokenDto> {
    const user = await this.userRepository.findByEmail(dto.email)
    if (!user) {
      throw new DomainError('CREDENCIAIS_INVALIDAS', 'Credenciais inválidas.')
    }

    const passwordMatches = await comparePassword(dto.password, user.password)
    if (!passwordMatches) {
      throw new DomainError('CREDENCIAIS_INVALIDAS', 'Credenciais inválidas.')
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      roles: user.roles
    })
    return { accessToken }
  }
}
