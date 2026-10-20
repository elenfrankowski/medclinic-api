import { Inject, Injectable } from '@nestjs/common'

import type { ReplaceWorkScheduleDto } from './dtos/replace-work-schedule.dto'
import {
  toWorkScheduleResponse,
  type WorkScheduleResponseDto
} from './dtos/work-schedule-response.dto'
import {
  WORK_SCHEDULE_REPOSITORY,
  type WorkScheduleRepository
} from './repositories/work-schedule.repository'
import {
  hasInvalidTimeRange,
  hasOverlappingShifts
} from './work-schedule.rules'
import { DomainError } from '../@common/errors/domain-error'
import {
  DOCTOR_REPOSITORY,
  type DoctorRepository
} from '../doctors/repositories/doctor.repository'

@Injectable()
export class WorkScheduleService {
  constructor(
    @Inject(WORK_SCHEDULE_REPOSITORY)
    private readonly workScheduleRepository: WorkScheduleRepository,
    @Inject(DOCTOR_REPOSITORY)
    private readonly doctorRepository: DoctorRepository
  ) {}

  async replace(
    doctorId: number,
    dto: ReplaceWorkScheduleDto
  ): Promise<WorkScheduleResponseDto> {
    if (hasInvalidTimeRange(dto.shifts)) {
      throw new DomainError(
        'DADOS_INVALIDOS',
        'O horário de início deve ser anterior ao de término.'
      )
    }
    if (hasOverlappingShifts(dto.shifts)) {
      throw new DomainError(
        'DADOS_INVALIDOS',
        'Existem turnos sobrepostos no mesmo dia da semana.'
      )
    }

    await this.ensureDoctorExists(doctorId)
    const shifts = await this.workScheduleRepository.replaceShifts(
      doctorId,
      dto.shifts
    )
    return toWorkScheduleResponse(shifts)
  }

  async get(doctorId: number): Promise<WorkScheduleResponseDto> {
    await this.ensureDoctorExists(doctorId)
    const shifts =
      await this.workScheduleRepository.findShiftsByDoctor(doctorId)
    return toWorkScheduleResponse(shifts)
  }

  private async ensureDoctorExists(doctorId: number): Promise<void> {
    const doctor = await this.doctorRepository.findById(doctorId)
    if (!doctor) {
      throw new DomainError('RECURSO_NAO_ENCONTRADO', 'Médico não encontrado.')
    }
  }
}
