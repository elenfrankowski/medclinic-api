import { Controller, Get, UseGuards } from '@nestjs/common'

import { UsersService } from './users.service'
import {
  CurrentUser,
  type CurrentUserPayload
} from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async meuPerfil(@CurrentUser() usuarioAtual: CurrentUserPayload) {
    return this.usersService.buscarPerfil(usuarioAtual.userId)
  }
}
