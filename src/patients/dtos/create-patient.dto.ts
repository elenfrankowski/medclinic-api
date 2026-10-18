import { Transform } from 'class-transformer'
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator'

import { trimString } from '../../@common/validation/trim.transform'

export class CreatePatientDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string

  @IsString()
  @Matches(/^\d{11}$/, { message: 'O CPF deve ter 11 dígitos numéricos.' })
  cpf!: string
}
