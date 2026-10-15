import type { User } from '../../@common/entities/user.entity'
import type { RoleEnum } from '../../@common/enums/role.enum'

export interface UserResponseDto {
  id: number
  name: string
  email: string
  roles: RoleEnum[]
}

export function toUserResponse(user: User): UserResponseDto {
  return { id: user.id, name: user.name, email: user.email, roles: user.roles }
}
