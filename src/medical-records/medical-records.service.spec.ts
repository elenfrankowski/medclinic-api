import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildMedicalRecord,
  buildMedicalRecordRepositoryFake
} from './medical-record.fixture'
import { MedicalRecordsService } from './medical-records.service'
import { RoleEnum } from '../@common/enums/role.enum'
import { buildAppointmentRepositoryFake } from '../appointments/appointment.fixture'
import {
  buildDoctor,
  buildDoctorRepositoryFake
} from '../doctors/doctor.fixture'
import {
  buildPatient,
  buildPatientRepositoryFake
} from '../patients/patient.fixture'

describe('MedicalRecordsService', () => {
  const medicalRecordRepository = buildMedicalRecordRepositoryFake()
  const patientRepository = buildPatientRepositoryFake()
  const doctorRepository = buildDoctorRepositoryFake()
  const { repository: appointmentRepository, hasCareLink } =
    buildAppointmentRepositoryFake()
  let service: MedicalRecordsService

  const doctorActor = { userId: 7, roles: [RoleEnum.DOCTOR] }
  const adminActor = { userId: 1, roles: [RoleEnum.ADMIN] }
  const secretaryActor = { userId: 2, roles: [RoleEnum.SECRETARY] }
  const dto = {
    text: 'Paciente relata dor lombar há duas semanas. Solicitado raio-X.'
  }
  const pagination = { page: 1, pageSize: 20 }

  beforeEach(() => {
    vi.resetAllMocks()
    service = new MedicalRecordsService(
      medicalRecordRepository,
      patientRepository,
      doctorRepository,
      appointmentRepository
    )
    patientRepository.findById.mockResolvedValue(buildPatient({ id: 10 }))
    doctorRepository.findByUserId.mockResolvedValue(buildDoctor({ id: 3 }))
    hasCareLink.mockResolvedValue(true)
    medicalRecordRepository.create.mockResolvedValue(buildMedicalRecord())
    medicalRecordRepository.listByPatient.mockResolvedValue({
      items: [buildMedicalRecord()],
      total: 1
    })
  })

  describe('create', () => {
    it('médico com vínculo escreve, com o doctorId vindo do registro dele', async () => {
      const result = await service.create(10, dto, doctorActor)

      expect(doctorRepository.findByUserId).toHaveBeenCalledWith(7)
      expect(hasCareLink).toHaveBeenCalledWith(3, 10)
      expect(medicalRecordRepository.create).toHaveBeenCalledWith({
        patientId: 10,
        doctorId: 3,
        text: dto.text
      })
      expect(result).toEqual({
        id: 5,
        patientId: 10,
        doctorId: 3,
        text: dto.text,
        createdAt: '2026-10-13T11:25:00.000Z'
      })
    })

    it('médico sem vínculo recebe erro de acesso e nada é gravado', async () => {
      hasCareLink.mockResolvedValue(false)

      await expect(service.create(10, dto, doctorActor)).rejects.toMatchObject({
        code: 'ACESSO_NEGADO'
      })

      expect(medicalRecordRepository.create).not.toHaveBeenCalled()
    })

    it('usuário com perfil doctor mas sem registro de médico é recusado', async () => {
      doctorRepository.findByUserId.mockResolvedValue(null)

      await expect(service.create(10, dto, doctorActor)).rejects.toMatchObject({
        code: 'ACESSO_NEGADO'
      })

      expect(hasCareLink).not.toHaveBeenCalled()
      expect(medicalRecordRepository.create).not.toHaveBeenCalled()
    })

    it.each([
      ['admin', adminActor],
      ['secretary', secretaryActor]
    ])(
      '%s não escreve, sem consultar paciente nem vínculo',
      async (_label, actor) => {
        await expect(service.create(10, dto, actor)).rejects.toMatchObject({
          code: 'ACESSO_NEGADO'
        })

        expect(patientRepository.findById).not.toHaveBeenCalled()
        expect(hasCareLink).not.toHaveBeenCalled()
        expect(medicalRecordRepository.create).not.toHaveBeenCalled()
      }
    )

    it('falha quando o paciente não existe, sem checar o vínculo', async () => {
      patientRepository.findById.mockResolvedValue(null)

      await expect(service.create(99, dto, doctorActor)).rejects.toMatchObject({
        code: 'RECURSO_NAO_ENCONTRADO'
      })

      expect(hasCareLink).not.toHaveBeenCalled()
      expect(medicalRecordRepository.create).not.toHaveBeenCalled()
    })
  })

  describe('list', () => {
    it('médico com vínculo lê e recebe o envelope paginado', async () => {
      const result = await service.list(10, pagination, doctorActor)

      expect(hasCareLink).toHaveBeenCalledWith(3, 10)
      expect(medicalRecordRepository.listByPatient).toHaveBeenCalledWith({
        patientId: 10,
        page: 1,
        pageSize: 20
      })
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1
      })
      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toMatchObject({
        id: 5,
        patientId: 10,
        doctorId: 3
      })
    })

    it('médico sem vínculo recebe erro de acesso e nada é listado', async () => {
      hasCareLink.mockResolvedValue(false)

      await expect(
        service.list(10, pagination, doctorActor)
      ).rejects.toMatchObject({ code: 'ACESSO_NEGADO' })

      expect(medicalRecordRepository.listByPatient).not.toHaveBeenCalled()
    })

    it('usuário com perfil doctor mas sem registro de médico é recusado', async () => {
      doctorRepository.findByUserId.mockResolvedValue(null)

      await expect(
        service.list(10, pagination, doctorActor)
      ).rejects.toMatchObject({ code: 'ACESSO_NEGADO' })
    })

    it('admin lê para auditoria, sem exigir vínculo', async () => {
      const result = await service.list(10, pagination, adminActor)

      expect(doctorRepository.findByUserId).not.toHaveBeenCalled()
      expect(hasCareLink).not.toHaveBeenCalled()
      expect(result.data).toHaveLength(1)
    })

    it('quem acumula admin e doctor lê sem exigir vínculo', async () => {
      const actor = { userId: 1, roles: [RoleEnum.ADMIN, RoleEnum.DOCTOR] }

      await service.list(10, pagination, actor)

      expect(hasCareLink).not.toHaveBeenCalled()
    })

    it('secretary nunca lê, sem consultar paciente', async () => {
      await expect(
        service.list(10, pagination, secretaryActor)
      ).rejects.toMatchObject({
        code: 'ACESSO_NEGADO'
      })

      expect(patientRepository.findById).not.toHaveBeenCalled()
      expect(medicalRecordRepository.listByPatient).not.toHaveBeenCalled()
    })

    it('falha quando o paciente não existe', async () => {
      patientRepository.findById.mockResolvedValue(null)

      await expect(
        service.list(99, pagination, adminActor)
      ).rejects.toMatchObject({
        code: 'RECURSO_NAO_ENCONTRADO'
      })
    })

    it('calcula o total de páginas', async () => {
      medicalRecordRepository.listByPatient.mockResolvedValue({
        items: [buildMedicalRecord()],
        total: 45
      })

      const result = await service.list(
        10,
        { page: 2, pageSize: 20 },
        adminActor
      )

      expect(result.meta).toEqual({
        total: 45,
        page: 2,
        pageSize: 20,
        totalPages: 3
      })
    })
  })
})
