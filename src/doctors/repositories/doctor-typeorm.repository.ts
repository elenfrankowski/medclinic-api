import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, ILike, Repository } from 'typeorm'

import type {
  DoctorPage,
  DoctorRepository,
  ListDoctorsFilter
} from './doctor.repository'
import { Doctor } from '../../@common/entities/doctor.entity'
import { User } from '../../@common/entities/user.entity'
import { DomainError } from '../../@common/errors/domain-error'
import {
  escapeLike,
  getViolatedConstraint
} from '../../@common/utils/query-helpers'
import type { CreateUserData } from '../../users/repositories/user.repository'

const CRM_UNIQUE_CONSTRAINT = 'UQ_doctors_crm'
const EMAIL_UNIQUE_CONSTRAINT = 'UQ_users_email'

@Injectable()
export class DoctorTypeormRepository implements DoctorRepository {
  constructor(
    @InjectRepository(Doctor) private readonly repository: Repository<Doctor>,
    private readonly dataSource: DataSource
  ) {}

  async createWithUser(userData: CreateUserData, crm: string): Promise<Doctor> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const user = await manager.save(manager.create(User, userData))
        return manager.save(manager.create(Doctor, { crm, user }))
      })
    } catch (error) {
      const constraint = getViolatedConstraint(error)
      if (constraint === CRM_UNIQUE_CONSTRAINT) {
        throw new DomainError(
          'CRM_JA_CADASTRADO',
          'Já existe um médico com esse CRM.',
          { cause: error }
        )
      }
      if (constraint === EMAIL_UNIQUE_CONSTRAINT) {
        throw new DomainError(
          'EMAIL_JA_CADASTRADO',
          'Já existe um usuário com esse e-mail.',
          { cause: error }
        )
      }
      throw error
    }
  }

  findById(id: number): Promise<Doctor | null> {
    return this.repository.findOneBy({ id })
  }

  findByCrm(crm: string): Promise<Doctor | null> {
    return this.repository.findOneBy({ crm })
  }

  async list({ name, page, pageSize }: ListDoctorsFilter): Promise<DoctorPage> {
    const [items, total] = await this.repository.findAndCount({
      where: name ? { user: { name: ILike(`%${escapeLike(name)}%`) } } : {},
      order: { user: { name: 'ASC' }, id: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
    return { items, total }
  }
}
