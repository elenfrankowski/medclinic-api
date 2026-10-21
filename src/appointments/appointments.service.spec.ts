import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildAppointment,
  buildAppointmentRepositoryFake
} from './appointment.fixture'
import { AppointmentsService } from './appointments.service'
import {
  buildDoctor,
  buildDoctorRepositoryFake
} from '../doctors/doctor.fixture'
import {
  buildPatient,
  buildPatientRepositoryFake
} from '../patients/patient.fixture'
import {
  buildShift,
  buildWorkScheduleRepositoryFake
} from '../work-schedule/work-schedule.fixture'

describe('AppointmentsService', () => {
  const doctorRepository = buildDoctorRepositoryFake()
  const patientRepository = buildPatientRepositoryFake()
  const workScheduleRepository = buildWorkScheduleRepositoryFake()
  const { repository: appointmentRepository, transaction } =
    buildAppointmentRepositoryFake()
  let service: AppointmentsService

  const tuesdayMorning = buildShift({
    weekDay: 2,
    startTime: '08:00:00',
    endTime: '12:00:00',
    slotDurationMinutes: 30
  })
  const wednesdayOdd = buildShift({
    id: 2,
    weekDay: 3,
    startTime: '09:00:00',
    endTime: '10:00:00',
    slotDurationMinutes: 25
  })
  const dto = {
    doctorId: 3,
    patientId: 10,
    startsAt: '2026-10-27T08:00:00-03:00'
  }

  beforeEach(() => {
    vi.resetAllMocks()
    service = new AppointmentsService(
      appointmentRepository,
      doctorRepository,
      patientRepository,
      workScheduleRepository
    )
    doctorRepository.findById.mockResolvedValue(buildDoctor())
    patientRepository.findById.mockResolvedValue(buildPatient({ id: 10 }))
    workScheduleRepository.findShiftsByDoctor.mockResolvedValue([
      tuesdayMorning,
      wednesdayOdd
    ])
    transaction.doctorHasActiveAppointment.mockResolvedValue(false)
    transaction.patientHasActiveAppointment.mockResolvedValue(false)
    transaction.insert.mockImplementation((data) =>
      Promise.resolve(buildAppointment({ ...data }))
    )
  })

  it('cria a consulta somando a duração do turno ao início', async () => {
    const result = await service.create(dto)

    expect(transaction.insert).toHaveBeenCalledWith({
      doctorId: 3,
      patientId: 10,
      startsAt: new Date('2026-10-27T11:00:00.000Z'),
      endsAt: new Date('2026-10-27T11:30:00.000Z')
    })
    expect(result).toEqual({
      id: 41,
      doctorId: 3,
      patientId: 10,
      startsAt: '2026-10-27T11:00:00.000Z',
      endsAt: '2026-10-27T11:30:00.000Z',
      status: 'scheduled'
    })
  })

  it('verifica os conflitos do médico e do paciente no período calculado', async () => {
    await service.create(dto)

    const startsAt = new Date('2026-10-27T11:00:00.000Z')
    const endsAt = new Date('2026-10-27T11:30:00.000Z')
    expect(transaction.doctorHasActiveAppointment).toHaveBeenCalledWith(
      3,
      startsAt,
      endsAt
    )
    expect(transaction.patientHasActiveAppointment).toHaveBeenCalledWith(
      10,
      startsAt,
      endsAt
    )
  })

  it('recusa um startsAt que não é uma data válida, sem consultar o banco', async () => {
    await expect(
      service.create({ ...dto, startsAt: '2026-13-45T08:00:00-03:00' })
    ).rejects.toMatchObject({
      code: 'DADOS_INVALIDOS'
    })
    expect(doctorRepository.findById).not.toHaveBeenCalled()
  })

  it('recusa médico inexistente antes de procurar o paciente', async () => {
    doctorRepository.findById.mockResolvedValue(null)

    await expect(service.create(dto)).rejects.toMatchObject({
      code: 'RECURSO_NAO_ENCONTRADO'
    })
    expect(patientRepository.findById).not.toHaveBeenCalled()
  })

  it('recusa paciente inexistente antes de consultar a escala', async () => {
    patientRepository.findById.mockResolvedValue(null)

    await expect(service.create(dto)).rejects.toMatchObject({
      code: 'RECURSO_NAO_ENCONTRADO'
    })
    expect(workScheduleRepository.findShiftsByDoctor).not.toHaveBeenCalled()
  })

  it('recusa médico sem escala', async () => {
    workScheduleRepository.findShiftsByDoctor.mockResolvedValue([])

    await expect(service.create(dto)).rejects.toMatchObject({
      code: 'HORARIO_FORA_DA_ESCALA'
    })
    expect(transaction.insert).not.toHaveBeenCalled()
  })

  it('recusa horário fora de qualquer turno', async () => {
    await expect(
      service.create({ ...dto, startsAt: '2026-10-27T13:00:00-03:00' })
    ).rejects.toMatchObject({
      code: 'HORARIO_FORA_DA_ESCALA'
    })
    expect(transaction.insert).not.toHaveBeenCalled()
  })

  it('recusa horário desalinhado da grade do turno', async () => {
    await expect(
      service.create({ ...dto, startsAt: '2026-10-27T08:20:00-03:00' })
    ).rejects.toMatchObject({
      code: 'HORARIO_FORA_DA_ESCALA'
    })
    expect(transaction.insert).not.toHaveBeenCalled()
  })

  it('recusa consulta que não cabe inteira no fim do turno', async () => {
    await expect(
      service.create({ ...dto, startsAt: '2026-10-28T09:50:00-03:00' })
    ).rejects.toMatchObject({
      code: 'HORARIO_FORA_DA_ESCALA'
    })
    expect(transaction.insert).not.toHaveBeenCalled()
  })

  it('recusa conflito com consulta ativa do médico, sem verificar o paciente', async () => {
    transaction.doctorHasActiveAppointment.mockResolvedValue(true)

    await expect(service.create(dto)).rejects.toMatchObject({
      code: 'HORARIO_INDISPONIVEL'
    })
    expect(transaction.patientHasActiveAppointment).not.toHaveBeenCalled()
    expect(transaction.insert).not.toHaveBeenCalled()
  })

  it('recusa conflito com consulta ativa do paciente', async () => {
    transaction.patientHasActiveAppointment.mockResolvedValue(true)

    await expect(service.create(dto)).rejects.toMatchObject({
      code: 'PACIENTE_INDISPONIVEL'
    })
    expect(transaction.insert).not.toHaveBeenCalled()
  })
})
