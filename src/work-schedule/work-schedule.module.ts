import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'

import { WorkShift } from '../@common/entities/work-shift.entity'
import { DoctorsModule } from '../doctors/doctors.module'
import { WorkScheduleTypeormRepository } from './repositories/work-schedule-typeorm.repository'
import { WORK_SCHEDULE_REPOSITORY } from './repositories/work-schedule.repository'
import { WorkScheduleController } from './work-schedule.controller'
import { WorkScheduleService } from './work-schedule.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkShift]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    DoctorsModule
  ],
  controllers: [WorkScheduleController],
  providers: [
    WorkScheduleService,
    {
      provide: WORK_SCHEDULE_REPOSITORY,
      useClass: WorkScheduleTypeormRepository
    }
  ],
  exports: [WORK_SCHEDULE_REPOSITORY]
})
export class WorkScheduleModule {}
