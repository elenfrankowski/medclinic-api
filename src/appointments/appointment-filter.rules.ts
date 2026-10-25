import { RoleEnum } from '../@common/enums/role.enum'
import {
  CLINIC_UTC_OFFSET,
  MS_PER_DAY,
  parseCalendarDate
} from '../calendar/calendar-period.rules'

export type AppointmentPeriodResult =
  | { ok: true; start: Date | undefined; endExclusive: Date | undefined }
  | { ok: false; reason: string }

function clinicDayStart(date: string): Date {
  return new Date(`${date}T00:00:00${CLINIC_UTC_OFFSET}`)
}

export function resolveAppointmentPeriod(
  from?: string,
  to?: string
): AppointmentPeriodResult {
  const fromDay = from === undefined ? undefined : parseCalendarDate(from)
  const toDay = to === undefined ? undefined : parseCalendarDate(to)

  if ((from !== undefined && !fromDay) || (to !== undefined && !toDay)) {
    return {
      ok: false,
      reason: 'from e to devem ser datas válidas no formato YYYY-MM-DD.'
    }
  }
  if (fromDay && toDay && fromDay.getTime() > toDay.getTime()) {
    return { ok: false, reason: 'from não pode ser posterior a to.' }
  }

  return {
    ok: true,
    start: from === undefined ? undefined : clinicDayStart(from),
    endExclusive:
      to === undefined
        ? undefined
        : new Date(clinicDayStart(to).getTime() + MS_PER_DAY)
  }
}

export function isRestrictedToOwnAppointments(roles: RoleEnum[]): boolean {
  return roles.includes(RoleEnum.DOCTOR) && !roles.includes(RoleEnum.ADMIN)
}
