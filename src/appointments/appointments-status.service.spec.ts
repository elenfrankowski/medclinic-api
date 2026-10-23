import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildAppointment,
  buildAppointmentRepositoryFake
} from './appointment.fixture'
import { AppointmentsService } from './appointments.service'
import { AppointmentStatusEnum } from '../@common/enums/appointment-status.enum'
import { RoleEnum } from '../@common/enums/role.enum'
import {
  buildDoctor,
  buildDoctorRepositoryFake
} from '../doctors/doctor.fixture'
import { buildPatientRepositoryFake } from '../patients/patient.fixture'
import { buildWorkScheduleRepositoryFake } from '../work-schedule/work-schedule.fixture'

const { SCHEDULED, IN_PROGRESS, DONE, CANCELLED } = AppointmentStatusEnum

describe('AppointmentsService: consulta por id e mudança de status', () => {
  const doctorRepository = buildDoctorRepositoryFake()
  const patientRepository = buildPatientRepositoryFake()
  const workScheduleRepository = buildWorkScheduleRepositoryFake()
  const {
    repository: appointmentRepository,
    findById,
    transitionStatus
  } = buildAppointmentRepositoryFake()
  let service: AppointmentsService

  const admin = { userId: 1, roles: [RoleEnum.ADMIN] }
  const secretary = { userId: 2, roles: [RoleEnum.SECRETARY] }
  const ownDoctor = { userId: 7, roles: [RoleEnum.DOCTOR] }
  const otherDoctor = { userId: 8, roles: [RoleEnum.DOCTOR] }
  const doctorIdByUserId = new Map([
    [7, 3],
    [8, 4]
  ])

  function appointmentIn(status: AppointmentStatusEnum) {
    return buildAppointment({ status })
  }

  beforeEach(() => {
    vi.resetAllMocks()
    service = new AppointmentsService(
      appointmentRepository,
      doctorRepository,
      patientRepository,
      workScheduleRepository
    )
    // a consulta de teste pertence ao médico 3, que é o usuário 7
    doctorRepository.findByUserId.mockImplementation((userId) => {
      const doctorId = doctorIdByUserId.get(userId)
      return Promise.resolve(
        doctorId === undefined ? null : buildDoctor({ id: doctorId })
      )
    })
    transitionStatus.mockImplementation((id, _from, to) =>
      Promise.resolve(buildAppointment({ id, status: to }))
    )
  })

  describe('getById', () => {
    it('admin consulta qualquer consulta sem buscar vínculo de médico', async () => {
      findById.mockResolvedValue(appointmentIn(SCHEDULED))

      await expect(service.getById(41, admin)).resolves.toMatchObject({
        id: 41,
        doctorId: 3
      })
      expect(doctorRepository.findByUserId).not.toHaveBeenCalled()
    })

    it('secretary consulta qualquer consulta', async () => {
      findById.mockResolvedValue(appointmentIn(SCHEDULED))

      await expect(service.getById(41, secretary)).resolves.toMatchObject({
        id: 41
      })
    })

    it('o médico da consulta consulta a própria consulta', async () => {
      findById.mockResolvedValue(appointmentIn(SCHEDULED))

      await expect(service.getById(41, ownDoctor)).resolves.toMatchObject({
        id: 41
      })
    })

    it('recusa médico que não é o da consulta', async () => {
      findById.mockResolvedValue(appointmentIn(SCHEDULED))

      await expect(service.getById(41, otherDoctor)).rejects.toMatchObject({
        code: 'ACESSO_NEGADO'
      })
    })

    it('recusa usuário doctor sem registro de médico', async () => {
      findById.mockResolvedValue(appointmentIn(SCHEDULED))

      await expect(
        service.getById(41, { userId: 99, roles: [RoleEnum.DOCTOR] })
      ).rejects.toMatchObject({
        code: 'ACESSO_NEGADO'
      })
    })

    it('falha quando a consulta não existe', async () => {
      findById.mockResolvedValue(null)

      await expect(service.getById(99, admin)).rejects.toMatchObject({
        code: 'RECURSO_NAO_ENCONTRADO'
      })
    })
  })

  describe('updateStatus', () => {
    it.each<[AppointmentStatusEnum, AppointmentStatusEnum]>([
      [SCHEDULED, IN_PROGRESS],
      [SCHEDULED, CANCELLED],
      [IN_PROGRESS, DONE],
      [IN_PROGRESS, CANCELLED]
    ])('admin realiza %s -> %s', async (from, to) => {
      findById.mockResolvedValue(appointmentIn(from))

      const result = await service.updateStatus(41, to, admin)

      expect(transitionStatus).toHaveBeenCalledWith(41, from, to)
      expect(result.status).toBe(to)
    })

    it('o médico da consulta inicia o atendimento', async () => {
      findById.mockResolvedValue(appointmentIn(SCHEDULED))

      const result = await service.updateStatus(41, IN_PROGRESS, ownDoctor)

      expect(result.status).toBe(IN_PROGRESS)
    })

    it('secretary cancela consulta agendada', async () => {
      findById.mockResolvedValue(appointmentIn(SCHEDULED))

      const result = await service.updateStatus(41, CANCELLED, secretary)

      expect(transitionStatus).toHaveBeenCalledWith(41, SCHEDULED, CANCELLED)
      expect(result.status).toBe(CANCELLED)
    })

    it('falha quando a consulta não existe, sem alterar nada', async () => {
      findById.mockResolvedValue(null)

      await expect(
        service.updateStatus(99, CANCELLED, admin)
      ).rejects.toMatchObject({
        code: 'RECURSO_NAO_ENCONTRADO'
      })
      expect(transitionStatus).not.toHaveBeenCalled()
    })

    it('recusa transição fora do ciclo de vida, mesmo para admin', async () => {
      findById.mockResolvedValue(appointmentIn(DONE))

      await expect(
        service.updateStatus(41, CANCELLED, admin)
      ).rejects.toMatchObject({
        code: 'TRANSICAO_INVALIDA'
      })
      expect(transitionStatus).not.toHaveBeenCalled()
    })

    it('transição impossível dá 422 e não 403, mesmo para quem não teria autoridade', async () => {
      findById.mockResolvedValue(appointmentIn(SCHEDULED))

      await expect(
        service.updateStatus(41, DONE, secretary)
      ).rejects.toMatchObject({
        code: 'TRANSICAO_INVALIDA'
      })
    })

    it('recusa transição prevista quando o perfil não tem autoridade', async () => {
      findById.mockResolvedValue(appointmentIn(SCHEDULED))

      await expect(
        service.updateStatus(41, IN_PROGRESS, secretary)
      ).rejects.toMatchObject({
        code: 'ACESSO_NEGADO'
      })
      expect(transitionStatus).not.toHaveBeenCalled()
    })

    it('recusa médico que não é o da consulta', async () => {
      findById.mockResolvedValue(appointmentIn(SCHEDULED))

      await expect(
        service.updateStatus(41, IN_PROGRESS, otherDoctor)
      ).rejects.toMatchObject({
        code: 'ACESSO_NEGADO'
      })
      expect(transitionStatus).not.toHaveBeenCalled()
    })

    it('recusa quando o status mudou durante a operação', async () => {
      findById.mockResolvedValue(appointmentIn(IN_PROGRESS))
      transitionStatus.mockResolvedValue(null)

      await expect(service.updateStatus(41, DONE, admin)).rejects.toMatchObject(
        {
          code: 'TRANSICAO_INVALIDA'
        }
      )
    })
  })
})
