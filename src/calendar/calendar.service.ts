import { Inject, Injectable } from '@nestjs/common'

import { resolveCalendarPeriod } from './calendar-period.rules'
import type { CalendarQueryDto } from './dtos/calendar-query.dto'
import {
  toCalendarResponse,
  type CalendarResponseDto
} from './dtos/calendar-response.dto'
import { DomainError } from '../@common/errors/domain-error'
import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository
} from '../appointments/repositories/appointment.repository'
import {
  DOCTOR_REPOSITORY,
  type DoctorRepository
} from '../doctors/repositories/doctor.repository'
import {
  WORK_SCHEDULE_REPOSITORY,
  type WorkScheduleRepository
} from '../work-schedule/repositories/work-schedule.repository'

@Injectable()
export class CalendarService {
  constructor(
    @Inject(DOCTOR_REPOSITORY)
    private readonly doctorRepository: DoctorRepository,
    @Inject(WORK_SCHEDULE_REPOSITORY)
    private readonly workScheduleRepository: WorkScheduleRepository,
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: AppointmentRepository
  ) {}

  async get(
    doctorId: number,
    query: CalendarQueryDto
  ): Promise<CalendarResponseDto> {
    const period = resolveCalendarPeriod(query.from, query.to)
    if (!period.ok) {
      throw new DomainError('DADOS_INVALIDOS', period.reason)
    }

    const doctor = await this.doctorRepository.findById(doctorId)
    if (!doctor) {
      throw new DomainError('RECURSO_NAO_ENCONTRADO', 'Médico não encontrado.')
    }

    const [shifts, appointments] = await Promise.all([
      this.workScheduleRepository.findShiftsByDoctor(doctor.id),
      this.appointmentRepository.findActiveByDoctorInPeriod(
        doctor.id,
        period.start,
        period.endExclusive
      )
    ])

    return toCalendarResponse({
      doctorId: doctor.id,
      from: query.from,
      to: query.to,
      shifts,
      appointments
    })
  }
}
