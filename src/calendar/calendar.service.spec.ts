import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CalendarService } from './calendar.service'
import {
  buildAppointment,
  buildAppointmentRepositoryFake
} from '../appointments/appointment.fixture'
import {
  buildDoctor,
  buildDoctorRepositoryFake
} from '../doctors/doctor.fixture'
import {
  buildShift,
  buildWorkScheduleRepositoryFake
} from '../work-schedule/work-schedule.fixture'

describe('CalendarService', () => {
  const doctorRepository = buildDoctorRepositoryFake()
  const workScheduleRepository = buildWorkScheduleRepositoryFake()
  const { repository: appointmentRepository, findActiveByDoctorInPeriod } =
    buildAppointmentRepositoryFake()
  let service: CalendarService

  const query = { from: '2026-10-27', to: '2026-10-27' }

  beforeEach(() => {
    vi.resetAllMocks()
    service = new CalendarService(
      doctorRepository,
      workScheduleRepository,
      appointmentRepository
    )
    doctorRepository.findById.mockResolvedValue(buildDoctor())
    workScheduleRepository.findShiftsByDoctor.mockResolvedValue([buildShift()])
    findActiveByDoctorInPeriod.mockResolvedValue([buildAppointment()])
  })

  it('devolve a escala e as consultas ativas do período', async () => {
    const result = await service.get(3, query)

    expect(result).toEqual({
      doctorId: 3,
      from: '2026-10-27',
      to: '2026-10-27',
      workSchedule: {
        shifts: [
          {
            weekDay: 2,
            startTime: '08:00',
            endTime: '12:00',
            slotDurationMinutes: 30
          }
        ]
      },
      appointments: [
        {
          id: 41,
          doctorId: 3,
          patientId: 10,
          startsAt: '2026-10-27T11:00:00.000Z',
          endsAt: '2026-10-27T11:30:00.000Z',
          status: 'scheduled'
        }
      ]
    })
  })

  it('consulta as consultas pelo dia inteiro no fuso da clínica', async () => {
    await service.get(3, query)

    expect(findActiveByDoctorInPeriod).toHaveBeenCalledWith(
      3,
      new Date('2026-10-27T03:00:00.000Z'),
      new Date('2026-10-28T03:00:00.000Z')
    )
  })

  it('devolve listas vazias para médico sem escala e sem consultas', async () => {
    workScheduleRepository.findShiftsByDoctor.mockResolvedValue([])
    findActiveByDoctorInPeriod.mockResolvedValue([])

    const result = await service.get(3, query)

    expect(result.workSchedule).toEqual({ shifts: [] })
    expect(result.appointments).toEqual([])
  })

  it.each<[string, string, string]>([
    ['formato inválido', '27-10-2026', '2026-10-30'],
    ['from posterior a to', '2026-10-30', '2026-10-27'],
    ['intervalo acima do limite', '2026-10-01', '2026-11-02']
  ])('recusa %s sem consultar o banco', async (_label, from, to) => {
    await expect(service.get(3, { from, to })).rejects.toMatchObject({
      code: 'DADOS_INVALIDOS'
    })

    expect(doctorRepository.findById).not.toHaveBeenCalled()
    expect(findActiveByDoctorInPeriod).not.toHaveBeenCalled()
  })

  it('falha quando o médico não existe, sem consultar escala nem consultas', async () => {
    doctorRepository.findById.mockResolvedValue(null)

    await expect(service.get(99, query)).rejects.toMatchObject({
      code: 'RECURSO_NAO_ENCONTRADO'
    })

    expect(workScheduleRepository.findShiftsByDoctor).not.toHaveBeenCalled()
    expect(findActiveByDoctorInPeriod).not.toHaveBeenCalled()
  })
})
