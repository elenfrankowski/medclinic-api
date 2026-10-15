import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildUser, buildUserRepositoryFake } from './user.fixture'
import { UsersService } from './users.service'
import { RoleEnum } from '../@common/enums/role.enum'
import { hashPassword } from '../@common/utils/hash.util'

vi.mock('../@common/utils/hash.util', () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn()
}))

describe('UsersService', () => {
  const repository = buildUserRepositoryFake()
  let service: UsersService

  beforeEach(() => {
    vi.resetAllMocks()
    service = new UsersService(repository)
  })

  describe('create', () => {
    const dto = {
      name: 'Joana',
      email: 'joana@medclinic.com',
      password: 'SenhaForte@123',
      roles: [RoleEnum.SECRETARY]
    }

    it('recusa e-mail já cadastrado sem gravar', async () => {
      repository.findByEmail.mockResolvedValue(buildUser())

      await expect(service.create(dto)).rejects.toMatchObject({
        code: 'EMAIL_JA_CADASTRADO'
      })
      expect(repository.create).not.toHaveBeenCalled()
    })

    it('grava o hash da senha e devolve o usuário sem a senha', async () => {
      repository.findByEmail.mockResolvedValue(null)
      vi.mocked(hashPassword).mockResolvedValue('hash-gerado')
      repository.create.mockImplementation((data) =>
        Promise.resolve(buildUser({ id: 2, ...data }))
      )

      const result = await service.create(dto)

      expect(hashPassword).toHaveBeenCalledWith('SenhaForte@123')
      expect(repository.create).toHaveBeenCalledWith({
        name: 'Joana',
        email: 'joana@medclinic.com',
        password: 'hash-gerado',
        roles: [RoleEnum.SECRETARY]
      })
      expect(result).toEqual({
        id: 2,
        name: 'Joana',
        email: 'joana@medclinic.com',
        roles: [RoleEnum.SECRETARY]
      })
    })
  })

  describe('getProfile', () => {
    it('devolve o perfil sem a senha', async () => {
      repository.findById.mockResolvedValue(buildUser())

      const profile = await service.getProfile(1)

      expect(profile).toEqual({
        id: 1,
        name: 'Dra. Ana',
        email: 'ana@medclinic.com',
        roles: [RoleEnum.ADMIN]
      })
    })

    it('falha quando o usuário não existe', async () => {
      repository.findById.mockResolvedValue(null)

      await expect(service.getProfile(99)).rejects.toMatchObject({
        code: 'RECURSO_NAO_ENCONTRADO'
      })
    })
  })
})
