import type { Appointment } from '../../@common/entities/appointment.entity'
import type { AppointmentStatusEnum } from '../../@common/enums/appointment-status.enum'

export interface AppointmentResponseDto {
  id: number
  doctorId: number
  patientId: number
  startsAt: string
  endsAt: string
  status: AppointmentStatusEnum
}

export function toAppointmentResponse(
  appointment: Appointment
): AppointmentResponseDto {
  return {
    id: appointment.id,
    doctorId: appointment.doctorId,
    patientId: appointment.patientId,
    startsAt: appointment.startsAt.toISOString(),
    endsAt: appointment.endsAt.toISOString(),
    status: appointment.status
  }
}
