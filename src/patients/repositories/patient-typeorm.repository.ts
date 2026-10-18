import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ILike, Repository } from 'typeorm'

import type {
  CreatePatientData,
  ListPatientsFilter,
  PatientPage,
  PatientRepository
} from './patient.repository'
import { Patient } from '../../@common/entities/patient.entity'
import { DomainError } from '../../@common/errors/domain-error'
import {
  escapeLike,
  isUniqueViolation
} from '../../@common/utils/query-helpers'

@Injectable()
export class PatientTypeormRepository implements PatientRepository {
  constructor(
    @InjectRepository(Patient) private readonly repository: Repository<Patient>
  ) {}

  async create(data: CreatePatientData): Promise<Patient> {
    try {
      return await this.repository.save(this.repository.create(data))
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DomainError(
          'CPF_JA_CADASTRADO',
          'Já existe um paciente com esse CPF.',
          { cause: error }
        )
      }
      throw error
    }
  }

  findById(id: number): Promise<Patient | null> {
    return this.repository.findOneBy({ id })
  }

  findByCpf(cpf: string): Promise<Patient | null> {
    return this.repository.findOneBy({ cpf })
  }

  async list({
    name,
    page,
    pageSize
  }: ListPatientsFilter): Promise<PatientPage> {
    const [items, total] = await this.repository.findAndCount({
      where: name ? { name: ILike(`%${escapeLike(name)}%`) } : {},
      order: { name: 'ASC', id: 'ASC' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })
    return { items, total }
  }

  save(patient: Patient): Promise<Patient> {
    return this.repository.save(patient)
  }

  async softDelete(id: number): Promise<void> {
    await this.repository.softDelete(id)
  }
}
