import { describe, expect, it } from 'vitest'

import {
  isRestrictedToOwnAppointments,
  resolveAppointmentPeriod,
  type AppointmentPeriodResult
} from './appointment-filter.rules'
import { RoleEnum } from '../@common/enums/role.enum'

function reasonOf(result: AppointmentPeriodResult): string {
  return result.ok ? '' : result.reason
}

describe('resolveAppointmentPeriod', () => {
  it('aceita a ausência de filtro de datas', () => {
    expect(resolveAppointmentPeriod()).toEqual({
      ok: true,
      start: undefined,
      endExclusive: undefined
    })
  })

  it('converte um único dia em 24 horas a partir da meia-noite da clínica', () => {
    expect(resolveAppointmentPeriod('2026-10-27', '2026-10-27')).toEqual({
      ok: true,
      start: new Date('2026-10-27T03:00:00.000Z'),
      endExclusive: new Date('2026-10-28T03:00:00.000Z')
    })
  })

  it('aceita só from', () => {
    expect(resolveAppointmentPeriod('2026-10-27', undefined)).toEqual({
      ok: true,
      start: new Date('2026-10-27T03:00:00.000Z'),
      endExclusive: undefined
    })
  })

  it('aceita só to e inclui o dia inteiro', () => {
    expect(resolveAppointmentPeriod(undefined, '2026-10-27')).toEqual({
      ok: true,
      start: undefined,
      endExclusive: new Date('2026-10-28T03:00:00.000Z')
    })
  })

  it('não impõe limite de dias ao intervalo', () => {
    expect(resolveAppointmentPeriod('2026-01-01', '2026-12-31').ok).toBe(true)
  })

  it('recusa from posterior a to', () => {
    const result = resolveAppointmentPeriod('2026-10-30', '2026-10-27')

    expect(result.ok).toBe(false)
    expect(reasonOf(result)).toContain('posterior')
  })

  it.each<[string | undefined, string | undefined]>([
    ['27-10-2026', undefined],
    [undefined, '2026/10/27'],
    ['2026-02-30', '2026-03-05'],
    ['2026-10-01', '2026-13-01'],
    ['', undefined]
  ])('recusa data inválida (from=%s, to=%s)', (from, to) => {
    const result = resolveAppointmentPeriod(from, to)

    expect(result.ok).toBe(false)
    expect(reasonOf(result)).toContain('YYYY-MM-DD')
  })
})

describe('isRestrictedToOwnAppointments', () => {
  it('restringe o médico', () => {
    expect(isRestrictedToOwnAppointments([RoleEnum.DOCTOR])).toBe(true)
  })

  it('restringe quem acumula doctor e secretary', () => {
    expect(
      isRestrictedToOwnAppointments([RoleEnum.DOCTOR, RoleEnum.SECRETARY])
    ).toBe(true)
  })

  it.each([[[RoleEnum.ADMIN]], [[RoleEnum.SECRETARY]], [[]]])(
    'não restringe o perfil %j',
    (roles) => {
      expect(isRestrictedToOwnAppointments(roles)).toBe(false)
    }
  )

  it('não restringe quem acumula admin e doctor', () => {
    expect(
      isRestrictedToOwnAppointments([RoleEnum.ADMIN, RoleEnum.DOCTOR])
    ).toBe(false)
  })
})
