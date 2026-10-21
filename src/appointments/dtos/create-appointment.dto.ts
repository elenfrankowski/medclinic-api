import { IsInt, IsString, Matches, Max, Min } from 'class-validator'

const MAX_INTEGER = 2147483647
const ISO_WITH_OFFSET =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/

export class CreateAppointmentDto {
  @IsInt()
  @Min(1)
  @Max(MAX_INTEGER)
  doctorId!: number

  @IsInt()
  @Min(1)
  @Max(MAX_INTEGER)
  patientId!: number

  @IsString()
  @Matches(ISO_WITH_OFFSET, {
    message: 'startsAt deve estar em ISO 8601 com fuso explícito.'
  })
  startsAt!: string
}
