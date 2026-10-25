import { Inject, Injectable } from '@nestjs/common'

import type { CreateMedicalRecordDto } from './dtos/create-medical-record.dto'
import {
  toMedicalRecordResponse,
  type MedicalRecordResponseDto
} from './dtos/medical-record-response.dto'
import {
  canReadMedicalRecord,
  canWriteMedicalRecord,
  isCareLinkRequiredToRead
} from './medical-record-access.rules'
import {
  MEDICAL_RECORD_REPOSITORY,
  type MedicalRecordRepository
} from './repositories/medical-record.repository'
import { DomainError } from '../@common/errors/domain-error'
import { buildPaginated, type Paginated } from '../@common/pagination/paginated'
import type { PaginationQueryDto } from '../@common/pagination/pagination-query.dto'
import {
  APPOINTMENT_REPOSITORY,
  type AppointmentRepository
} from '../appointments/repositories/appointment.repository'
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator'
import {
  DOCTOR_REPOSITORY,
  type DoctorRepository
} from '../doctors/repositories/doctor.repository'
import {
  PATIENT_REPOSITORY,
  type PatientRepository
} from '../patients/repositories/patient.repository'

@Injectable()
export class MedicalRecordsService {
  constructor(
    @Inject(MEDICAL_RECORD_REPOSITORY)
    private readonly medicalRecordRepository: MedicalRecordRepository,
    @Inject(PATIENT_REPOSITORY)
    private readonly patientRepository: PatientRepository,
    @Inject(DOCTOR_REPOSITORY)
    private readonly doctorRepository: DoctorRepository,
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointmentRepository: AppointmentRepository
  ) {}

  async create(
    patientId: number,
    dto: CreateMedicalRecordDto,
    actor: CurrentUserPayload
  ): Promise<MedicalRecordResponseDto> {
    if (!canWriteMedicalRecord(actor.roles)) {
      throw this.accessDenied()
    }
    await this.ensurePatientExists(patientId)
    const doctorId = await this.requireCareLink(actor.userId, patientId)

    const record = await this.medicalRecordRepository.create({
      patientId,
      doctorId,
      text: dto.text
    })
    return toMedicalRecordResponse(record)
  }

  async list(
    patientId: number,
    query: PaginationQueryDto,
    actor: CurrentUserPayload
  ): Promise<Paginated<MedicalRecordResponseDto>> {
    if (!canReadMedicalRecord(actor.roles)) {
      throw this.accessDenied()
    }
    await this.ensurePatientExists(patientId)
    if (isCareLinkRequiredToRead(actor.roles)) {
      await this.requireCareLink(actor.userId, patientId)
    }

    const { items, total } = await this.medicalRecordRepository.listByPatient({
      patientId,
      page: query.page,
      pageSize: query.pageSize
    })
    return buildPaginated(
      items.map(toMedicalRecordResponse),
      total,
      query.page,
      query.pageSize
    )
  }

  private async ensurePatientExists(patientId: number): Promise<void> {
    const patient = await this.patientRepository.findById(patientId)
    if (!patient) {
      throw new DomainError(
        'RECURSO_NAO_ENCONTRADO',
        'Paciente não encontrado.'
      )
    }
  }

  private async requireCareLink(
    userId: number,
    patientId: number
  ): Promise<number> {
    const doctor = await this.doctorRepository.findByUserId(userId)
    if (
      !doctor ||
      !(await this.appointmentRepository.hasCareLink(doctor.id, patientId))
    ) {
      throw this.accessDenied()
    }
    return doctor.id
  }

  private accessDenied(): DomainError {
    return new DomainError(
      'ACESSO_NEGADO',
      'Você não tem acesso ao prontuário deste paciente.'
    )
  }
}
