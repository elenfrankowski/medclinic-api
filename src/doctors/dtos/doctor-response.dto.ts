import type { Doctor } from '../../@common/entities/doctor.entity'
import {
  toUserResponse,
  type UserResponseDto
} from '../../users/dtos/user-response.dto'

export interface DoctorResponseDto {
  id: number
  crm: string
  user: UserResponseDto
}

export function toDoctorResponse(doctor: Doctor): DoctorResponseDto {
  return { id: doctor.id, crm: doctor.crm, user: toUserResponse(doctor.user) }
}
