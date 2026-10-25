import { AppointmentStatusEnum } from '../@common/enums/appointment-status.enum'
import { RoleEnum } from '../@common/enums/role.enum'

export const CARE_LINK_STATUSES: AppointmentStatusEnum[] = [
  AppointmentStatusEnum.IN_PROGRESS,
  AppointmentStatusEnum.DONE
]

export function canWriteMedicalRecord(roles: RoleEnum[]): boolean {
  return roles.includes(RoleEnum.DOCTOR)
}

export function canReadMedicalRecord(roles: RoleEnum[]): boolean {
  return roles.includes(RoleEnum.DOCTOR) || roles.includes(RoleEnum.ADMIN)
}

export function isCareLinkRequiredToRead(roles: RoleEnum[]): boolean {
  return !roles.includes(RoleEnum.ADMIN)
}
