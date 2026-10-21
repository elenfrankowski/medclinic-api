import { timeToMinutes } from '../work-schedule/work-schedule.rules'

const CLINIC_TIME_ZONE = 'America/Sao_Paulo'
const MS_PER_MINUTE = 60_000

const WEEK_DAY_BY_NAME: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
}

const clinicFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CLINIC_TIME_ZONE,
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23'
})

export interface ClinicTime {
  weekDay: number
  minutesOfDay: number
}

export interface SlotShift {
  weekDay: number
  startTime: string
  endTime: string
  slotDurationMinutes: number
}

export function toClinicTime(instant: Date): ClinicTime {
  const values: Record<string, string> = {}
  for (const part of clinicFormatter.formatToParts(instant)) {
    values[part.type] = part.value
  }
  return {
    weekDay: WEEK_DAY_BY_NAME[values.weekday],
    minutesOfDay: Number(values.hour) * 60 + Number(values.minute)
  }
}

export function findMatchingShift(
  shifts: SlotShift[],
  startsAt: Date
): SlotShift | undefined {
  if (startsAt.getTime() % MS_PER_MINUTE !== 0) {
    return undefined
  }

  const { weekDay, minutesOfDay } = toClinicTime(startsAt)
  return shifts.find((shift) => {
    if (shift.weekDay !== weekDay) {
      return false
    }
    const shiftStart = timeToMinutes(shift.startTime)
    const shiftEnd = timeToMinutes(shift.endTime)
    const isInsideShift = minutesOfDay >= shiftStart
    const isAlignedToGrid =
      (minutesOfDay - shiftStart) % shift.slotDurationMinutes === 0
    const fitsInShift = minutesOfDay + shift.slotDurationMinutes <= shiftEnd
    return isInsideShift && isAlignedToGrid && fitsInShift
  })
}

export function computeEndsAt(
  startsAt: Date,
  slotDurationMinutes: number
): Date {
  return new Date(startsAt.getTime() + slotDurationMinutes * MS_PER_MINUTE)
}
