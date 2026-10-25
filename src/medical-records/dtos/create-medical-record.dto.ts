import { Transform } from 'class-transformer'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

import { trimString } from '../../@common/validation/trim.transform'

export class CreateMedicalRecordDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  text!: string
}
