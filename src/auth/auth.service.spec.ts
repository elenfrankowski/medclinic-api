import type { JwtService } from '@nestjs/jwt'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthService } from './auth.service'
import { RoleEnum } from '../@common/enums/role.enum'
import { comparePassword } from '../@common/utils/hash.util'
import { buildUser, buildUserRepositoryFake } from '../users/user.fixture'

vi.mock('../@common/utils/hash.util', () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn()
}))

describe('AuthService', () => {
  const repository = buildUserRepositoryFake()
  const jwtService = {
    signAsync: vi.fn<(payload: object) => Promise<string>>()
  }
  let service: AuthService

  beforeEach(() => {
    vi.resetAllMocks()
    service = new AuthService(repository, jwtService as unknown as JwtService)
  })

  it('recusa e-mail inexistente sem consultar o hash', async () => {
    repository.findByEmail.mockResolvedValue(null)

    await expect(
      service.login({ email: 'x@x.com', password: '123456' })
    ).rejects.toMatchObject({
      code: 'CREDENCIAIS_INVALIDAS'
    })
    expect(comparePassword).not.toHaveBeenCalled()
  })

  it('recusa senha incorreta com o mesmo código do e-mail inexistente', async () => {
    repository.findByEmail.mockResolvedValue(buildUser())
    vi.mocked(comparePassword).mockResolvedValue(false)

    await expect(
      service.login({ email: 'ana@medclinic.com', password: 'errada' })
    ).rejects.toMatchObject({
      code: 'CREDENCIAIS_INVALIDAS'
    })
  })

  it('compara a senha pelo hash e emite token com id e perfis', async () => {
    repository.findByEmail.mockResolvedValue(
      buildUser({ roles: [RoleEnum.ADMIN, RoleEnum.DOCTOR] })
    )
    vi.mocked(comparePassword).mockResolvedValue(true)
    jwtService.signAsync.mockResolvedValue('token-assinado')

    const result = await service.login({
      email: 'ana@medclinic.com',
      password: '123456'
    })

    expect(comparePassword).toHaveBeenCalledWith('123456', 'hash-da-senha')
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 1,
      roles: [RoleEnum.ADMIN, RoleEnum.DOCTOR]
    })
    expect(result).toEqual({ accessToken: 'token-assinado' })
  })
})
