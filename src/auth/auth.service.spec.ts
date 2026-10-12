import { ConflictException, UnauthorizedException } from '@nestjs/common'
import type { JwtService } from '@nestjs/jwt'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthService } from './auth.service'
import type { UsuarioRepository } from './repositories/usuario.repository'
import type { Usuario } from '../@common/entities/usuario.entity'
import { RoleEnum } from '../@common/enums/role.enum'
import { compararHash, gerarHash } from '../@common/utils/hash.util'

vi.mock('../@common/utils/hash.util', () => ({
  gerarHash: vi.fn(),
  compararHash: vi.fn()
}))

function criarUsuario(sobrescritas: Partial<Usuario> = {}): Usuario {
  return {
    id: 'id-1',
    nome: 'Dra. Ana',
    email: 'ana@medclinic.com',
    senha: 'hash-da-senha',
    role: RoleEnum.ADMINISTRADOR,
    criadoEm: new Date('2026-10-01T10:00:00Z'),
    ...sobrescritas
  }
}

describe('AuthService', () => {
  const repository = {
    criar: vi.fn<UsuarioRepository['criar']>(),
    buscarPorEmail: vi.fn<UsuarioRepository['buscarPorEmail']>(),
    buscarPorId: vi.fn<UsuarioRepository['buscarPorId']>()
  }
  const jwtService = {
    signAsync: vi.fn<(payload: object) => Promise<string>>()
  }
  let service: AuthService

  beforeEach(() => {
    vi.resetAllMocks()
    service = new AuthService(repository, jwtService as unknown as JwtService)
  })

  describe('login', () => {
    it('recusa e-mail inexistente sem consultar o hash', async () => {
      repository.buscarPorEmail.mockResolvedValue(null)

      await expect(
        service.login({ email: 'x@x.com', senha: '123456' })
      ).rejects.toBeInstanceOf(UnauthorizedException)
      expect(compararHash).not.toHaveBeenCalled()
    })

    it('recusa senha incorreta com a mesma mensagem do e-mail inexistente', async () => {
      repository.buscarPorEmail.mockResolvedValue(criarUsuario())
      vi.mocked(compararHash).mockResolvedValue(false)

      await expect(
        service.login({ email: 'ana@medclinic.com', senha: 'errada' })
      ).rejects.toThrow('Credenciais inválidas.')
    })

    it('compara a senha pelo hash e emite token com id e perfil', async () => {
      repository.buscarPorEmail.mockResolvedValue(criarUsuario())
      vi.mocked(compararHash).mockResolvedValue(true)
      jwtService.signAsync.mockResolvedValue('token-assinado')

      const resultado = await service.login({
        email: 'ana@medclinic.com',
        senha: '123456'
      })

      expect(compararHash).toHaveBeenCalledWith('123456', 'hash-da-senha')
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'id-1',
        role: RoleEnum.ADMINISTRADOR
      })
      expect(resultado).toEqual({ accessToken: 'token-assinado' })
    })
  })

  describe('registrar', () => {
    it('recusa e-mail já cadastrado', async () => {
      repository.buscarPorEmail.mockResolvedValue(criarUsuario())

      await expect(
        service.registrar({
          nome: 'Beto',
          email: 'ana@medclinic.com',
          senha: '123456'
        })
      ).rejects.toBeInstanceOf(ConflictException)
      expect(repository.criar).not.toHaveBeenCalled()
    })

    it('grava o hash, usa o perfil padrão e nunca devolve a senha', async () => {
      repository.buscarPorEmail.mockResolvedValue(null)
      vi.mocked(gerarHash).mockResolvedValue('hash-gerado')
      repository.criar.mockImplementation((nome, email, senhaHash, role) =>
        Promise.resolve(criarUsuario({ nome, email, senha: senhaHash, role }))
      )

      const resultado = await service.registrar({
        nome: 'Beto',
        email: 'beto@medclinic.com',
        senha: '123456'
      })

      expect(repository.criar).toHaveBeenCalledWith(
        'Beto',
        'beto@medclinic.com',
        'hash-gerado',
        RoleEnum.ATENDENTE
      )
      expect(resultado).not.toHaveProperty('senha')
    })

    it('respeita o perfil informado', async () => {
      repository.buscarPorEmail.mockResolvedValue(null)
      vi.mocked(gerarHash).mockResolvedValue('hash-gerado')
      repository.criar.mockImplementation((nome, email, senhaHash, role) =>
        Promise.resolve(criarUsuario({ nome, email, senha: senhaHash, role }))
      )

      const resultado = await service.registrar({
        nome: 'Ana',
        email: 'ana2@medclinic.com',
        senha: '123456',
        role: RoleEnum.ADMINISTRADOR
      })

      expect(resultado.role).toBe(RoleEnum.ADMINISTRADOR)
    })
  })
})
