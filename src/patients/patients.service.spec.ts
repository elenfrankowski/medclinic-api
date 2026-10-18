import { beforeEach, describe, expect, it, vi } from 'vitest'

import { buildPatient, buildPatientRepositoryFake } from './patient.fixture'
import { PatientsService } from './patients.service'

describe('PatientsService', () => {
  const repository = buildPatientRepositoryFake()
  let service: PatientsService

  beforeEach(() => {
    vi.resetAllMocks()
    service = new PatientsService(repository)
  })

  describe('create', () => {
    it('recusa CPF já cadastrado sem gravar', async () => {
      repository.findByCpf.mockResolvedValue(buildPatient())

      await expect(
        service.create({ name: 'Outro', cpf: '12345678901' })
      ).rejects.toMatchObject({
        code: 'CPF_JA_CADASTRADO'
      })
      expect(repository.create).not.toHaveBeenCalled()
    })

    it('grava e devolve o paciente cadastrado', async () => {
      repository.findByCpf.mockResolvedValue(null)
      repository.create.mockImplementation((data) =>
        Promise.resolve(buildPatient(data))
      )

      const result = await service.create({
        name: 'Carlos Pereira',
        cpf: '12345678901'
      })

      expect(repository.create).toHaveBeenCalledWith({
        name: 'Carlos Pereira',
        cpf: '12345678901'
      })
      expect(result).toMatchObject({
        id: 1,
        name: 'Carlos Pereira',
        cpf: '12345678901'
      })
    })
  })

  describe('list', () => {
    it('devolve a página com os metadados de paginação', async () => {
      repository.list.mockResolvedValue({
        items: [buildPatient(), buildPatient({ id: 2, name: 'Maria Souza' })],
        total: 57
      })

      const result = await service.list({ name: 'a', page: 1, pageSize: 20 })

      expect(repository.list).toHaveBeenCalledWith({
        name: 'a',
        page: 1,
        pageSize: 20
      })
      expect(result.meta).toEqual({
        total: 57,
        page: 1,
        pageSize: 20,
        totalPages: 3
      })
      expect(result.data).toHaveLength(2)
    })
  })

  describe('getById', () => {
    it('devolve o paciente encontrado', async () => {
      repository.findById.mockResolvedValue(buildPatient())

      await expect(service.getById(1)).resolves.toMatchObject({ id: 1 })
    })

    it('falha quando o paciente não existe', async () => {
      repository.findById.mockResolvedValue(null)

      await expect(service.getById(99)).rejects.toMatchObject({
        code: 'RECURSO_NAO_ENCONTRADO'
      })
    })
  })

  describe('update', () => {
    it('altera o nome informado', async () => {
      repository.findById.mockResolvedValue(buildPatient())
      repository.save.mockImplementation((patient) => Promise.resolve(patient))

      const result = await service.update(1, { name: 'Carlos P. Silva' })

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, name: 'Carlos P. Silva' })
      )
      expect(result.name).toBe('Carlos P. Silva')
    })

    it('mantém os dados quando o corpo não traz campos', async () => {
      repository.findById.mockResolvedValue(buildPatient())
      repository.save.mockImplementation((patient) => Promise.resolve(patient))

      const result = await service.update(1, {})

      expect(result.name).toBe('Carlos Pereira')
    })

    it('falha quando o paciente não existe, sem gravar', async () => {
      repository.findById.mockResolvedValue(null)

      await expect(service.update(99, { name: 'X' })).rejects.toMatchObject({
        code: 'RECURSO_NAO_ENCONTRADO'
      })
      expect(repository.save).not.toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('remove logicamente o paciente existente', async () => {
      repository.findById.mockResolvedValue(buildPatient())

      await service.remove(1)

      expect(repository.softDelete).toHaveBeenCalledWith(1)
    })

    it('falha quando o paciente não existe, sem remover', async () => {
      repository.findById.mockResolvedValue(null)

      await expect(service.remove(99)).rejects.toMatchObject({
        code: 'RECURSO_NAO_ENCONTRADO'
      })
      expect(repository.softDelete).not.toHaveBeenCalled()
    })
  })
})
