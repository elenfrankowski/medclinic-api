import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested
} from 'class-validator'

import { TIME_PATTERN } from '../work-schedule.rules'

export class ShiftDto {
  @IsInt()
  @Min(0)
  @Max(6)
  weekDay!: number

  @IsString()
  @Matches(TIME_PATTERN, {
    message: 'O horário de início deve estar no formato HH:MM.'
  })
  startTime!: string

  @IsString()
  @Matches(TIME_PATTERN, {
    message: 'O horário de término deve estar no formato HH:MM.'
  })
  endTime!: string

  @IsInt()
  @Min(1)
  @Max(1440)
  slotDurationMinutes!: number
}

export class ReplaceWorkScheduleDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ShiftDto)
  shifts!: ShiftDto[]
}
