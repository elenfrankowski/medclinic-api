import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { LoginDto } from './dtos/login.dto'
import { RegistrarDto } from './dtos/registrar.dto'
import { UsuarioRespostaDto } from './dtos/usuario-resposta.dto'
import type { UsuarioRepository } from './repositories/usuario.repository'
import { RoleEnum } from '../@common/enums/role.enum'
import { compararHash, gerarHash } from '../@common/utils/hash.util'

@Injectable()
export class AuthService {
  constructor(
    @Inject('USUARIO_REPOSITORY')
    private readonly usuarioRepository: UsuarioRepository,
    private readonly jwtService: JwtService
  ) {}

  async registrar(dto: RegistrarDto): Promise<UsuarioRespostaDto> {
    const usuarioExistente = await this.usuarioRepository.buscarPorEmail(
      dto.email
    )
    if (usuarioExistente) {
      throw new ConflictException(
        'Já existe um usuário cadastrado com esse e-mail.'
      )
    }

    const senhaHash = await gerarHash(dto.senha)
    const role = dto.role ?? RoleEnum.ATENDENTE
    const usuario = await this.usuarioRepository.criar(
      dto.nome,
      dto.email,
      senhaHash,
      role
    )

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      criadoEm: usuario.criadoEm
    }
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const usuario = await this.usuarioRepository.buscarPorEmail(dto.email)
    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas.')
    }

    const senhaConfere = await compararHash(dto.senha, usuario.senha)
    if (!senhaConfere) {
      throw new UnauthorizedException('Credenciais inválidas.')
    }

    const payload = { sub: usuario.id, role: usuario.role }
    const accessToken = await this.jwtService.signAsync(payload)
    return { accessToken }
  }
}
