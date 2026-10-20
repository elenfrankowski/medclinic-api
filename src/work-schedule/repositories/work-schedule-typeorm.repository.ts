import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'

import type {
  ShiftData,
  WorkScheduleRepository
} from './work-schedule.repository'
import { Doctor } from '../../@common/entities/doctor.entity'
import { WorkShift } from '../../@common/entities/work-shift.entity'

@Injectable()
export class WorkScheduleTypeormRepository implements WorkScheduleRepository {
  constructor(
    @InjectRepository(WorkShift)
    private readonly repository: Repository<WorkShift>,
    private readonly dataSource: DataSource
  ) {}

  replaceShifts(doctorId: number, shifts: ShiftData[]): Promise<WorkShift[]> {
    return this.dataSource.transaction(async (manager) => {
      // Trava a linha do médico: duas substituições simultâneas viram uma fila.
      await manager.findOne(Doctor, {
        where: { id: doctorId },
        lock: { mode: 'pessimistic_write' },
        loadEagerRelations: false
      })

      await manager.delete(WorkShift, { doctorId })
      if (shifts.length > 0) {
        await manager.insert(
          WorkShift,
          shifts.map((shift) => ({ ...shift, doctorId }))
        )
      }

      return manager.find(WorkShift, {
        where: { doctorId },
        order: { weekDay: 'ASC', startTime: 'ASC' }
      })
    })
  }

  findShiftsByDoctor(doctorId: number): Promise<WorkShift[]> {
    return this.repository.find({
      where: { doctorId },
      order: { weekDay: 'ASC', startTime: 'ASC' }
    })
  }
}
