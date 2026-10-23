import { AppointmentStatusEnum } from '../@common/enums/appointment-status.enum'
import { RoleEnum } from '../@common/enums/role.enum'

export interface Actor {
  userId: number
  roles: RoleEnum[]
}

export interface StatusTransition {
  from: AppointmentStatusEnum
  to: AppointmentStatusEnum
  allowedRoles: RoleEnum[]
}

// O médico da consulta pode realizar todas as transições da tabela, além dos perfis listados.
const STATUS_TRANSITIONS: StatusTransition[] = [
  {
    from: AppointmentStatusEnum.SCHEDULED,
    to: AppointmentStatusEnum.IN_PROGRESS,
    allowedRoles: [RoleEnum.ADMIN]
  },
  {
    from: AppointmentStatusEnum.SCHEDULED,
    to: AppointmentStatusEnum.CANCELLED,
    allowedRoles: [RoleEnum.ADMIN, RoleEnum.SECRETARY]
  },
  {
    from: AppointmentStatusEnum.IN_PROGRESS,
    to: AppointmentStatusEnum.DONE,
    allowedRoles: [RoleEnum.ADMIN]
  },
  {
    from: AppointmentStatusEnum.IN_PROGRESS,
    to: AppointmentStatusEnum.CANCELLED,
    allowedRoles: [RoleEnum.ADMIN]
  }
]

export function findTransition(
  from: AppointmentStatusEnum,
  to: AppointmentStatusEnum
): StatusTransition | undefined {
  return STATUS_TRANSITIONS.find(
    (transition) => transition.from === from && transition.to === to
  )
}

export function isAuthorizedForTransition(
  transition: StatusTransition,
  roles: RoleEnum[],
  isAppointmentDoctor: boolean
): boolean {
  return (
    isAppointmentDoctor ||
    roles.some((role) => transition.allowedRoles.includes(role))
  )
}

export function canViewAppointment(
  roles: RoleEnum[],
  isAppointmentDoctor: boolean
): boolean {
  return (
    isAppointmentDoctor ||
    roles.includes(RoleEnum.ADMIN) ||
    roles.includes(RoleEnum.SECRETARY)
  )
}
