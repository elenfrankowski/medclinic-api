import { Inject, Injectable } from '@nestjs/common'

import type { CreatePatientDto } from './dtos/create-patient.dto'
import type { ListPatientsQueryDto } from './dtos/list-patients-query.dto'
import {
  toPatientResponse,
  type PatientResponseDto
} from './dtos/patient-response.dto'
import type { UpdatePatientDto } from './dtos/update-patient.dto'
import {
  PATIENT_REPOSITORY,
  type PatientRepository
} from './repositories/patient.repository'
import type { Patient } from '../@common/entities/patient.entity'
import { DomainError } from '../@common/errors/domain-error'
import { buildPaginated, type Paginated } from '../@common/pagination/paginated'

@Injectable()
export class PatientsService {
  constructor(
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository
  ) {}

  async create(dto: CreatePatientDto): Promise<PatientResponseDto> {
    const existingPatient = await this.patientRepository.findByCpf(dto.cpf)
    if (existingPatient) {
      throw new DomainError(
        'CPF_JA_CADASTRADO',
        'Já existe um paciente com esse CPF.'
      )
    }

    const patient = await this.patientRepository.create({
      name: dto.name,
      cpf: dto.cpf
    })
    return toPatientResponse(patient)
  }

  async list(
    query: ListPatientsQueryDto
  ): Promise<Paginated<PatientResponseDto>> {
    const { items, total } = await this.patientRepository.list({
      name: query.name,
      page: query.page,
      pageSize: query.pageSize
    })
    return buildPaginated(
      items.map(toPatientResponse),
      total,
      query.page,
      query.pageSize
    )
  }

  async getById(id: number): Promise<PatientResponseDto> {
    return toPatientResponse(await this.findOrFail(id))
  }

  async update(id: number, dto: UpdatePatientDto): Promise<PatientResponseDto> {
    const patient = await this.findOrFail(id)
    if (dto.name !== undefined) {
      patient.name = dto.name
    }
    return toPatientResponse(await this.patientRepository.save(patient))
  }

  async remove(id: number): Promise<void> {
    await this.findOrFail(id)
    await this.patientRepository.softDelete(id)
  }

  private async findOrFail(id: number): Promise<Patient> {
    const patient = await this.patientRepository.findById(id)
    if (!patient) {
      throw new DomainError(
        'RECURSO_NAO_ENCONTRADO',
        'Paciente não encontrado.'
      )
    }
    return patient
  }
}
