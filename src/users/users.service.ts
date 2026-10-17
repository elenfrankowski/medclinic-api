import { Inject, Injectable } from '@nestjs/common'

import type { CreateUserDto } from './dtos/create-user.dto'
import { toUserResponse, type UserResponseDto } from './dtos/user-response.dto'
import {
  USER_REPOSITORY,
  type UserRepository
} from './repositories/user.repository'
import { DomainError } from '../@common/errors/domain-error'
import { hashPassword } from '../@common/utils/hash.util'

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findByEmail(dto.email)
    if (existingUser) {
      throw new DomainError(
        'EMAIL_JA_CADASTRADO',
        'Já existe um usuário com esse e-mail.'
      )
    }

    const password = await hashPassword(dto.password)
    const user = await this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password,
      roles: dto.roles
    })
    return toUserResponse(user)
  }

  async getProfile(id: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new DomainError('RECURSO_NAO_ENCONTRADO', 'Usuário não encontrado.')
    }
    return toUserResponse(user)
  }
}
