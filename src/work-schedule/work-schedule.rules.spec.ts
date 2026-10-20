import { describe, expect, it } from 'vitest'

import {
  hasInvalidTimeRange,
  hasOverlappingShifts,
  TIME_PATTERN,
  timeToMinutes
} from './work-schedule.rules'

describe('timeToMinutes', () => {
  it('converte HH:MM em minutos desde a meia-noite', () => {
    expect(timeToMinutes('00:00')).toBe(0)
    expect(timeToMinutes('08:30')).toBe(510)
    expect(timeToMinutes('23:59')).toBe(1439)
  })
})

describe('TIME_PATTERN', () => {
  it('aceita horários válidos de 24 horas', () => {
    expect(TIME_PATTERN.test('00:00')).toBe(true)
    expect(TIME_PATTERN.test('08:00')).toBe(true)
    expect(TIME_PATTERN.test('23:59')).toBe(true)
  })

  it('recusa formatos inválidos', () => {
    for (const invalid of [
      '8:00',
      '24:00',
      '12:60',
      '12:5',
      'abc',
      '08:00:00',
      ''
    ]) {
      expect(TIME_PATTERN.test(invalid)).toBe(false)
    }
  })
})

describe('hasInvalidTimeRange', () => {
  it('aceita turnos com início anterior ao término', () => {
    expect(
      hasInvalidTimeRange([
        { weekDay: 1, startTime: '08:00', endTime: '12:00' }
      ])
    ).toBe(false)
  })

  it('recusa início igual ao término', () => {
    expect(
      hasInvalidTimeRange([
        { weekDay: 1, startTime: '08:00', endTime: '08:00' }
      ])
    ).toBe(true)
  })

  it('recusa início posterior ao término', () => {
    expect(
      hasInvalidTimeRange([
        { weekDay: 1, startTime: '12:00', endTime: '08:00' }
      ])
    ).toBe(true)
  })

  it('recusa quando apenas um dos turnos é inválido', () => {
    expect(
      hasInvalidTimeRange([
        { weekDay: 1, startTime: '08:00', endTime: '12:00' },
        { weekDay: 2, startTime: '18:00', endTime: '14:00' }
      ])
    ).toBe(true)
  })
})

describe('hasOverlappingShifts', () => {
  it('detecta turnos sobrepostos no mesmo dia da semana', () => {
    expect(
      hasOverlappingShifts([
        { weekDay: 2, startTime: '08:00', endTime: '12:00' },
        { weekDay: 2, startTime: '11:00', endTime: '15:00' }
      ])
    ).toBe(true)
  })

  it('detecta a sobreposição mesmo com os turnos fora de ordem', () => {
    expect(
      hasOverlappingShifts([
        { weekDay: 2, startTime: '14:00', endTime: '18:00' },
        { weekDay: 4, startTime: '08:00', endTime: '11:00' },
        { weekDay: 2, startTime: '13:00', endTime: '15:00' }
      ])
    ).toBe(true)
  })

  it('aceita turnos encostados no mesmo dia', () => {
    expect(
      hasOverlappingShifts([
        { weekDay: 2, startTime: '08:00', endTime: '12:00' },
        { weekDay: 2, startTime: '12:00', endTime: '18:00' }
      ])
    ).toBe(false)
  })

  it('aceita o mesmo horário em dias diferentes', () => {
    expect(
      hasOverlappingShifts([
        { weekDay: 2, startTime: '08:00', endTime: '12:00' },
        { weekDay: 4, startTime: '08:00', endTime: '12:00' }
      ])
    ).toBe(false)
  })

  it('aceita uma escala vazia ou com um único turno', () => {
    expect(hasOverlappingShifts([])).toBe(false)
    expect(
      hasOverlappingShifts([
        { weekDay: 0, startTime: '08:00', endTime: '12:00' }
      ])
    ).toBe(false)
  })
})
