import type { User } from '../../@common/entities/user.entity'
import type { RoleEnum } from '../../@common/enums/role.enum'

export const USER_REPOSITORY = 'USER_REPOSITORY'

export interface CreateUserData {
  name: string
  email: string
  password: string
  roles: RoleEnum[]
}

export interface UserRepository {
  create(data: CreateUserData): Promise<User>
  findByEmail(email: string): Promise<User | null>
  findById(id: number): Promise<User | null>
}
