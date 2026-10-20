import { Inject, Injectable } from '@nestjs/common'

import type { CreateDoctorDto } from './dtos/create-doctor.dto'
import {
  toDoctorResponse,
  type DoctorResponseDto
} from './dtos/doctor-response.dto'
import type { ListDoctorsQueryDto } from './dtos/list-doctors-query.dto'
import {
  DOCTOR_REPOSITORY,
  type DoctorRepository
} from './repositories/doctor.repository'
import { RoleEnum } from '../@common/enums/role.enum'
import { DomainError } from '../@common/errors/domain-error'
import { buildPaginated, type Paginated } from '../@common/pagination/paginated'
import { hashPassword } from '../@common/utils/hash.util'
import {
  USER_REPOSITORY,
  type UserRepository
} from '../users/repositories/user.repository'

@Injectable()
export class DoctorsService {
  constructor(
    @Inject(DOCTOR_REPOSITORY)
    private readonly doctorRepository: DoctorRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository
  ) {}

  async create(dto: CreateDoctorDto): Promise<DoctorResponseDto> {
    const existingUser = await this.userRepository.findByEmail(dto.email)
    if (existingUser) {
      throw new DomainError(
        'EMAIL_JA_CADASTRADO',
        'Já existe um usuário com esse e-mail.'
      )
    }

    const existingDoctor = await this.doctorRepository.findByCrm(dto.crm)
    if (existingDoctor) {
      throw new DomainError(
        'CRM_JA_CADASTRADO',
        'Já existe um médico com esse CRM.'
      )
    }

    const password = await hashPassword(dto.password)
    const doctor = await this.doctorRepository.createWithUser(
      { name: dto.name, email: dto.email, password, roles: [RoleEnum.DOCTOR] },
      dto.crm
    )
    return toDoctorResponse(doctor)
  }

  async list(
    query: ListDoctorsQueryDto
  ): Promise<Paginated<DoctorResponseDto>> {
    const { items, total } = await this.doctorRepository.list({
      name: query.name,
      page: query.page,
      pageSize: query.pageSize
    })
    return buildPaginated(
      items.map(toDoctorResponse),
      total,
      query.page,
      query.pageSize
    )
  }

  async getById(id: number): Promise<DoctorResponseDto> {
    const doctor = await this.doctorRepository.findById(id)
    if (!doctor) {
      throw new DomainError('RECURSO_NAO_ENCONTRADO', 'Médico não encontrado.')
    }
    return toDoctorResponse(doctor)
  }
}
