import { IsEnum } from 'class-validator'

import { AppointmentStatusEnum } from '../../@common/enums/appointment-status.enum'

export class UpdateAppointmentStatusDto {
  @IsEnum(AppointmentStatusEnum)
  status!: AppointmentStatusEnum
}
