import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildShift,
  buildWorkScheduleRepositoryFake
} from './work-schedule.fixture'
import { WorkScheduleService } from './work-schedule.service'
import {
  buildDoctor,
  buildDoctorRepositoryFake
} from '../doctors/doctor.fixture'

describe('WorkScheduleService', () => {
  const workScheduleRepository = buildWorkScheduleRepositoryFake()
  const doctorRepository = buildDoctorRepositoryFake()
  let service: WorkScheduleService

  const morning = {
    weekDay: 2,
    startTime: '08:00',
    endTime: '12:00',
    slotDurationMinutes: 30
  }
  const afternoon = {
    weekDay: 2,
    startTime: '14:00',
    endTime: '18:00',
    slotDurationMinutes: 20
  }

  beforeEach(() => {
    vi.resetAllMocks()
    service = new WorkScheduleService(workScheduleRepository, doctorRepository)
  })

  describe('replace', () => {
    it('recusa turno com início igual ou posterior ao término, sem consultar o banco', async () => {
      const shifts = [{ ...morning, startTime: '12:00', endTime: '08:00' }]

      await expect(service.replace(3, { shifts })).rejects.toMatchObject({
        code: 'DADOS_INVALIDOS'
      })
      expect(doctorRepository.findById).not.toHaveBeenCalled()
      expect(workScheduleRepository.replaceShifts).not.toHaveBeenCalled()
    })

    it('recusa turnos sobrepostos no mesmo dia da semana', async () => {
      const shifts = [morning, { ...afternoon, startTime: '11:00' }]

      await expect(service.replace(3, { shifts })).rejects.toMatchObject({
        code: 'DADOS_INVALIDOS'
      })
      expect(workScheduleRepository.replaceShifts).not.toHaveBeenCalled()
    })

    it('aceita turnos encostados no mesmo dia', async () => {
      const touching = [morning, { ...afternoon, startTime: '12:00' }]
      doctorRepository.findById.mockResolvedValue(buildDoctor())
      workScheduleRepository.replaceShifts.mockResolvedValue([])

      await service.replace(3, { shifts: touching })

      expect(workScheduleRepository.replaceShifts).toHaveBeenCalledWith(
        3,
        touching
      )
    })

    it('falha quando o médico não existe, sem gravar', async () => {
      doctorRepository.findById.mockResolvedValue(null)

      await expect(
        service.replace(99, { shifts: [morning] })
      ).rejects.toMatchObject({
        code: 'RECURSO_NAO_ENCONTRADO'
      })
      expect(workScheduleRepository.replaceShifts).not.toHaveBeenCalled()
    })

    it('substitui a escala e devolve os horários no formato HH:MM', async () => {
      doctorRepository.findById.mockResolvedValue(buildDoctor())
      workScheduleRepository.replaceShifts.mockResolvedValue([
        buildShift({ id: 1 }),
        buildShift({
          id: 2,
          startTime: '14:00:00',
          endTime: '18:00:00',
          slotDurationMinutes: 20
        })
      ])

      const result = await service.replace(3, { shifts: [morning, afternoon] })

      expect(workScheduleRepository.replaceShifts).toHaveBeenCalledWith(3, [
        morning,
        afternoon
      ])
      expect(result).toEqual({ shifts: [morning, afternoon] })
    })

    it('aceita uma lista vazia e deixa o médico sem escala', async () => {
      doctorRepository.findById.mockResolvedValue(buildDoctor())
      workScheduleRepository.replaceShifts.mockResolvedValue([])

      const result = await service.replace(3, { shifts: [] })

      expect(workScheduleRepository.replaceShifts).toHaveBeenCalledWith(3, [])
      expect(result).toEqual({ shifts: [] })
    })
  })

  describe('get', () => {
    it('falha quando o médico não existe', async () => {
      doctorRepository.findById.mockResolvedValue(null)

      await expect(service.get(99)).rejects.toMatchObject({
        code: 'RECURSO_NAO_ENCONTRADO'
      })
    })

    it('devolve a lista vazia quando o médico não tem escala', async () => {
      doctorRepository.findById.mockResolvedValue(buildDoctor())
      workScheduleRepository.findShiftsByDoctor.mockResolvedValue([])

      await expect(service.get(3)).resolves.toEqual({ shifts: [] })
    })

    it('devolve os turnos do médico', async () => {
      doctorRepository.findById.mockResolvedValue(buildDoctor())
      workScheduleRepository.findShiftsByDoctor.mockResolvedValue([
        buildShift()
      ])

      await expect(service.get(3)).resolves.toEqual({ shifts: [morning] })
    })
  })
})
