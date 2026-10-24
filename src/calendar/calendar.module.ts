import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'

import { CalendarController } from './calendar.controller'
import { CalendarService } from './calendar.service'
import { AppointmentsModule } from '../appointments/appointments.module'
import { DoctorsModule } from '../doctors/doctors.module'
import { WorkScheduleModule } from '../work-schedule/work-schedule.module'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    DoctorsModule,
    WorkScheduleModule,
    AppointmentsModule
  ],
  controllers: [CalendarController],
  providers: [CalendarService]
})
export class CalendarModule {}
