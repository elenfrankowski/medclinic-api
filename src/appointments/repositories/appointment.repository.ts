import type { Appointment } from '../../@common/entities/appointment.entity'
import type { AppointmentStatusEnum } from '../../@common/enums/appointment-status.enum'

export const APPOINTMENT_REPOSITORY = 'APPOINTMENT_REPOSITORY'

export interface NewAppointmentData {
  doctorId: number
  patientId: number
  startsAt: Date
  endsAt: Date
}

export interface AppointmentTransaction {
  doctorHasActiveAppointment(
    doctorId: number,
    startsAt: Date,
    endsAt: Date
  ): Promise<boolean>
  patientHasActiveAppointment(
    patientId: number,
    startsAt: Date,
    endsAt: Date
  ): Promise<boolean>
  insert(data: NewAppointmentData): Promise<Appointment>
}

export interface AppointmentRepository {
  runExclusively<T>(
    doctorId: number,
    patientId: number,
    work: (transaction: AppointmentTransaction) => Promise<T>
  ): Promise<T>
  findById(id: number): Promise<Appointment | null>
  transitionStatus(
    id: number,
    from: AppointmentStatusEnum,
    to: AppointmentStatusEnum
  ): Promise<Appointment | null>
}
