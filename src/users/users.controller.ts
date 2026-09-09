import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  UseGuards
} from '@nestjs/common'

import {
  CurrentUser,
  type CurrentUserPayload
} from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import type { UsuarioRepository } from '../auth/repositories/usuario.repository'

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    @Inject('UsuarioRepository')
    private readonly usuarioRepository: UsuarioRepository
  ) {}

  @Get('me')
  async meuPerfil(@CurrentUser() usuarioAtual: CurrentUserPayload) {
    const usuario = await this.usuarioRepository.buscarPorId(
      usuarioAtual.userId
    )
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.')
    }

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      criadoEm: usuario.criadoEm
    }
  }
}
