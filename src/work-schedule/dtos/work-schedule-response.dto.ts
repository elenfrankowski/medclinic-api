import type { WorkShift } from '../../@common/entities/work-shift.entity'

export interface ShiftResponseDto {
  weekDay: number
  startTime: string
  endTime: string
  slotDurationMinutes: number
}

export interface WorkScheduleResponseDto {
  shifts: ShiftResponseDto[]
}

const HH_MM_LENGTH = 5

export function toWorkScheduleResponse(
  shifts: WorkShift[]
): WorkScheduleResponseDto {
  return {
    shifts: shifts.map((shift) => ({
      weekDay: shift.weekDay,
      startTime: shift.startTime.slice(0, HH_MM_LENGTH),
      endTime: shift.endTime.slice(0, HH_MM_LENGTH),
      slotDurationMinutes: shift.slotDurationMinutes
    }))
  }
}
