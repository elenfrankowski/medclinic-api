import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildDoctor, buildDoctorRepositoryFake } from './doctor.fixture'
import { DoctorsService } from './doctors.service'
import { RoleEnum } from '../@common/enums/role.enum'
import { hashPassword } from '../@common/utils/hash.util'
import { buildUser, buildUserRepositoryFake } from '../users/user.fixture'

vi.mock('../@common/utils/hash.util', () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn()
}))

describe('DoctorsService', () => {
  const doctorRepository = buildDoctorRepositoryFake()
  const userRepository = buildUserRepositoryFake()
  let service: DoctorsService

  beforeEach(() => {
    vi.resetAllMocks()
    service = new DoctorsService(doctorRepository, userRepository)
  })

  describe('create', () => {
    const dto = {
      name: 'Dra. Helena Souza',
      email: 'helena@medclinic.com',
      password: 'SenhaForte@123',
      crm: 'CRM-SC-54321'
    }

    it('recusa e-mail já cadastrado sem gerar hash nem gravar', async () => {
      userRepository.findByEmail.mockResolvedValue(buildUser())

      await expect(service.create(dto)).rejects.toMatchObject({
        code: 'EMAIL_JA_CADASTRADO'
      })
      expect(hashPassword).not.toHaveBeenCalled()
      expect(doctorRepository.createWithUser).not.toHaveBeenCalled()
    })

    it('recusa CRM já cadastrado sem gerar hash nem gravar', async () => {
      userRepository.findByEmail.mockResolvedValue(null)
      doctorRepository.findByCrm.mockResolvedValue(buildDoctor())

      await expect(service.create(dto)).rejects.toMatchObject({
        code: 'CRM_JA_CADASTRADO'
      })
      expect(hashPassword).not.toHaveBeenCalled()
      expect(doctorRepository.createWithUser).not.toHaveBeenCalled()
    })

    it('cria o usuário com perfil doctor e senha em hash numa única chamada', async () => {
      userRepository.findByEmail.mockResolvedValue(null)
      doctorRepository.findByCrm.mockResolvedValue(null)
      vi.mocked(hashPassword).mockResolvedValue('hash-gerado')
      doctorRepository.createWithUser.mockResolvedValue(buildDoctor())

      const result = await service.create(dto)

      expect(hashPassword).toHaveBeenCalledWith('SenhaForte@123')
      expect(doctorRepository.createWithUser).toHaveBeenCalledWith(
        {
          name: 'Dra. Helena Souza',
          email: 'helena@medclinic.com',
          password: 'hash-gerado',
          roles: [RoleEnum.DOCTOR]
        },
        'CRM-SC-54321'
      )
      expect(result).toEqual({
        id: 3,
        crm: 'CRM-SC-54321',
        user: {
          id: 7,
          name: 'Dra. Helena Souza',
          email: 'helena@medclinic.com',
          roles: [RoleEnum.DOCTOR]
        }
      })
      expect(result.user).not.toHaveProperty('password')
    })
  })

  describe('list', () => {
    it('devolve a página com os metadados de paginação', async () => {
      doctorRepository.list.mockResolvedValue({
        items: [buildDoctor()],
        total: 21
      })

      const result = await service.list({ name: 'hel', page: 2, pageSize: 10 })

      expect(doctorRepository.list).toHaveBeenCalledWith({
        name: 'hel',
        page: 2,
        pageSize: 10
      })
      expect(result.meta).toEqual({
        total: 21,
        page: 2,
        pageSize: 10,
        totalPages: 3
      })
      expect(result.data).toHaveLength(1)
    })
  })

  describe('getById', () => {
    it('devolve o médico encontrado', async () => {
      doctorRepository.findById.mockResolvedValue(buildDoctor())

      await expect(service.getById(3)).resolves.toMatchObject({
        id: 3,
        crm: 'CRM-SC-54321'
      })
    })

    it('falha quando o médico não existe', async () => {
      doctorRepository.findById.mockResolvedValue(null)

      await expect(service.getById(99)).rejects.toMatchObject({
        code: 'RECURSO_NAO_ENCONTRADO'
      })
    })
  })
})
