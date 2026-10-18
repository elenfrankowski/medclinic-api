import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import type { CreateUserData, UserRepository } from './user.repository'
import { User } from '../../@common/entities/user.entity'
import { DomainError } from '../../@common/errors/domain-error'
import { isUniqueViolation } from '../../@common/utils/query-helpers'

@Injectable()
export class UserTypeormRepository implements UserRepository {
  constructor(
    @InjectRepository(User) private readonly repository: Repository<User>
  ) {}

  async create(data: CreateUserData): Promise<User> {
    try {
      return await this.repository.save(this.repository.create(data))
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DomainError(
          'EMAIL_JA_CADASTRADO',
          'Já existe um usuário com esse e-mail.',
          { cause: error }
        )
      }
      throw error
    }
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repository.findOneBy({ email })
  }

  findById(id: number): Promise<User | null> {
    return this.repository.findOneBy({ id })
  }
}
