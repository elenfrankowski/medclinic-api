import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { UsuarioRepository } from './usuario.repository'
import { Usuario } from '../../@common/entities/usuario.entity'
import { RoleEnum } from '../../@common/enums/role.enum'

@Injectable()
export class UsuarioTypeormRepository implements UsuarioRepository {
  constructor(
    @InjectRepository(Usuario) private readonly repository: Repository<Usuario>
  ) {}

  async criar(
    nome: string,
    email: string,
    senhaHash: string,
    role: RoleEnum
  ): Promise<Usuario> {
    const novoUsuario = this.repository.create({
      nome,
      email,
      senha: senhaHash,
      role
    })
    return this.repository.save(novoUsuario)
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.repository.findOneBy({ email })
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    return this.repository.findOneBy({ id })
  }
}
