import { Inject, Injectable } from '@nestjs/common'

import { computeEndsAt, findMatchingShift } from './appointment-slot.rules'
import {
  toAppointmentResponse,
  type AppointmentResponseDto
} from './dtos/appointment-response.dto'
import type { CreateAppointmentDto } from './dtos/create-appointment.dto'
import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository
} from './repositories/appointment.repository'
import { DomainError } from '../@common/errors/domain-error'
import {
  DOCTOR_REPOSITORY,
  type DoctorRepository
} from '../doctors/repositories/doctor.repository'
import {
  PATIENT_REPOSITORY,
  type PatientRepository
} from '../patients/repositories/patient.repository'
import {
  WORK_SCHEDULE_REPOSITORY,
  type WorkScheduleRepository
} from '../work-schedule/repositories/work-schedule.repository'

@Injectable()
export class AppointmentsService {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: AppointmentRepository,
    @Inject(DOCTOR_REPOSITORY)
    private readonly doctorRepository: DoctorRepository,
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
    @Inject(WORK_SCHEDULE_REPOSITORY)
    private readonly workScheduleRepository: WorkScheduleRepository
  ) {}

  async create(dto: CreateAppointmentDto): Promise<AppointmentResponseDto> {
    const startsAt = new Date(dto.startsAt)
    if (Number.isNaN(startsAt.getTime())) {
      throw new DomainError(
        'DADOS_INVALIDOS',
        'startsAt não é uma data válida.'
      )
    }

    const doctor = await this.doctorRepository.findById(dto.doctorId)
    if (!doctor) {
      throw new DomainError('RECURSO_NAO_ENCONTRADO', 'Médico não encontrado.')
    }
    const patient = await this.patientRepository.findById(dto.patientId)
    if (!patient) {
      throw new DomainError(
        'RECURSO_NAO_ENCONTRADO',
        'Paciente não encontrado.'
      )
    }

    const shifts = await this.workScheduleRepository.findShiftsByDoctor(
      doctor.id
    )
    const shift = findMatchingShift(shifts, startsAt)
    if (!shift) {
      throw new DomainError(
        'HORARIO_FORA_DA_ESCALA',
        'O horário não existe na escala do médico.'
      )
    }
    const endsAt = computeEndsAt(startsAt, shift.slotDurationMinutes)

    const appointment = await this.appointmentRepository.runExclusively(
      doctor.id,
      patient.id,
      async (transaction) => {
        if (
          await transaction.doctorHasActiveAppointment(
            doctor.id,
            startsAt,
            endsAt
          )
        ) {
          throw new DomainError(
            'HORARIO_INDISPONIVEL',
            'Este horário acabou de ser ocupado.'
          )
        }
        if (
          await transaction.patientHasActiveAppointment(
            patient.id,
            startsAt,
            endsAt
          )
        ) {
          throw new DomainError(
            'PACIENTE_INDISPONIVEL',
            'O paciente já tem consulta nesse período.'
          )
        }
        return transaction.insert({
          doctorId: doctor.id,
          patientId: patient.id,
          startsAt,
          endsAt
        })
      }
    )

    return toAppointmentResponse(appointment)
  }
}
