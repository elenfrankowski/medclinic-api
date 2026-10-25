import { vi } from 'vitest'

import type { MedicalRecordRepository } from './repositories/medical-record.repository'
import type { MedicalRecord } from '../@common/entities/medical-record.entity'

export function buildMedicalRecord(
  overrides: Partial<MedicalRecord> = {}
): MedicalRecord {
  return {
    id: 5,
    patientId: 10,
    doctorId: 3,
    text: 'Paciente relata dor lombar há duas semanas. Solicitado raio-X.',
    createdAt: new Date('2026-10-13T11:25:00.000Z'),
    ...overrides
  }
}

export function buildMedicalRecordRepositoryFake() {
  return {
    create: vi.fn<MedicalRecordRepository['create']>(),
    listByPatient: vi.fn<MedicalRecordRepository['listByPatient']>()
  }
}
