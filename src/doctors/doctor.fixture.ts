import { vi } from 'vitest'

import type { DoctorRepository } from './repositories/doctor.repository'
import type { Doctor } from '../@common/entities/doctor.entity'
import { RoleEnum } from '../@common/enums/role.enum'
import { buildUser } from '../users/user.fixture'

export function buildDoctor(overrides: Partial<Doctor> = {}): Doctor {
  return {
    id: 3,
    crm: 'CRM-SC-54321',
    user: buildUser({
      id: 7,
      name: 'Dra. Helena Souza',
      email: 'helena@medclinic.com',
      roles: [RoleEnum.DOCTOR]
    }),
    createdAt: new Date('2026-10-20T14:03:11.000Z'),
    ...overrides
  }
}

export function buildDoctorRepositoryFake() {
  return {
    createWithUser: vi.fn<DoctorRepository['createWithUser']>(),
    findById: vi.fn<DoctorRepository['findById']>(),
    findByCrm: vi.fn<DoctorRepository['findByCrm']>(),
    list: vi.fn<DoctorRepository['list']>()
  }
}
