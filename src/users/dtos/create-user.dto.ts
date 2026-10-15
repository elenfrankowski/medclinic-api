import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength
} from 'class-validator'

import { RoleEnum } from '../../@common/enums/role.enum'

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string

  @IsEmail()
  email!: string

  @IsString()
  @MinLength(6)
  password!: string

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(RoleEnum, { each: true })
  roles!: RoleEnum[]
}
