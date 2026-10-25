import { Type } from 'class-transformer'
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min
} from 'class-validator'

import { AppointmentStatusEnum } from '../../@common/enums/appointment-status.enum'
import { PaginationQueryDto } from '../../@common/pagination/pagination-query.dto'

const MAX_INTEGER = 2147483647
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export class ListAppointmentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_INTEGER)
  doctorId?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_INTEGER)
  patientId?: number

  @IsOptional()
  @IsEnum(AppointmentStatusEnum)
  status?: AppointmentStatusEnum

  @IsOptional()
  @IsString()
  @Matches(DATE_PATTERN, { message: 'from deve estar no formato YYYY-MM-DD.' })
  from?: string

  @IsOptional()
  @IsString()
  @Matches(DATE_PATTERN, { message: 'to deve estar no formato YYYY-MM-DD.' })
  to?: string
}
