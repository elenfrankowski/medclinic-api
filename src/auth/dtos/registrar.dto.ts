import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength
} from 'class-validator'

import { RoleEnum } from '../../@common/enums/role.enum'

export class RegistrarDto {
  @IsString()
  @MinLength(2, { message: 'O nome deve ter pelo menos 2 caracteres.' })
  nome!: string

  @IsEmail({}, { message: 'Informe um e-mail em formato válido.' })
  email!: string

  @IsString()
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
  senha!: string

  @IsOptional()
  @IsEnum(RoleEnum, { message: 'O perfil informado é inválido.' })
  role?: RoleEnum
}
