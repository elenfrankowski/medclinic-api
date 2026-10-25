export const MAX_CALENDAR_SPAN_DAYS = 31

export const MS_PER_DAY = 86_400_000
export const CLINIC_UTC_OFFSET = '-03:00'
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export type CalendarPeriodResult =
  { ok: true; start: Date; endExclusive: Date } | { ok: false; reason: string }

export function parseCalendarDate(value: string): Date | undefined {
  if (!DATE_PATTERN.test(value)) {
    return undefined
  }
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  const isRealDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  return isRealDate ? date : undefined
}

export function resolveCalendarPeriod(
  from: string,
  to: string
): CalendarPeriodResult {
  const fromDay = parseCalendarDate(from)
  const toDay = parseCalendarDate(to)
  if (!fromDay || !toDay) {
    return {
      ok: false,
      reason: 'from e to devem ser datas válidas no formato YYYY-MM-DD.'
    }
  }

  const spanDays = (toDay.getTime() - fromDay.getTime()) / MS_PER_DAY
  if (spanDays < 0) {
    return { ok: false, reason: 'from não pode ser posterior a to.' }
  }
  if (spanDays > MAX_CALENDAR_SPAN_DAYS) {
    return {
      ok: false,
      reason: `O intervalo máximo é de ${String(MAX_CALENDAR_SPAN_DAYS)} dias.`
    }
  }

  const start = new Date(`${from}T00:00:00${CLINIC_UTC_OFFSET}`)
  const endExclusive = new Date(start.getTime() + (spanDays + 1) * MS_PER_DAY)
  return { ok: true, start, endExclusive }
}
