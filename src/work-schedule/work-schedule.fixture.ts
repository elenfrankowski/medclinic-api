import { vi } from 'vitest'

import type { WorkScheduleRepository } from './repositories/work-schedule.repository'
import type { WorkShift } from '../@common/entities/work-shift.entity'

export function buildShift(overrides: Partial<WorkShift> = {}): WorkShift {
  return {
    id: 1,
    doctorId: 3,
    weekDay: 2,
    startTime: '08:00:00',
    endTime: '12:00:00',
    slotDurationMinutes: 30,
    ...overrides
  }
}

export function buildWorkScheduleRepositoryFake() {
  return {
    replaceShifts: vi.fn<WorkScheduleRepository['replaceShifts']>(),
    findShiftsByDoctor: vi.fn<WorkScheduleRepository['findShiftsByDoctor']>()
  }
}
