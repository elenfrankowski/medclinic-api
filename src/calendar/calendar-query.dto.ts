import { IsNotEmpty, IsString } from 'class-validator'

export class CalendarQueryDto {
  @IsString()
  @IsNotEmpty()
  from!: string

  @IsString()
  @IsNotEmpty()
  to!: string
}
