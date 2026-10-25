import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'

import { MedicalRecordsController } from './medical-records.controller'
import { MedicalRecordsService } from './medical-records.service'
import { MedicalRecordTypeormRepository } from './repositories/medical-record-typeorm.repository'
import { MEDICAL_RECORD_REPOSITORY } from './repositories/medical-record.repository'
import { MedicalRecord } from '../@common/entities/medical-record.entity'
import { AppointmentsModule } from '../appointments/appointments.module'
import { DoctorsModule } from '../doctors/doctors.module'
import { PatientsModule } from '../patients/patients.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([MedicalRecord]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    PatientsModule,
    DoctorsModule,
    AppointmentsModule
  ],
  controllers: [MedicalRecordsController],
  providers: [
    MedicalRecordsService,
    {
      provide: MEDICAL_RECORD_REPOSITORY,
      useClass: MedicalRecordTypeormRepository
    }
  ]
})
export class MedicalRecordsModule {}
