import { Transform } from 'class-transformer'
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength
} from 'class-validator'

import { trimString } from '../../@common/validation/trim.transform'

export class CreateDoctorDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string

  @IsEmail()
  email!: string

  @IsString()
  @MinLength(6)
  password!: string

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  crm!: string
}
