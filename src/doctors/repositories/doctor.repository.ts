import type { Doctor } from '../../@common/entities/doctor.entity'
import type { CreateUserData } from '../../users/repositories/user.repository'

export const DOCTOR_REPOSITORY = 'DOCTOR_REPOSITORY'

export interface ListDoctorsFilter {
  name?: string
  page: number
  pageSize: number
}

export interface DoctorPage {
  items: Doctor[]
  total: number
}

export interface DoctorRepository {
  createWithUser(userData: CreateUserData, crm: string): Promise<Doctor>
  findById(id: number): Promise<Doctor | null>
  findByCrm(crm: string): Promise<Doctor | null>
  findByUserId(userId: number): Promise<Doctor | null>
  list(filter: ListDoctorsFilter): Promise<DoctorPage>
}
