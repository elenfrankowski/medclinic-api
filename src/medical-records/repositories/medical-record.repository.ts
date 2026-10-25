import type { MedicalRecord } from '../../@common/entities/medical-record.entity'

export const MEDICAL_RECORD_REPOSITORY = 'MEDICAL_RECORD_REPOSITORY'

export interface NewMedicalRecordData {
  patientId: number
  doctorId: number
  text: string
}

export interface ListMedicalRecordsFilter {
  patientId: number
  page: number
  pageSize: number
}

export interface MedicalRecordPage {
  items: MedicalRecord[]
  total: number
}

export interface MedicalRecordRepository {
  create(data: NewMedicalRecordData): Promise<MedicalRecord>
  listByPatient(filter: ListMedicalRecordsFilter): Promise<MedicalRecordPage>
}
