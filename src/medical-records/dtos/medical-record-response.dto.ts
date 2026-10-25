import type { MedicalRecord } from '../../@common/entities/medical-record.entity'

export interface MedicalRecordResponseDto {
  id: number
  patientId: number
  doctorId: number
  text: string
  createdAt: string
}

export function toMedicalRecordResponse(
  record: MedicalRecord
): MedicalRecordResponseDto {
  return {
    id: record.id,
    patientId: record.patientId,
    doctorId: record.doctorId,
    text: record.text,
    createdAt: record.createdAt.toISOString()
  }
}
