import { Inject, Injectable } from '@nestjs/common'

import {
  canViewAppointment,
  findTransition,
  isAuthorizedForTransition,
  type Actor
} from './appointment-access.rules'
import {
  isRestrictedToOwnAppointments,
  resolveAppointmentPeriod
} from './appointment-filter.rules'
import { computeEndsAt, findMatchingShift } from './appointment-slot.rules'
import {
  toAppointmentResponse,
  type AppointmentResponseDto
} from './dtos/appointment-response.dto'
import type { CreateAppointmentDto } from './dtos/create-appointment.dto'
import type { ListAppointmentsQueryDto } from './dtos/list-appointments-query.dto'
import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository
} from './repositories/appointment.repository'
import type { Appointment } from '../@common/entities/appointment.entity'
import type { AppointmentStatusEnum } from '../@common/enums/appointment-status.enum'
import { RoleEnum } from '../@common/enums/role.enum'
import { DomainError } from '../@common/errors/domain-error'
import { buildPaginated, type Paginated } from '../@common/pagination/paginated'
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

  async list(
    query: ListAppointmentsQueryDto,
    actor: Actor
  ): Promise<Paginated<AppointmentResponseDto>> {
    const period = resolveAppointmentPeriod(query.from, query.to)
    if (!period.ok) {
      throw new DomainError('DADOS_INVALIDOS', period.reason)
    }

    let doctorId = query.doctorId
    if (isRestrictedToOwnAppointments(actor.roles)) {
      const ownDoctor = await this.doctorRepository.findByUserId(actor.userId)
      if (!ownDoctor) {
        return buildPaginated([], 0, query.page, query.pageSize)
      }
      doctorId = ownDoctor.id
    }

    const { items, total } = await this.appointmentRepository.list({
      doctorId,
      patientId: query.patientId,
      status: query.status,
      start: period.start,
      endExclusive: period.endExclusive,
      page: query.page,
      pageSize: query.pageSize
    })
    return buildPaginated(
      items.map(toAppointmentResponse),
      total,
      query.page,
      query.pageSize
    )
  }

  async getById(id: number, actor: Actor): Promise<AppointmentResponseDto> {
    const appointment = await this.findOrFail(id)

    const isAppointmentDoctor = await this.isDoctorOfAppointment(
      actor,
      appointment
    )
    if (!canViewAppointment(actor.roles, isAppointmentDoctor)) {
      throw new DomainError(
        'ACESSO_NEGADO',
        'Você não tem permissão para acessar esta consulta.'
      )
    }
    return toAppointmentResponse(appointment)
  }

  async updateStatus(
    id: number,
    newStatus: AppointmentStatusEnum,
    actor: Actor
  ): Promise<AppointmentResponseDto> {
    const appointment = await this.findOrFail(id)

    const transition = findTransition(appointment.status, newStatus)
    if (!transition) {
      throw new DomainError(
        'TRANSICAO_INVALIDA',
        `Não é possível mudar a consulta de ${appointment.status} para ${newStatus}.`
      )
    }

    const isAppointmentDoctor = await this.isDoctorOfAppointment(
      actor,
      appointment
    )
    if (
      !isAuthorizedForTransition(transition, actor.roles, isAppointmentDoctor)
    ) {
      throw new DomainError(
        'ACESSO_NEGADO',
        'Você não tem permissão para esta mudança de status.'
      )
    }

    const updated = await this.appointmentRepository.transitionStatus(
      id,
      appointment.status,
      newStatus
    )
    if (!updated) {
      throw new DomainError(
        'TRANSICAO_INVALIDA',
        'O status da consulta mudou durante a operação. Consulte novamente.'
      )
    }
    return toAppointmentResponse(updated)
  }

  private async findOrFail(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(id)
    if (!appointment) {
      throw new DomainError(
        'RECURSO_NAO_ENCONTRADO',
        'Consulta não encontrada.'
      )
    }
    return appointment
  }

  private async isDoctorOfAppointment(
    actor: Actor,
    appointment: Appointment
  ): Promise<boolean> {
    if (!actor.roles.includes(RoleEnum.DOCTOR)) {
      return false
    }
    const doctor = await this.doctorRepository.findByUserId(actor.userId)
    return doctor?.id === appointment.doctorId
  }
}
