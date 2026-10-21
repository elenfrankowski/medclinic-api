import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AppointmentsController } from './appointments.controller'
import { AppointmentsService } from './appointments.service'
import { Appointment } from '../@common/entities/appointment.entity'
import { DoctorsModule } from '../doctors/doctors.module'
import { PatientsModule } from '../patients/patients.module'
import { WorkScheduleModule } from '../work-schedule/work-schedule.module'
import { AppointmentTypeormRepository } from './repositories/appointment-typeorm.repository'
import { APPOINTMENT_REPOSITORY } from './repositories/appointment.repository'

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    DoctorsModule,
    PatientsModule,
    WorkScheduleModule
  ],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    { provide: APPOINTMENT_REPOSITORY, useClass: AppointmentTypeormRepository }
  ],
  exports: [APPOINTMENT_REPOSITORY]
})
export class AppointmentsModule {}
