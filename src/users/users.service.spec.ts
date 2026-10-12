import { NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UsersService } from './users.service'
import type { Usuario } from '../@common/entities/usuario.entity'
import { RoleEnum } from '../@common/enums/role.enum'
import type { UsuarioRepository } from '../auth/repositories/usuario.repository'

describe('UsersService', () => {
  const repository = {
    criar: vi.fn<UsuarioRepository['criar']>(),
    buscarPorEmail: vi.fn<UsuarioRepository['buscarPorEmail']>(),
    buscarPorId: vi.fn<UsuarioRepository['buscarPorId']>()
  }
  let service: UsersService

  beforeEach(() => {
    vi.resetAllMocks()
    service = new UsersService(repository)
  })

  it('devolve o perfil do usuário sem a senha', async () => {
    const usuario: Usuario = {
      id: 'id-1',
      nome: 'Dra. Ana',
      email: 'ana@medclinic.com',
      senha: 'hash-da-senha',
      role: RoleEnum.ADMINISTRADOR,
      criadoEm: new Date('2026-10-01T10:00:00Z')
    }
    repository.buscarPorId.mockResolvedValue(usuario)

    const perfil = await service.buscarPerfil('id-1')

    expect(perfil).toMatchObject({ id: 'id-1', email: 'ana@medclinic.com' })
    expect(perfil).not.toHaveProperty('senha')
  })

  it('falha quando o usuário não existe', async () => {
    repository.buscarPorId.mockResolvedValue(null)

    await expect(service.buscarPerfil('inexistente')).rejects.toBeInstanceOf(
      NotFoundException
    )
  })
})
