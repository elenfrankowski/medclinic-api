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

describe('AppointmentsService.list', () => {
  const { repository: appointmentRepository, list } =
    buildAppointmentRepositoryFake()
  const doctorRepository = buildDoctorRepositoryFake()
  const patientRepository = buildPatientRepositoryFake()
  const workScheduleRepository = buildWorkScheduleRepositoryFake()
  let service: AppointmentsService

  const adminActor = { userId: 1, roles: [RoleEnum.ADMIN] }
  const secretaryActor = { userId: 2, roles: [RoleEnum.SECRETARY] }
  const doctorActor = { userId: 7, roles: [RoleEnum.DOCTOR] }
  const pagination = { page: 1, pageSize: 20 }

  beforeEach(() => {
    vi.resetAllMocks()
    service = new AppointmentsService(
      appointmentRepository,
      doctorRepository,
      patientRepository,
      workScheduleRepository
    )
    doctorRepository.findByUserId.mockResolvedValue(buildDoctor({ id: 3 }))
    list.mockResolvedValue({ items: [buildAppointment()], total: 1 })
  })

  it('admin lista sem filtros e recebe o envelope paginado', async () => {
    const result = await service.list(pagination, adminActor)

    expect(list).toHaveBeenCalledWith({
      doctorId: undefined,
      patientId: undefined,
      status: undefined,
      start: undefined,
      endExclusive: undefined,
      page: 1,
      pageSize: 20
    })
    expect(result.meta).toEqual({
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1
    })
    expect(result.data).toEqual([
      {
        id: 41,
        doctorId: 3,
        patientId: 10,
        startsAt: '2026-10-27T11:00:00.000Z',
        endsAt: '2026-10-27T11:30:00.000Z',
        status: 'scheduled'
      }
    ])
  })

  it('repassa todos os filtros combinados, com o período em dias inteiros da clínica', async () => {
    await service.list(
      {
        doctorId: 3,
        patientId: 10,
        status: AppointmentStatusEnum.SCHEDULED,
        from: '2026-10-27',
        to: '2026-10-28',
        page: 2,
        pageSize: 10
      },
      adminActor
    )

    expect(list).toHaveBeenCalledWith({
      doctorId: 3,
      patientId: 10,
      status: AppointmentStatusEnum.SCHEDULED,
      start: new Date('2026-10-27T03:00:00.000Z'),
      endExclusive: new Date('2026-10-29T03:00:00.000Z'),
      page: 2,
      pageSize: 10
    })
  })

  it('secretary lista todas e respeita o filtro por médico, sem consultar o médico do token', async () => {
    await service.list({ ...pagination, doctorId: 99 }, secretaryActor)

    expect(doctorRepository.findByUserId).not.toHaveBeenCalled()
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ doctorId: 99 }))
  })

  it('médico enxerga só as próprias, usando o id do registro dele', async () => {
    await service.list(pagination, doctorActor)

    expect(doctorRepository.findByUserId).toHaveBeenCalledWith(7)
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ doctorId: 3 }))
  })

  it('médico que envia o doctorId de outro médico continua vendo só as próprias', async () => {
    await service.list({ ...pagination, doctorId: 99 }, doctorActor)

    expect(list).toHaveBeenCalledWith(expect.objectContaining({ doctorId: 3 }))
    expect(list).not.toHaveBeenCalledWith(
      expect.objectContaining({ doctorId: 99 })
    )
  })

  it('médico mantém os demais filtros', async () => {
    await service.list(
      { ...pagination, patientId: 10, status: AppointmentStatusEnum.DONE },
      doctorActor
    )

    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({
        doctorId: 3,
        patientId: 10,
        status: AppointmentStatusEnum.DONE
      })
    )
  })

  it('usuário com perfil doctor mas sem registro de médico recebe lista vazia, sem consultar o banco', async () => {
    doctorRepository.findByUserId.mockResolvedValue(null)

    const result = await service.list(pagination, doctorActor)

    expect(result).toEqual({
      data: [],
      meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 }
    })
    expect(list).not.toHaveBeenCalled()
  })

  it('quem acumula admin e doctor não é restringido', async () => {
    const actor = { userId: 1, roles: [RoleEnum.ADMIN, RoleEnum.DOCTOR] }

    await service.list({ ...pagination, doctorId: 99 }, actor)

    expect(doctorRepository.findByUserId).not.toHaveBeenCalled()
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ doctorId: 99 }))
  })

  it.each<[string, string | undefined, string | undefined]>([
    ['formato inválido', '27-10-2026', undefined],
    ['data impossível', '2026-02-30', '2026-03-05'],
    ['from posterior a to', '2026-10-30', '2026-10-27']
  ])(
    'recusa período com %s sem consultar o banco',
    async (_label, from, to) => {
      await expect(
        service.list({ ...pagination, from, to }, adminActor)
      ).rejects.toMatchObject({
        code: 'DADOS_INVALIDOS'
      })

      expect(list).not.toHaveBeenCalled()
      expect(doctorRepository.findByUserId).not.toHaveBeenCalled()
    }
  )

  it('calcula o total de páginas', async () => {
    list.mockResolvedValue({ items: [buildAppointment()], total: 45 })

    const result = await service.list({ page: 2, pageSize: 20 }, adminActor)

    expect(result.meta).toEqual({
      total: 45,
      page: 2,
      pageSize: 20,
      totalPages: 3
    })
  })
})
