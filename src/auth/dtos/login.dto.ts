import { IsEmail, IsString } from 'class-validator'

export class LoginDto {
  @IsEmail({}, { message: 'Informe um e-mail em formato válido.' })
  email!: string

  @IsString()
  senha!: string
}
