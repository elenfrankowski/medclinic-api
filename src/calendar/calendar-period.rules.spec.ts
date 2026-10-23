import { describe, expect, it } from 'vitest'

import {
  MAX_CALENDAR_SPAN_DAYS,
  parseCalendarDate,
  resolveCalendarPeriod,
  type CalendarPeriodResult
} from './calendar-period.rules'

function reasonOf(result: CalendarPeriodResult): string {
  return result.ok ? '' : result.reason
}

describe('parseCalendarDate', () => {
  it('aceita uma data válida', () => {
    expect(parseCalendarDate('2026-10-27')).toEqual(
      new Date('2026-10-27T00:00:00.000Z')
    )
  })

  it('aceita 29 de fevereiro em ano bissexto', () => {
    expect(parseCalendarDate('2028-02-29')).toEqual(
      new Date('2028-02-29T00:00:00.000Z')
    )
  })

  it.each([
    '2026-02-29',
    '2026-02-30',
    '2026-13-01',
    '2026-00-10',
    '2026-04-31',
    '0000-01-01'
  ])('recusa a data impossível %s', (value) => {
    expect(parseCalendarDate(value)).toBeUndefined()
  })

  it.each([
    '27-10-2026',
    '2026/10/27',
    '2026-1-5',
    '20261027',
    '',
    'abc',
    '2026-10-27T08:00:00-03:00',
    ' 2026-10-27'
  ])('recusa o formato %s', (value) => {
    expect(parseCalendarDate(value)).toBeUndefined()
  })
})

describe('resolveCalendarPeriod', () => {
  it('converte um único dia em 24 horas a partir da meia-noite da clínica', () => {
    expect(resolveCalendarPeriod('2026-10-27', '2026-10-27')).toEqual({
      ok: true,
      start: new Date('2026-10-27T03:00:00.000Z'),
      endExclusive: new Date('2026-10-28T03:00:00.000Z')
    })
  })

  it('inclui o último dia do período por inteiro', () => {
    expect(resolveCalendarPeriod('2026-10-26', '2026-11-01')).toEqual({
      ok: true,
      start: new Date('2026-10-26T03:00:00.000Z'),
      endExclusive: new Date('2026-11-02T03:00:00.000Z')
    })
  })

  it('atravessa a virada de mês', () => {
    expect(resolveCalendarPeriod('2026-10-30', '2026-11-02')).toEqual({
      ok: true,
      start: new Date('2026-10-30T03:00:00.000Z'),
      endExclusive: new Date('2026-11-03T03:00:00.000Z')
    })
  })

  it('aceita o intervalo no limite máximo', () => {
    expect(MAX_CALENDAR_SPAN_DAYS).toBe(31)
    expect(resolveCalendarPeriod('2026-10-01', '2026-11-01').ok).toBe(true)
  })

  it('recusa o intervalo um dia acima do limite', () => {
    const result = resolveCalendarPeriod('2026-10-01', '2026-11-02')

    expect(result.ok).toBe(false)
    expect(reasonOf(result)).toContain('31')
  })

  it('recusa from posterior a to', () => {
    const result = resolveCalendarPeriod('2026-10-30', '2026-10-27')

    expect(result.ok).toBe(false)
    expect(reasonOf(result)).toContain('posterior')
  })

  it('recusa data impossível', () => {
    expect(resolveCalendarPeriod('2026-02-30', '2026-03-05').ok).toBe(false)
  })

  it('recusa formato inválido e orienta o formato esperado', () => {
    const result = resolveCalendarPeriod('27-10-2026', '2026-10-30')

    expect(result.ok).toBe(false)
    expect(reasonOf(result)).toContain('YYYY-MM-DD')
  })
})
