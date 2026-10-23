import { describe, expect, it } from 'vitest'

import {
  canViewAppointment,
  findTransition,
  isAuthorizedForTransition
} from './appointment-access.rules'
import { AppointmentStatusEnum } from '../@common/enums/appointment-status.enum'
import { RoleEnum } from '../@common/enums/role.enum'

const { SCHEDULED, IN_PROGRESS, DONE, CANCELLED } = AppointmentStatusEnum

const VALID_TRANSITIONS: [AppointmentStatusEnum, AppointmentStatusEnum][] = [
  [SCHEDULED, IN_PROGRESS],
  [SCHEDULED, CANCELLED],
  [IN_PROGRESS, DONE],
  [IN_PROGRESS, CANCELLED]
]

function transitionOf(from: AppointmentStatusEnum, to: AppointmentStatusEnum) {
  const transition = findTransition(from, to)
  if (!transition) {
    throw new Error(`Transição de teste inexistente: ${from} -> ${to}`)
  }
  return transition
}

describe('findTransition', () => {
  it.each(VALID_TRANSITIONS)('prevê a transição %s -> %s', (from, to) => {
    expect(findTransition(from, to)).toBeDefined()
  })

  it.each<[AppointmentStatusEnum, AppointmentStatusEnum]>([
    [SCHEDULED, DONE],
    [SCHEDULED, SCHEDULED],
    [IN_PROGRESS, SCHEDULED],
    [IN_PROGRESS, IN_PROGRESS],
    [DONE, SCHEDULED],
    [DONE, IN_PROGRESS],
    [DONE, CANCELLED],
    [CANCELLED, SCHEDULED],
    [CANCELLED, IN_PROGRESS],
    [CANCELLED, DONE]
  ])('não prevê a transição %s -> %s', (from, to) => {
    expect(findTransition(from, to)).toBeUndefined()
  })
})

describe('isAuthorizedForTransition', () => {
  it.each(VALID_TRANSITIONS)(
    'o médico da consulta realiza %s -> %s',
    (from, to) => {
      expect(
        isAuthorizedForTransition(
          transitionOf(from, to),
          [RoleEnum.DOCTOR],
          true
        )
      ).toBe(true)
    }
  )

  it.each(VALID_TRANSITIONS)('admin realiza %s -> %s', (from, to) => {
    expect(
      isAuthorizedForTransition(transitionOf(from, to), [RoleEnum.ADMIN], false)
    ).toBe(true)
  })

  it('secretary cancela consulta agendada', () => {
    expect(
      isAuthorizedForTransition(
        transitionOf(SCHEDULED, CANCELLED),
        [RoleEnum.SECRETARY],
        false
      )
    ).toBe(true)
  })

  it.each<[AppointmentStatusEnum, AppointmentStatusEnum]>([
    [SCHEDULED, IN_PROGRESS],
    [IN_PROGRESS, DONE],
    [IN_PROGRESS, CANCELLED]
  ])('secretary não realiza %s -> %s', (from, to) => {
    expect(
      isAuthorizedForTransition(
        transitionOf(from, to),
        [RoleEnum.SECRETARY],
        false
      )
    ).toBe(false)
  })

  it.each(VALID_TRANSITIONS)(
    'médico que não é o da consulta não realiza %s -> %s',
    (from, to) => {
      expect(
        isAuthorizedForTransition(
          transitionOf(from, to),
          [RoleEnum.DOCTOR],
          false
        )
      ).toBe(false)
    }
  )

  it('recusa quem não tem nenhum perfil', () => {
    expect(
      isAuthorizedForTransition(transitionOf(SCHEDULED, CANCELLED), [], false)
    ).toBe(false)
  })
})

describe('canViewAppointment', () => {
  it('permite admin e secretary', () => {
    expect(canViewAppointment([RoleEnum.ADMIN], false)).toBe(true)
    expect(canViewAppointment([RoleEnum.SECRETARY], false)).toBe(true)
  })

  it('permite o médico da consulta', () => {
    expect(canViewAppointment([RoleEnum.DOCTOR], true)).toBe(true)
  })

  it('recusa médico que não é o da consulta', () => {
    expect(canViewAppointment([RoleEnum.DOCTOR], false)).toBe(false)
  })

  it('recusa quem não tem nenhum perfil', () => {
    expect(canViewAppointment([], false)).toBe(false)
  })
})
