import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
  DataSource,
  EntityManager,
  LessThan,
  MoreThan,
  Not,
  Repository
} from 'typeorm'

import type {
  AppointmentRepository,
  AppointmentTransaction,
  NewAppointmentData
} from './appointment.repository'
import { Appointment } from '../../@common/entities/appointment.entity'
import { Doctor } from '../../@common/entities/doctor.entity'
import { Patient } from '../../@common/entities/patient.entity'
import { AppointmentStatusEnum } from '../../@common/enums/appointment-status.enum'
import { DomainError } from '../../@common/errors/domain-error'

class TypeormAppointmentTransaction implements AppointmentTransaction {
  constructor(private readonly repository: Repository<Appointment>) {}

  doctorHasActiveAppointment(
    doctorId: number,
    startsAt: Date,
    endsAt: Date
  ): Promise<boolean> {
    return this.repository.exists({
      where: {
        doctorId,
        status: Not(AppointmentStatusEnum.CANCELLED),
        startsAt: LessThan(endsAt),
        endsAt: MoreThan(startsAt)
      }
    })
  }

  patientHasActiveAppointment(
    patientId: number,
    startsAt: Date,
    endsAt: Date
  ): Promise<boolean> {
    return this.repository.exists({
      where: {
        patientId,
        status: Not(AppointmentStatusEnum.CANCELLED),
        startsAt: LessThan(endsAt),
        endsAt: MoreThan(startsAt)
      }
    })
  }

  insert(data: NewAppointmentData): Promise<Appointment> {
    return this.repository.save(this.repository.create(data))
  }
}

@Injectable()
export class AppointmentTypeormRepository implements AppointmentRepository {
  constructor(
    @InjectRepository(Appointment)
    private readonly repository: Repository<Appointment>,
    private readonly dataSource: DataSource
  ) {}

  runExclusively<T>(
    doctorId: number,
    patientId: number,
    work: (transaction: AppointmentTransaction) => Promise<T>
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      await this.lockDoctor(manager, doctorId)
      await this.lockPatient(manager, patientId)
      return work(
        new TypeormAppointmentTransaction(manager.getRepository(Appointment))
      )
    })
  }

  findById(id: number): Promise<Appointment | null> {
    return this.repository.findOneBy({ id })
  }

  async transitionStatus(
    id: number,
    from: AppointmentStatusEnum,
    to: AppointmentStatusEnum
  ): Promise<Appointment | null> {
    const result = await this.repository.update(
      { id, status: from },
      { status: to }
    )
    if (!result.affected) {
      return null
    }
    return this.repository.findOneBy({ id })
  }

  private async lockDoctor(
    manager: EntityManager,
    doctorId: number
  ): Promise<void> {
    const doctor = await manager.findOne(Doctor, {
      where: { id: doctorId },
      lock: { mode: 'pessimistic_write' },
      loadEagerRelations: false
    })
    if (!doctor) {
      throw new DomainError('RECURSO_NAO_ENCONTRADO', 'Médico não encontrado.')
    }
  }

  private async lockPatient(
    manager: EntityManager,
    patientId: number
  ): Promise<void> {
    const patient = await manager.findOne(Patient, {
      where: { id: patientId },
      lock: { mode: 'pessimistic_write' }
    })
    if (!patient) {
      throw new DomainError(
        'RECURSO_NAO_ENCONTRADO',
        'Paciente não encontrado.'
      )
    }
  }
}
