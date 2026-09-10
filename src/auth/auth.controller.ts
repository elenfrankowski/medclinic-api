import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'

import { AuthService } from './auth.service'
import { LoginDto } from './dtos/login.dto'
import { RegistrarDto } from './dtos/registrar.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async registrar(@Body() dto: RegistrarDto) {
    return this.authService.registrar(dto)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }
}
