import { periodsOverlap } from '../@common/rules/period.rules'

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export interface ShiftTimes {
  weekDay: number
  startTime: string
  endTime: string
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function hasInvalidTimeRange(shifts: ShiftTimes[]): boolean {
  return shifts.some(
    (shift) => timeToMinutes(shift.startTime) >= timeToMinutes(shift.endTime)
  )
}

export function hasOverlappingShifts(shifts: ShiftTimes[]): boolean {
  return shifts.some((shift, index) =>
    shifts
      .slice(index + 1)
      .some(
        (other) =>
          shift.weekDay === other.weekDay &&
          periodsOverlap(
            timeToMinutes(shift.startTime),
            timeToMinutes(shift.endTime),
            timeToMinutes(other.startTime),
            timeToMinutes(other.endTime)
          )
      )
  )
}
