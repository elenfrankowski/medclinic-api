import { Inject, Injectable, NotFoundException } from '@nestjs/common'

import { UsuarioRespostaDto } from '../auth/dtos/usuario-resposta.dto'
import type { UsuarioRepository } from '../auth/repositories/usuario.repository'

@Injectable()
export class UsersService {
  constructor(
    @Inject('USUARIO_REPOSITORY')
    private readonly usuarioRepository: UsuarioRepository
  ) {}

  async buscarPerfil(id: string): Promise<UsuarioRespostaDto> {
    const usuario = await this.usuarioRepository.buscarPorId(id)
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
