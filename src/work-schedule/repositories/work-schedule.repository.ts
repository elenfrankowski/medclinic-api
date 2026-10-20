import type { WorkShift } from '../../@common/entities/work-shift.entity'

export const WORK_SCHEDULE_REPOSITORY = 'WORK_SCHEDULE_REPOSITORY'

export interface ShiftData {
  weekDay: number
  startTime: string
  endTime: string
  slotDurationMinutes: number
}

export interface WorkScheduleRepository {
  replaceShifts(doctorId: number, shifts: ShiftData[]): Promise<WorkShift[]>
  findShiftsByDoctor(doctorId: number): Promise<WorkShift[]>
}
