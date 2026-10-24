import type { Appointment } from '../../@common/entities/appointment.entity'
import type { WorkShift } from '../../@common/entities/work-shift.entity'
import {
  toAppointmentResponse,
  type AppointmentResponseDto
} from '../../appointments/dtos/appointment-response.dto'
import {
  toWorkScheduleResponse,
  type WorkScheduleResponseDto
} from '../../work-schedule/dtos/work-schedule-response.dto'

export interface CalendarResponseDto {
  doctorId: number
  from: string
  to: string
  workSchedule: WorkScheduleResponseDto
  appointments: AppointmentResponseDto[]
}

interface CalendarSource {
  doctorId: number
  from: string
  to: string
  shifts: WorkShift[]
  appointments: Appointment[]
}

export function toCalendarResponse(
  source: CalendarSource
): CalendarResponseDto {
  return {
    doctorId: source.doctorId,
    from: source.from,
    to: source.to,
    workSchedule: toWorkScheduleResponse(source.shifts),
    appointments: source.appointments.map(toAppointmentResponse)
  }
}
