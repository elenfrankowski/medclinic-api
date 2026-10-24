import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AppointmentsModule } from './appointments/appointments.module'
import { AuthModule } from './auth/auth.module'
import { CalendarModule } from './calendar/calendar.module'
import { buildDataSourceOptions } from './database/database.config'
import { DoctorsModule } from './doctors/doctors.module'
import { HealthModule } from './health/health.module'
import { PatientsModule } from './patients/patients.module'
import { UsersModule } from './users/users.module'
import { WorkScheduleModule } from './work-schedule/work-schedule.module'

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...buildDataSourceOptions(), migrationsRun: true }),
    AuthModule,
    UsersModule,
    PatientsModule,
    DoctorsModule,
    WorkScheduleModule,
    AppointmentsModule,
    CalendarModule,
    HealthModule
  ]
})
export class AppModule {}
