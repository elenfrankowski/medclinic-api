import { vi } from 'vitest'

import type { PatientRepository } from './repositories/patient.repository'
import type { Patient } from '../@common/entities/patient.entity'

export function buildPatient(overrides: Partial<Patient> = {}): Patient {
  return {
    id: 1,
    name: 'Carlos Pereira',
    cpf: '12345678901',
    createdAt: new Date('2026-10-20T14:03:11.000Z'),
    ...overrides
  }
}

export function buildPatientRepositoryFake() {
  return {
    create: vi.fn<PatientRepository['create']>(),
    findById: vi.fn<PatientRepository['findById']>(),
    findByCpf: vi.fn<PatientRepository['findByCpf']>(),
    list: vi.fn<PatientRepository['list']>(),
    save: vi.fn<PatientRepository['save']>(),
    softDelete: vi.fn<PatientRepository['softDelete']>()
  }
}
