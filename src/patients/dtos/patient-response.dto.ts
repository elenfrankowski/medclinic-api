import type { Patient } from '../../@common/entities/patient.entity'

export interface PatientResponseDto {
  id: number
  name: string
  cpf: string
  createdAt: Date
}

export function toPatientResponse(patient: Patient): PatientResponseDto {
  return {
    id: patient.id,
    name: patient.name,
    cpf: patient.cpf,
    createdAt: patient.createdAt
  }
}
