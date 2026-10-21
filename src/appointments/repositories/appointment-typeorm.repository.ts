import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { LessThan, MoreThan, Not, Repository } from 'typeorm'

import type {
  AppointmentRepository,
  AppointmentTransaction,
  NewAppointmentData
} from './appointment.repository'
import { Appointment } from '../../@common/entities/appointment.entity'
import { AppointmentStatusEnum } from '../../@common/enums/appointment-status.enum'

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
    private readonly repository: Repository<Appointment>
  ) {}

  // A Etapa 7 envolve este método em transação com bloqueio das linhas do médico e do paciente.
  runExclusively<T>(
    _doctorId: number,
    _patientId: number,
    work: (transaction: AppointmentTransaction) => Promise<T>
  ): Promise<T> {
    return work(new TypeormAppointmentTransaction(this.repository))
  }
}
