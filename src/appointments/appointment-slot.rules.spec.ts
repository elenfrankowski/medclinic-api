import { describe, expect, it } from 'vitest'

import {
  computeEndsAt,
  findMatchingShift,
  toClinicTime
} from './appointment-slot.rules'

const local = (date: string, time: string): Date =>
  new Date(`${date}T${time}:00-03:00`)

const MONDAY = '2026-10-26'
const TUESDAY = '2026-10-27'
const WEDNESDAY = '2026-10-28'

const tuesdayMorning = {
  weekDay: 2,
  startTime: '08:00:00',
  endTime: '12:00:00',
  slotDurationMinutes: 30
}
const tuesdayAfternoon = {
  weekDay: 2,
  startTime: '14:00:00',
  endTime: '18:00:00',
  slotDurationMinutes: 20
}
const wednesdayOdd = {
  weekDay: 3,
  startTime: '09:00:00',
  endTime: '10:00:00',
  slotDurationMinutes: 25
}
const shifts = [tuesdayMorning, tuesdayAfternoon, wednesdayOdd]

describe('toClinicTime', () => {
  it('converte um instante UTC para o dia da semana e a hora locais da clínica', () => {
    expect(toClinicTime(new Date('2026-10-27T11:00:00Z'))).toEqual({
      weekDay: 2,
      minutesOfDay: 480
    })
  })

  it('recua o dia quando o UTC já virou o dia mas o horário local não', () => {
    // 01:00Z de terça é 22:00 de segunda em São Paulo
    expect(toClinicTime(new Date('2026-10-27T01:00:00Z'))).toEqual({
      weekDay: 1,
      minutesOfDay: 1320
    })
  })

  it('mapeia domingo e sábado nas pontas da semana', () => {
    expect(toClinicTime(local('2026-11-01', '10:00')).weekDay).toBe(0)
    expect(toClinicTime(local('2026-10-31', '10:00')).weekDay).toBe(6)
  })
})

describe('findMatchingShift', () => {
  it('aceita o primeiro horário do turno', () => {
    expect(findMatchingShift(shifts, local(TUESDAY, '08:00'))).toBe(
      tuesdayMorning
    )
  })

  it('aceita um horário alinhado à grade do turno', () => {
    expect(findMatchingShift(shifts, local(TUESDAY, '08:30'))).toBe(
      tuesdayMorning
    )
    expect(findMatchingShift(shifts, local(TUESDAY, '14:40'))).toBe(
      tuesdayAfternoon
    )
  })

  it('aceita o último horário, cuja consulta termina exatamente no fim do turno', () => {
    expect(findMatchingShift(shifts, local(TUESDAY, '11:30'))).toBe(
      tuesdayMorning
    )
    expect(findMatchingShift(shifts, local(TUESDAY, '17:40'))).toBe(
      tuesdayAfternoon
    )
  })

  it('recusa horário desalinhado da grade', () => {
    expect(findMatchingShift(shifts, local(TUESDAY, '08:20'))).toBeUndefined()
    expect(findMatchingShift(shifts, local(TUESDAY, '14:10'))).toBeUndefined()
  })

  it('recusa horário antes do início do turno', () => {
    expect(findMatchingShift(shifts, local(TUESDAY, '07:30'))).toBeUndefined()
  })

  it('recusa horário entre dois turnos do mesmo dia', () => {
    expect(findMatchingShift(shifts, local(TUESDAY, '13:00'))).toBeUndefined()
  })

  it('recusa horário que começa exatamente no fim do turno', () => {
    expect(findMatchingShift(shifts, local(TUESDAY, '12:00'))).toBeUndefined()
  })

  it('recusa consulta que está na grade mas não cabe inteira no turno', () => {
    // turno 09:00-10:00 com consultas de 25 minutos: 09:50 está na grade, mas terminaria às 10:15
    expect(findMatchingShift(shifts, local(WEDNESDAY, '09:25'))).toBe(
      wednesdayOdd
    )
    expect(findMatchingShift(shifts, local(WEDNESDAY, '09:50'))).toBeUndefined()
  })

  it('recusa dia da semana sem turno', () => {
    expect(findMatchingShift(shifts, local(MONDAY, '08:00'))).toBeUndefined()
  })

  it('recusa horário com segundos, que fica fora da grade', () => {
    expect(
      findMatchingShift(shifts, new Date(`${TUESDAY}T08:00:30-03:00`))
    ).toBeUndefined()
  })

  it('recusa quando o médico não tem escala', () => {
    expect(findMatchingShift([], local(TUESDAY, '08:00'))).toBeUndefined()
  })

  it('escolhe o turno certo entre dois turnos encostados', () => {
    const morning = {
      weekDay: 2,
      startTime: '08:00:00',
      endTime: '12:00:00',
      slotDurationMinutes: 30
    }
    const afternoon = {
      weekDay: 2,
      startTime: '12:00:00',
      endTime: '18:00:00',
      slotDurationMinutes: 60
    }

    expect(
      findMatchingShift([morning, afternoon], local(TUESDAY, '12:00'))
    ).toBe(afternoon)
    expect(
      findMatchingShift([morning, afternoon], local(TUESDAY, '11:30'))
    ).toBe(morning)
  })
})

describe('computeEndsAt', () => {
  it('soma a duração da consulta ao início', () => {
    expect(computeEndsAt(new Date('2026-10-27T11:00:00.000Z'), 30)).toEqual(
      new Date('2026-10-27T11:30:00.000Z')
    )
  })
})
