import type { Patient } from '../../@common/entities/patient.entity'

export const PATIENT_REPOSITORY = 'PATIENT_REPOSITORY'

export interface CreatePatientData {
  name: string
  cpf: string
}

export interface ListPatientsFilter {
  name?: string
  page: number
  pageSize: number
}

export interface PatientPage {
  items: Patient[]
  total: number
}

export interface PatientRepository {
  create(data: CreatePatientData): Promise<Patient>
  findById(id: number): Promise<Patient | null>
  findByCpf(cpf: string): Promise<Patient | null>
  list(filter: ListPatientsFilter): Promise<PatientPage>
  save(patient: Patient): Promise<Patient>
  softDelete(id: number): Promise<void>
}
