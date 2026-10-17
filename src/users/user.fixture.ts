import { vi } from 'vitest'

import type { UserRepository } from './repositories/user.repository'
import type { User } from '../@common/entities/user.entity'
import { RoleEnum } from '../@common/enums/role.enum'

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    name: 'Dra. Ana',
    email: 'ana@medclinic.com',
    password: 'hash-da-senha',
    roles: [RoleEnum.ADMIN],
    createdAt: new Date('2026-10-01T10:00:00Z'),
    ...overrides
  }
}

export function buildUserRepositoryFake() {
  return {
    create: vi.fn<UserRepository['create']>(),
    findByEmail: vi.fn<UserRepository['findByEmail']>(),
    findById: vi.fn<UserRepository['findById']>()
  }
}
